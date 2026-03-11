/**
 * SOSEngine.ts (Web Version)
 * ---------------------------
 * Core SOS triggering engine for the Tourist Safety Platform.
 *
 * Web adaptations:
 *  - react-native-sms → SMS via `tel:` links + Web Share API
 *  - react-native-sqlite-storage → IndexedDB for sos_events
 *  - GPSTrackerService.getLastKnownPosition → localStorage cache
 *  - Notifee → Web Notifications API (AlertService from Phase 2)
 *
 * Flow:
 *  1. Get GPS + reverse geocode (offline: nearest city from registry)
 *  2. Build SOS message
 *  3. Send SMS/share to all contacts + APP_SOS_NUMBER
 *  4. POST to backend /api/sos if online
 *  5. 30s countdown → resend if not cancelled
 *  6. Log event to IndexedDB
 *  7. Emit state change for UI
 */

import { emergencyContactsService, APP_SOS_NUMBER } from './EmergencyContactsService';
import { alertService } from './AlertService';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SOSTriggerReason = 'button' | 'voice' | 'ai_detected';

export interface SOSEvent {
    id?: number;
    tourist_id: string;
    lat: number;
    lng: number;
    location_name: string;
    reason: SOSTriggerReason;
    timestamp: number;
    cancelled: boolean;
}

export type SOSState = 'idle' | 'countdown' | 'active' | 'cancelled';

type SOSStateListener = (state: SOSState) => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const DB_NAME = 'thor_sos_events';
const STORE_NAME = 'sos_events';
const COUNTDOWN_SECONDS = 5;
const RESEND_DELAY_MS = 30_000;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── City Registry (simplified for reverse geocoding) ────────────────────────

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Goa': { lat: 15.4909, lng: 73.8278 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
};

// ─── Service Class ───────────────────────────────────────────────────────────

export class SOSEngine {
    private state: SOSState = 'idle';
    private countdownTimer: number | null = null;
    private resendTimer: number | null = null;
    private eventsDb: IDBDatabase | null = null;
    private touristId: string = '';
    private lastSOSMessage: string = '';
    private lastLocation: { lat: number; lng: number; name: string } | null = null;
    private listeners: SOSStateListener[] = [];

    // ── State Management ────────────────────────────────────────────────────

    getState(): SOSState { return this.state; }
    isSosActive(): boolean { return this.state === 'active'; }

