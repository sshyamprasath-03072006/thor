/**
 * RiskZoneSyncService.ts (Web Version)
 * --------------------------------------
 * Syncs risk zone data from the backend API when the app gains connectivity.
 *
 * Replaces MMKV with localStorage for lastSyncTimestamp storage.
 * Replaces NetInfo with window 'online' event listener.
 *
 * Sync flow:
 *  1. Listen for 'online' events.
 *  2. On connectivity restore: GET /api/risk-zones?city={city}&since={lastSync}
 *  3. Upsert returned zones into local IndexedDB.
 *  4. Update lastSyncTimestamp in localStorage.
 */

import { RiskZone, riskZoneDB } from '../data/riskZoneDB';

// ─── Constants ───────────────────────────────────────────────────────────────

const SYNC_API_URL = '/api/risk-zones';
const LS_LAST_SYNC_KEY = 'thor_risk_zone_last_sync';

// ─── Service Class ───────────────────────────────────────────────────────────

export class RiskZoneSyncService {
    private apiBaseUrl: string;
    private isSyncing = false;
    private currentCity: string | null = null;

    private onlineListener: () => void;

    constructor(apiBaseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;

        this.onlineListener = async () => {
            console.log('[RiskZoneSync] Device is online — attempting sync.');
            if (!this.isSyncing && this.currentCity) {
                await this.syncZones(this.currentCity);
            }
        };
    }

    // ── Start / Stop Listening ──────────────────────────────────────────────

    /**
     * Begin listening for connectivity changes and set the active city.
     *
     * @param city  The city to sync risk zones for.
     */
    startListening(city: string): void {
        this.currentCity = city.toLowerCase();
        window.addEventListener('online', this.onlineListener);
        console.log(`[RiskZoneSync] Listening for online events (city: ${city}).`);

        // Attempt immediate sync if currently online
        if (navigator.onLine && !this.isSyncing) {
            this.syncZones(this.currentCity);
        }
    }

    stopListening(): void {
        window.removeEventListener('online', this.onlineListener);
        this.currentCity = null;
        console.log('[RiskZoneSync] Stopped listening.');
    }

    // ── Sync Zones ──────────────────────────────────────────────────────────

    /**
     * Fetch updated risk zones from the backend and merge into IndexedDB.
     *
     * Delta sync: we pass `since={lastSyncTimestamp}` so the server only
     * returns zones updated after our last sync. This minimizes payload
     * size and bandwidth usage.
     *
     * If the server returns an empty array, no zones have changed.
     */
    async syncZones(city: string): Promise<void> {
        this.isSyncing = true;

        try {
            const lastSync = this.getLastSyncTimestamp(city);
            const url = `${this.apiBaseUrl}${SYNC_API_URL}?city=${encodeURIComponent(city)}&since=${lastSync}`;

            console.log(`[RiskZoneSync] Fetching: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                console.warn(`[RiskZoneSync] Server responded ${response.status} — skipping sync.`);
                return;
            }

            const data = await response.json();

            // Expect { zones: RiskZone[] } or a raw array
            const zones: RiskZone[] = Array.isArray(data) ? data : (data.zones ?? []);

            if (zones.length === 0) {
                console.log('[RiskZoneSync] No new zones to sync.');
                return;
            }

            // Upsert into IndexedDB (riskZoneDB.insertZones uses `put` = upsert)
            await riskZoneDB.insertZones(zones);
            this.setLastSyncTimestamp(city, Date.now());

            console.log(`[RiskZoneSync] Synced ${zones.length} zone(s) for ${city}.`);
        } catch (err) {
            console.error('[RiskZoneSync] Sync failed:', err);
            // Don't throw — will retry on next online event
        } finally {
            this.isSyncing = false;
        }
    }

    // ── Force Sync ──────────────────────────────────────────────────────────

    /**
     * Force a full sync (ignores lastSyncTimestamp).
     * Useful when the user manually triggers a refresh.
     */
    async forceSyncAll(city: string): Promise<void> {
        this.clearLastSyncTimestamp(city);
        await this.syncZones(city);
    }

    // ── Timestamp Helpers ───────────────────────────────────────────────────

    private getLastSyncTimestamp(city: string): number {
        const key = `${LS_LAST_SYNC_KEY}_${city.toLowerCase()}`;
        const raw = localStorage.getItem(key);
        return raw ? parseInt(raw, 10) : 0;
    }

    private setLastSyncTimestamp(city: string, timestamp: number): void {
        const key = `${LS_LAST_SYNC_KEY}_${city.toLowerCase()}`;
        localStorage.setItem(key, String(timestamp));
    }

    private clearLastSyncTimestamp(city: string): void {
        const key = `${LS_LAST_SYNC_KEY}_${city.toLowerCase()}`;
        localStorage.removeItem(key);
    }
}

// Singleton
export const riskZoneSyncService = new RiskZoneSyncService();
