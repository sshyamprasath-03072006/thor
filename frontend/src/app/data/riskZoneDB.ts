/**
 * riskZoneDB.ts (Web Version)
 * ----------------------------
 * IndexedDB schema and query layer for risk zones.
 *
 * Replaces SQLite with IndexedDB for browser-based storage.
 * Stores risk zone data locally so it's available offline.
 *
 * Table equivalent: risk_zones
 *   id, city, lat, lng, radius_meters, risk_level, category,
 *   reason, active_hours_start, active_hours_end, updated_at
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskCategory = 'crime' | 'scam' | 'restricted' | 'unsafe_night' | 'protest';

export interface RiskZone {
    id: string;
    city: string;
    lat: number;
    lng: number;
    radius_meters: number;
    risk_level: RiskLevel;
    category: RiskCategory;
    reason: string;
    active_hours_start: number | null; // 0–23, null = always active
    active_hours_end: number | null;   // 0–23, null = always active
    updated_at: number;                // Unix epoch ms
}

export interface BoundingBox {
    ne: [number, number]; // [lat, lng]
    sw: [number, number]; // [lat, lng]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DB_NAME = 'thor_risk_zones';
const DB_VERSION = 1;
const STORE_NAME = 'risk_zones';

// ─── Database Class ──────────────────────────────────────────────────────────

export class RiskZoneDB {
    private db: IDBDatabase | null = null;

    // ── Open / Upgrade ──────────────────────────────────────────────────────

    /**
     * Opens the IndexedDB database and creates the object store + indexes
     * on first run (or version upgrade).
     *
     * Index design rationale:
     *  - `city` index: fast filtering when loading zones for a specific city.
     *  - `risk_level` index: enables sorted queries by severity.
     *  - `updated_at` index: efficient delta-sync queries.
     */
    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve();

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('city', 'city', { unique: false });
                    store.createIndex('risk_level', 'risk_level', { unique: false });
                    store.createIndex('updated_at', 'updated_at', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ── Load Zones for a City ───────────────────────────────────────────────

    /**
     * Retrieves all risk zones for a given city.
     * Uses the `city` index for an efficient lookup.
     */
    loadZonesForCity(city: string): Promise<RiskZone[]> {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('city');
            const request = index.getAll(city.toLowerCase());

            request.onsuccess = () => resolve(request.result as RiskZone[]);
            request.onerror = () => reject(request.error);
        });
    }

    // ── Insert / Upsert Zones ──────────────────────────────────────────────

    /**
     * Inserts or updates an array of risk zones.
     * Uses `put` which performs an upsert (insert if new, update if exists).
     *
     * All city names are lowercased for consistent index lookups.
     */
    insertZones(zones: RiskZone[]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);

            for (const zone of zones) {
                store.put({ ...zone, city: zone.city.toLowerCase() });
            }
        });
    }

    // ── Get Zones by Bounding Box ───────────────────────────────────────────

    /**
     * Returns all zones whose center point falls within the given bounding box.
     *
     * IndexedDB doesn't support compound geo-queries, so we fetch all zones
     * and filter in memory. This is acceptable because:
     *  - Risk zone count per city is small (8–50 zones).
     *  - The alternative (geo-spatial indexing) requires a library like RBush
     *    which is overkill at this scale.
     */
    getZonesByBounds(bounds: BoundingBox): Promise<RiskZone[]> {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const allZones = request.result as RiskZone[];
                const filtered = allZones.filter((zone) => {
                    return (
                        zone.lat >= bounds.sw[0] &&
                        zone.lat <= bounds.ne[0] &&
                        zone.lng >= bounds.sw[1] &&
                        zone.lng <= bounds.ne[1]
                    );
                });
                resolve(filtered);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ── Get All Zones ───────────────────────────────────────────────────────

    /** Returns every zone in the database (used for debugging / admin). */
    getAllZones(): Promise<RiskZone[]> {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as RiskZone[]);
            request.onerror = () => reject(request.error);
        });
    }

    // ── Clear All ───────────────────────────────────────────────────────────

    /** Wipe all zones (useful before re-seeding). */
    clearAll(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Singleton export
export const riskZoneDB = new RiskZoneDB();
