/**
 * OfflineSyncService.ts (Web Version)
 * ----------------------
 * Flushes unsynced GPS logs in IndexedDB to the backend when online.
 * Replaces @react-native-community/netinfo with window 'online' event.
 */

import { GPSLogRow } from './GPSTrackerService';

const BATCH_SIZE = 50;
const BATCH_SYNC_URL = '/api/location/batch';
const DB_NAME = 'thor_gps_web';
const STORE_NAME = 'gps_logs';

export class OfflineSyncService {
    private db: IDBDatabase | null = null;
    private isSyncing = false;
    private apiBaseUrl: string;

    private onlineListener: () => void;

    constructor(apiBaseUrl: string = 'https://thor-backend.onrender.com') {
        this.apiBaseUrl = apiBaseUrl;

        // Bind to properly removeEventListener later
        this.onlineListener = async () => {
            console.log('[OfflineSync Web] Device online. Attempting flush.');
            if (!this.isSyncing) await this.flushQueue();
        };
    }

    // ── Database Initialisation ──────────────────────────────────────────────

    private initDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve();

            const request = indexedDB.open(DB_NAME, 1);

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = (event) => {
                console.error('[OfflineSync Web] DB load error:', event);
                reject(request.error);
            };
        });
    }

    // ── Start/Stop Listening ───────────────────────────────────────────────

    startListening(): void {
        window.addEventListener('online', this.onlineListener);
        console.log('[OfflineSync Web] Listening for online events.');

        // Attempt immediate flush if currently online
        if (navigator.onLine && !this.isSyncing) {
            this.flushQueue();
        }
    }

    stopListening(): void {
        window.removeEventListener('online', this.onlineListener);
        console.log('[OfflineSync Web] Stopped listening.');
    }

    // ── Flush Queue ─────────────────────────────────────────────────────────

    async flushQueue(): Promise<void> {
        this.isSyncing = true;
        console.log('[OfflineSync Web] Flushing queue...');

        try {
            await this.initDatabase();
            let flushedTotal = 0;

            while (true) {
                const batch = await this.fetchUnsyncedBatch();

                if (batch.length === 0) {
                    console.log(`[OfflineSync Web] Queue drained. Flushed: ${flushedTotal}`);
                    break;
                }

                const success = await this.sendBatch(batch);
                if (!success) {
                    console.warn('[OfflineSync Web] POST failed — retrying later.');
                    break;
                }

                await this.markAsSynced(batch.map((r) => r.id!));
                flushedTotal += batch.length;
            }
        } catch (err) {
            console.error('[OfflineSync Web] Flush error:', err);
        } finally {
            this.isSyncing = false;
        }
    }

    // ── Private Helpers ─────────────────────────────────────────────────────

    private fetchUnsyncedBatch(): Promise<GPSLogRow[]> {
        return new Promise((resolve) => {
            if (!this.db) return resolve([]);

            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('synced');

            const records: GPSLogRow[] = [];
            const req = index.openCursor(IDBKeyRange.only(0));

            req.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest).result;
                if (cursor && records.length < BATCH_SIZE) {
                    records.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
        });
    }

    private async sendBatch(batch: GPSLogRow[]): Promise<boolean> {
        try {
            const payload = {
                locations: batch.map((r) => ({
                    touristId: r.tourist_id,
                    lat: r.lat,
                    lng: r.lng,
                    timestamp: r.timestamp,
                })),
            };

            const response = await fetch(`${this.apiBaseUrl}${BATCH_SYNC_URL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    private markAsSynced(ids: number[]): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db || ids.length === 0) return resolve();

            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);

            // IndexedDB forces a separate put for each key update
            ids.forEach((id) => {
                const req = store.get(id);
                req.onsuccess = () => {
                    const val = req.result as GPSLogRow;
                    if (val) {
                        val.synced = 1;
                        store.put(val);
                    }
                };
            });
        });
    }
}

export const offlineSyncService = new OfflineSyncService();