    onStateChange(listener: SOSStateListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private setState(newState: SOSState): void {
        this.state = newState;
        this.listeners.forEach(l => l(newState));
    }

    getLastLocation() { return this.lastLocation; }

    // ── Trigger SOS ─────────────────────────────────────────────────────────

    /**
     * Main SOS trigger with countdown.
     *
     * Starts a 5-second countdown. If not cancelled, proceeds with the
     * full SOS flow (SMS, API call, resend timer).
     */
    async triggerSOS(reason: SOSTriggerReason, touristId?: string): Promise<void> {
        if (this.state === 'active' || this.state === 'countdown') {
            console.warn('[SOSEngine] SOS already active or counting down.');
            return;
        }

        this.touristId = touristId || localStorage.getItem('thor_user_id') || 'UNKNOWN';
        this.setState('countdown');

        console.log(`[SOSEngine] Countdown started — reason: ${reason}`);

        // 5-second countdown before firing
        return new Promise<void>((resolve) => {
            this.countdownTimer = window.setTimeout(async () => {
                this.countdownTimer = null;
                await this.executeSOS(reason);
                resolve();
            }, COUNTDOWN_SECONDS * 1000);
        });
    }

    // ── Execute SOS (after countdown) ───────────────────────────────────────

    private async executeSOS(reason: SOSTriggerReason): Promise<void> {
        this.setState('active');
        console.log('[SOSEngine] 🆘 SOS ACTIVATED');

        try {
            // STEP 1: Get GPS
            const position = await this.getPosition();

            // STEP 2: Reverse geocode (offline: nearest city)
            const locationName = this.reverseGeocode(position.lat, position.lng);
            this.lastLocation = { ...position, name: locationName };

            // STEP 3: Build message
            const timestamp = new Date().toISOString();
            this.lastSOSMessage = [
                '🆘 SOS ALERT',
                `User: ${this.touristId}`,
                `Lat: ${position.lat.toFixed(6)}`,
                `Lng: ${position.lng.toFixed(6)}`,
                `Location: ${locationName}`,
                `Time: ${timestamp}`,
                `Reason: ${reason}`,
                '',
                `Google Maps: https://maps.google.com/?q=${position.lat},${position.lng}`,
            ].join('\n');

            // STEP 4: Send to all contacts
            await this.sendToAllContacts(this.lastSOSMessage);

            // STEP 5: POST to backend if online
            if (navigator.onLine) {
                this.postToBackend(position.lat, position.lng, locationName, reason);
            }

            // STEP 6: 30-second resend timer
            this.resendTimer = window.setTimeout(async () => {
                if (this.state === 'active') {
                    console.log('[SOSEngine] Resending SOS...');
                    await this.sendToAllContacts(this.lastSOSMessage);
                }
            }, RESEND_DELAY_MS);

            // STEP 7: Log event
            await this.logEvent({
                tourist_id: this.touristId,
                lat: position.lat,
                lng: position.lng,
                location_name: locationName,
                reason,
                timestamp: Date.now(),
                cancelled: false,
            });

            // STEP 8: Fire notification
            alertService.sendRiskAlert(
                {
                    id: 'sos-active',
                    city: locationName,
                    lat: position.lat,
                    lng: position.lng,
                    radius_meters: 0,
                    risk_level: 'critical',
                    category: 'crime',
                    reason: `🆘 SOS Active — Help is on the way. Location: ${locationName}`,
                    active_hours_start: null,
                    active_hours_end: null,
                    updated_at: Date.now(),
                },
                1.0,
            );
        } catch (err) {
            console.error('[SOSEngine] Error during SOS execution:', err);
            // Still keep active state — partial SOS is better than none
        }
    }

    // ── Cancel SOS ──────────────────────────────────────────────────────────

    async cancelSOS(): Promise<void> {
        // Clear timers
        if (this.countdownTimer !== null) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }
        if (this.resendTimer !== null) {
            clearTimeout(this.resendTimer);
            this.resendTimer = null;
        }

        // If SOS was active, send cancellation message
        if (this.state === 'active') {
            const cancelMsg = `✅ SOS CANCELLED — Tourist is safe.\nID: ${this.touristId}\nTime: ${new Date().toISOString()}`;
            await this.sendToAllContacts(cancelMsg);

            // POST cancellation to backend
            if (navigator.onLine) {
                try {
                    await fetch(`${API_URL}/api/sos/cancel`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tourist_id: this.touristId }),
                    });
                } catch { /* best effort */ }
            }
        }

        this.setState('cancelled');
        // Reset to idle after brief delay
        setTimeout(() => this.setState('idle'), 2000);

        console.log('[SOSEngine] SOS cancelled.');
    }

    // ── Send to All Contacts ────────────────────────────────────────────────

    /**
     * In a web browser, we can't send SMS directly.
     * Strategy:
     *  1. Try Web Share API (works on mobile browsers — can share to SMS apps)
     *  2. Fall back to opening sms: links for each contact
     *  3. Always try the backend API for server-side SMS (Twilio)
     */
    private async sendToAllContacts(message: string): Promise<void> {
        const contacts = await emergencyContactsService.getAllContacts();
        const tourOrganizer = emergencyContactsService.getTourOrganizer();

        const allPhones = [
            ...contacts.map(c => c.phone),
            APP_SOS_NUMBER,
        ];

        if (tourOrganizer) {
            allPhones.push(tourOrganizer.phone);
        }

        // Try Web Share API first (mobile browsers)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '🆘 SOS ALERT — THOR Safety',
                    text: message,
                });
                console.log('[SOSEngine] Shared via Web Share API.');
                return;
            } catch {
                // User cancelled share or not supported for SMS
            }
        }

        // Fall back: open SMS links (will prompt user on each)
        // On mobile browsers, sms: links open the SMS app
        for (const phone of allPhones.slice(0, 3)) { // Limit to 3 to avoid spam popups
            try {
                const smsUrl = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(message)}`;
                window.open(smsUrl, '_blank');
            } catch {
                console.warn(`[SOSEngine] Could not open SMS for ${phone}`);
            }
        }

        // Also send via backend (Twilio) if online
        if (navigator.onLine) {
            try {
                await fetch(`${API_URL}/api/sos/sms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phones: allPhones,
                        message,
                        tourist_id: this.touristId,
                    }),
                });
                console.log('[SOSEngine] SMS request sent to backend.');
            } catch {
                console.warn('[SOSEngine] Backend SMS request failed.');
            }
        }
    }

    // ── Backend API ─────────────────────────────────────────────────────────

    private async postToBackend(
        lat: number, lng: number, location: string, reason: string,
    ): Promise<void> {
        try {
            await fetch(`${API_URL}/api/sos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tourist_id: this.touristId,
                    lat, lng, location, reason,
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch {
            console.warn('[SOSEngine] Failed to POST SOS to backend.');
        }
    }

    // ── GPS ─────────────────────────────────────────────────────────────────

    private getPosition(): Promise<{ lat: number; lng: number }> {
        // Try live GPS first, fall back to cached
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(this.getCachedPosition());
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(this.getCachedPosition()),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 },
            );
        });
    }

    private getCachedPosition(): { lat: number; lng: number } {
        const cached = localStorage.getItem('thor_last_position');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch { /* fall through */ }
        }
        // Default: Chennai (reasonable fallback for India-based app)
        return { lat: 13.0827, lng: 80.2707 };
    }

    // ── Reverse Geocode (Offline) ───────────────────────────────────────────

    private reverseGeocode(lat: number, lng: number): string {
        let nearest = 'Unknown Location';
        let minDist = Infinity;

        for (const [city, center] of Object.entries(CITY_CENTERS)) {
            const dist = Math.sqrt(
                (lat - center.lat) ** 2 + (lng - center.lng) ** 2,
            );
            if (dist < minDist) {
                minDist = dist;
                nearest = city;
            }
        }

        return `Near ${nearest}, India`;
    }

    // ── Event Logging (IndexedDB) ───────────────────────────────────────────

    private async initEventsDB(): Promise<void> {
        if (this.eventsDb) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.eventsDb = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    private async logEvent(event: SOSEvent): Promise<void> {
        await this.initEventsDB();

        return new Promise((resolve) => {
            const tx = this.eventsDb!.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).add(event);
            tx.oncomplete = () => resolve();
        });
    }
}

// Singleton
export const sosEngine = new SOSEngine();
