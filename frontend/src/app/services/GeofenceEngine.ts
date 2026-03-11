/**
 * GeofenceEngine.ts (Web Version)
 * ---------------------------------
 * Checks a tourist's GPS position against local risk zones using the
 * Haversine distance formula and time-aware filtering.
 *
 * Core features:
 *  1. checkPosition()  — returns all risk zones the position falls within.
 *  2. calculateRiskScore() — composite 0.0–1.0 score with night multiplier.
 *  3. startMonitoring() — subscribes to GPS updates and auto-alerts.
 *  4. stopMonitoring()  — unsubscribes.
 */

import { RiskZone, riskZoneDB } from '../data/riskZoneDB';
import { alertService } from './AlertService';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface ZoneEvent {
    id?: number;
    tourist_id: string;
    zone_id: string;
    risk_level: string;
    lat: number;
    lng: number;
    timestamp: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Earth's mean radius in meters (WGS-84). */
const EARTH_RADIUS_M = 6_371_000;

/** Risk level weights for the composite scoring formula. */
const RISK_WEIGHTS: Record<string, number> = {
    critical: 1.0,
    high: 0.75,
    medium: 0.4,
    low: 0.2,
};

/** Score threshold above which an alert is triggered. */
const ALERT_THRESHOLD = 0.6;

/** Minimum cooldown between alerts to prevent spam (5 minutes). */
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

/** Night hours when the time multiplier is 1.0 (20:00–06:00). */
const NIGHT_START = 20;
const NIGHT_END = 6;

const ZONE_EVENTS_DB = 'thor_zone_events';
const ZONE_EVENTS_STORE = 'zone_events';

// ─── Haversine Formula ───────────────────────────────────────────────────────

/**
 * Calculate the great-circle distance between two points on Earth.
 *
 * Returns distance in **meters**.
 *
 * The Haversine formula is chosen over Vincenty because:
 *  - It's simpler and faster to compute.
 *  - For the distances we deal with (< 50 km), the error vs. Vincenty
 *    is negligible (< 0.3%).
 */
function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_M * c;
}

// ─── Active Hours Check ──────────────────────────────────────────────────────

/**
 * Determine if a zone is currently active given the hour of day.
 *
 * Handles wrap-around (e.g. start=22, end=5 means "10 PM to 5 AM").
 * If start or end is null, the zone is always active.
 */
function isZoneActiveNow(zone: RiskZone, currentHour: number): boolean {
    if (zone.active_hours_start === null || zone.active_hours_end === null) {
        return true; // always active
    }

    const start = zone.active_hours_start;
    const end = zone.active_hours_end;

    if (start <= end) {
        // Simple range: e.g. 8–18
        return currentHour >= start && currentHour < end;
    } else {
        // Wrap-around: e.g. 22–5
        return currentHour >= start || currentHour < end;
    }
}

// ─── Service Class ───────────────────────────────────────────────────────────

export class GeofenceEngine {
    private watchId: number | null = null;
    private monitoringInterval: number | null = null;
    private lastAlertTimestamp = 0;
    private touristId: string | null = null;
    private city: string | null = null;
    private eventsDb: IDBDatabase | null = null;

    // ── Check Position ──────────────────────────────────────────────────────

    /**
     * Given a lat/lng and city, return all risk zones the point falls within.
     *
     * Steps:
     *  1. Load all zones for the city from IndexedDB.
     *  2. For each zone, calculate haversine distance from the point.
     *  3. Filter to zones where distance ≤ radius_meters.
     *  4. Filter to zones that are active at the current hour.
     *  5. Sort by risk_level descending (critical first).
     */
    async checkPosition(lat: number, lng: number, city: string): Promise<RiskZone[]> {
        const zones = await riskZoneDB.loadZonesForCity(city.toLowerCase());
        const currentHour = new Date().getHours();

        const riskOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

        return zones
            .filter((zone) => {
                const distance = haversineDistance(lat, lng, zone.lat, zone.lng);
                return distance <= zone.radius_meters && isZoneActiveNow(zone, currentHour);
            })
            .sort((a, b) => (riskOrder[b.risk_level] || 0) - (riskOrder[a.risk_level] || 0));
    }

    // ── Calculate Risk Score ────────────────────────────────────────────────

