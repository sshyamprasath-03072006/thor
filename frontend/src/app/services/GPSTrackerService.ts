/**
 * GPSTrackerService.ts (Web Version)
 * ---------------------
 * Background GPS tracking service using Web APIs.
 *
 * Replaces react-native-background-fetch -> setInterval / requestAnimationFrame
 * Replaces react-native-sqlite-storage -> IndexedDB
 * Replaces react-native-mmkv -> localStorage
 * Replaces @react-native-community/geolocation -> navigator.geolocation
 */

export interface GPSPosition {
    lat: number;
    lng: number;
    timestamp: number;
}

export interface GPSLogRow {
    id?: number; // IndexedDB autoincrement
    tourist_id: string;
    lat: number;
    lng: number;
    timestamp: number;
    synced: number; // 0 = pending, 1 = synced
}

const TRACKING_INTERVAL_MS = 60000;
const LOCATION_API_URL = '/api/location';
const DB_NAME = 'thor_gps_web';
const STORE_NAME = 'gps_logs';
const LS_LAST_POSITION_KEY = 'gps_last_position';

export class GPSTrackerService {
    private db: IDBDatabase | null = null;
    private touristId: string | null = null;
    private isTracking = false;
    private apiBaseUrl: string;
    private timerId: number | null = null;

    constructor(apiBaseUrl: string = 'https://thor-backend.onrender.com') {
        this.apiBaseUrl = apiBaseUrl;
    }

    // ── IndexedDB Initialisation ─────────────────────────────────────────────

    private initDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve();

            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    // Index to quickly find unsynced rows
                    store.createIndex('synced', 'synced', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = (event) => {
                console.error('[GPSTracker Web] IndexedDB error:', event);
                reject(request.error);
            };
        });
    }

    // ── Start Tracking ──────────────────────────────────────────────────────

    async startTracking(touristId: string): Promise<void> {
        if (this.isTracking) return;

        this.touristId = touristId;
        await this.initDatabase();

        this.isTracking = true;
        console.log(`[GPSTracker Web] Tracking started for tourist: ${touristId}`);

        // Fire immediately, then every 60s
        this.onTick();
        this.timerId = window.setInterval(() => this.onTick(), TRACKING_INTERVAL_MS);
    }

    stopTracking(): void {
        if (!this.isTracking) return;

        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.isTracking = false;
        this.touristId = null;
        console.log('[GPSTracker Web] Tracking stopped.');
    }

    // ── Last Known Position ─────────────────────────────────────────────────

    getLastKnownPosition(): GPSPosition | null {
        const raw = localStorage.getItem(LS_LAST_POSITION_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as GPSPosition;
        } catch {
            return null;
        }
    }

    // ── Pending Sync Count ──────────────────────────────────────────────────

    getPendingSyncCount(): Promise<number> {
        return new Promise((resolve) => {
            if (!this.db) return resolve(0);

            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('synced');

            const request = index.count(IDBKeyRange.only(0));

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
        });
    }

    // ── Core Tick Logic ─────────────────────────────────────────────────────

    private async onTick(): Promise<void> {
        if (!this.touristId) return;

        try {
            const position = await this.getCurrentPosition();
            const timestamp = Date.now();

            await this.insertGPSLog(this.touristId, position.lat, position.lng, timestamp);

            localStorage.setItem(
                LS_LAST_POSITION_KEY,
                JSON.stringify({ lat: position.lat, lng: position.lng, timestamp })
            );

            // Simple connectivity check before sync
            if (navigator.onLine) {
                await this.syncSingleRecord(this.touristId, position.lat, position.lng, timestamp);
            }
        } catch (err) {
            console.error('[GPSTracker Web] onTick error:', err);
        }
    }

    // ── Navigator Geolocation ───────────────────────────────────────────────

    private getCurrentPosition(): Promise<GPSPosition> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error('Geolocation not supported by this browser.'));
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    timestamp: pos.timestamp,
                }),
                (error) => reject(new Error(error.message)),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    }

    // ── IndexedDB Insert ────────────────────────────────────────────────────

    private insertGPSLog(touristId: string, lat: number, lng: number, timestamp: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('DB not initialized'));

            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const record: GPSLogRow = {
                tourist_id: touristId,
                lat, lng, timestamp,
                synced: 0
            };

            const request = store.add(record);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ── Immediate Single-Record Sync ────────────────────────────────────────

    private async syncSingleRecord(touristId: string, lat: number, lng: number, timestamp: number): Promise<void> {
        try {
            const response = await fetch(`${this.apiBaseUrl}${LOCATION_API_URL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ touristId, lat, lng, timestamp }),
            });

            if (response.ok && this.db) {
                // Find the record we just inserted (by guessing params) and mark synced
                const tx = this.db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const index = store.index('synced');

                const req = index.openCursor(IDBKeyRange.only(0));
                req.onsuccess = (e) => {
                    const cursor = (e.target as IDBRequest).result;
                    if (cursor) {
                        const val = cursor.value as GPSLogRow;
                        if (val.lat === lat && val.lng === lng && val.timestamp === timestamp) {
                            val.synced = 1;
                            cursor.update(val);
                        } else {
                            cursor.continue();
                        }
                    }
                };
            }
        } catch (err) {
            console.warn('[GPSTracker Web] Immediate sync failed:', err);
        }
    }
}

export const gpsTrackerService = new GPSTrackerService();