    /**
     * Compute a composite risk score from 0.0 to 1.0.
     *
     * Formula:
     *   rawScore = sum of (weight for each matched zone's risk_level)
     *   normalized = min(rawScore / 2.0, 1.0)   ← cap at 1.0
     *   finalScore = normalized × timeMultiplier
     *
     * Time multiplier:
     *   - Night (20:00–06:00): 1.0 — full weight, dangers are amplified.
     *   - Day (06:00–20:00):   0.5 — reduced weight, most areas are safer.
     *
     * Why divide by 2.0?
     *   - A single "critical" zone gives rawScore = 1.0 → normalized = 0.5.
     *   - Two overlapping high zones give 1.5 → normalized = 0.75.
     *   - This prevents single low-risk zones from dominating the score.
     */
    calculateRiskScore(zones: RiskZone[], hour: number): number {
        if (zones.length === 0) return 0;

        const rawScore = zones.reduce((sum, zone) => {
            return sum + (RISK_WEIGHTS[zone.risk_level] || 0);
        }, 0);

        const normalized = Math.min(rawScore / 2.0, 1.0);

        // Night multiplier: 1.0 at night, 0.5 during the day
        const isNight = hour >= NIGHT_START || hour < NIGHT_END;
        const timeMultiplier = isNight ? 1.0 : 0.5;

        return Math.round(normalized * timeMultiplier * 100) / 100; // 2 decimal places
    }

    // ── Start Monitoring ────────────────────────────────────────────────────

    /**
     * Begin continuous geofence monitoring.
     *
     * On each GPS tick (every 60s):
     *  1. Run checkPosition to find nearby risk zones.
     *  2. Calculate composite risk score.
     *  3. If score > 0.6 AND cooldown has elapsed → fire alert.
     *  4. Log all zone entries to IndexedDB for analytics.
     */
    async startMonitoring(touristId: string, city: string): Promise<void> {
        this.touristId = touristId;
        this.city = city.toLowerCase();

        await this.initEventsDB();

        console.log(`[GeofenceEngine] Monitoring started for ${touristId} in ${city}.`);

        // Use setInterval + navigator.geolocation (same pattern as GPSTrackerService)
        const tick = async () => {
            try {
                const pos = await this.getCurrentPosition();
                const matchedZones = await this.checkPosition(pos.lat, pos.lng, this.city!);

                if (matchedZones.length > 0) {
                    const currentHour = new Date().getHours();
                    const score = this.calculateRiskScore(matchedZones, currentHour);

                    // Log zone events
                    await this.logZoneEvents(matchedZones, pos.lat, pos.lng);

                    // Alert if threshold exceeded and cooldown elapsed
                    const now = Date.now();
                    if (score > ALERT_THRESHOLD && now - this.lastAlertTimestamp > ALERT_COOLDOWN_MS) {
                        // Alert for the highest-severity zone
                        const topZone = matchedZones[0];
                        alertService.sendRiskAlert(topZone, score);
                        this.lastAlertTimestamp = now;
                    }
                }
            } catch (err) {
                console.error('[GeofenceEngine] Monitoring tick error:', err);
            }
        };

        // Fire immediately, then every 60 seconds
        tick();
        this.monitoringInterval = window.setInterval(tick, 60_000);
    }

    // ── Stop Monitoring ─────────────────────────────────────────────────────

    stopMonitoring(): void {
        if (this.monitoringInterval !== null) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.touristId = null;
        this.city = null;
        console.log('[GeofenceEngine] Monitoring stopped.');
    }

    // ── Private: Get Current Position ───────────────────────────────────────

    private getCurrentPosition(): Promise<{ lat: number; lng: number }> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error('Geolocation not supported.'));
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
            );
        });
    }

    // ── Private: Zone Events DB ─────────────────────────────────────────────

    private initEventsDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.eventsDb) return resolve();

            const request = indexedDB.open(ZONE_EVENTS_DB, 1);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(ZONE_EVENTS_STORE)) {
                    const store = db.createObjectStore(ZONE_EVENTS_STORE, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    store.createIndex('tourist_id', 'tourist_id', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.eventsDb = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    private async logZoneEvents(zones: RiskZone[], lat: number, lng: number): Promise<void> {
        if (!this.eventsDb || !this.touristId) return;

        const tx = this.eventsDb.transaction(ZONE_EVENTS_STORE, 'readwrite');
        const store = tx.objectStore(ZONE_EVENTS_STORE);

        for (const zone of zones) {
            const event: ZoneEvent = {
                tourist_id: this.touristId,
                zone_id: zone.id,
                risk_level: zone.risk_level,
                lat, lng,
                timestamp: Date.now(),
            };
            store.add(event);
        }
    }
}

// Singleton
export const geofenceEngine = new GeofenceEngine();

// Export the haversine function for testing
export { haversineDistance };
