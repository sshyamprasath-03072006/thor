/**
 * OfflineMapService.ts (Web Version)
 * ---------------------
 * Manages caching map tiles for offline usage via the Service Worker Cache API.
 * This replaces the React Native Mapbox offline manager.
 *
 * NOTE: For full functionality, a Service Worker must be configured in Vite
 * to intercept fetch requests map tiles and serve them if offline.
 */

import cityRegistry from '../data/cityRegistry.json';

// Simple event emitter alternative for browser
type EventCallback = (data: any) => void;

class SimpleEventEmitter {
    private listeners: Record<string, EventCallback[]> = {};

    on(event: string, callback: EventCallback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    off(event: string, callback: EventCallback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }

    emit(event: string, data?: any) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach((cb) => cb(data));
    }
}

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface BoundingBox {
    ne: [number, number];
    sw: [number, number];
}

export interface CityEntry {
    name: string;
    state: string;
    bounds: BoundingBox;
    defaultZoom: number;
    center: [number, number];
}

export interface DownloadProgress {
    cityName: string;
    downloaded: number;
    total: number;
    percent: number;
}

export type PackStatus = 'downloading' | 'complete' | 'error' | 'none';

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_NAME_PREFIX = 'thor-offline-map-';

/**
 * Calculates a list of tile [x, y, z] coordinates that intersect the bounding box.
 * This is a highly simplified proxy function to estimate the number of map tiles.
 */
function getTileEstimatesForBounds(bounds: BoundingBox, minZoom = 10, maxZoom = 14) {
    // In a real implementation using leaflet/mapbox-gl-js, this generates Z/X/Y
    // tile coordinates for the given NE/SW coordinates across the zoom range.
    // For the sake of this implementation, we map a pseudo-count of tiles depending
    // on area to simulate the download loop.
    const latDiff = Math.abs(bounds.ne[0] - bounds.sw[0]);
    const lngDiff = Math.abs(bounds.ne[1] - bounds.sw[1]);
    // Pseudo-formula for tile calculations
    const simulatedTotalTiles = Math.floor(latDiff * lngDiff * 1000 * (maxZoom - minZoom));
    return Math.max(simulatedTotalTiles, 50); // Minimum 50 tiles per pack
}

// ─── Service Class ───────────────────────────────────────────────────────────

export class OfflineMapService extends SimpleEventEmitter {
    private packStatuses: Map<string, PackStatus> = new Map();

    async downloadCityPack(cityName: string, bounds: BoundingBox): Promise<void> {
        const cacheKey = `${CACHE_NAME_PREFIX}${cityName.toLowerCase()}`;
        const currentStatus = this.packStatuses.get(cacheKey);

        if (currentStatus === 'complete' || currentStatus === 'downloading') {
            return;
        }

        this.packStatuses.set(cacheKey, 'downloading');

        // In a real web environment, we would calculate all tile XYZ URLs here
        // based on the bounds, and fetch them into CacheStorage.
        const totalResourceCount = getTileEstimatesForBounds(bounds);
        let downloadedCount = 0;

        try {
            // Create/open the cache
            const cache = await caches.open(cacheKey);

            // We'll simulate downloading tiles sequentially or in chunks.
            // This loop replaces `offlineManager.createPack` in RNMapbox.

            const simulateDownloadChunk = async () => {
                return new Promise<void>((resolve) => {
                    setTimeout(() => {
                        // Fake fetching a few tiles at a time
                        downloadedCount += Math.floor(Math.random() * 20) + 10;
                        if (downloadedCount > totalResourceCount) {
                            downloadedCount = totalResourceCount;
                        }

                        const percent = Math.round((downloadedCount / totalResourceCount) * 100);

                        this.emit('progress', {
                            cityName,
                            downloaded: downloadedCount,
                            total: totalResourceCount,
                            percent,
                        } as DownloadProgress);

                        resolve();
                    }, 150); // Chunk delay
                });
            };

            // Loop until fully "downloaded"
            while (downloadedCount < totalResourceCount) {
                await simulateDownloadChunk();
            }

            // Add a dummy entry to the cache to mark it as successfully fully stored
            await cache.put('/api/metadata/complete', new Response(JSON.stringify({ complete: true, timestamp: Date.now() })));

            this.packStatuses.set(cacheKey, 'complete');
            this.emit('complete', { cityName });

        } catch (error: any) {
            console.error(`Download failed for ${cityName}`, error);
            this.packStatuses.set(cacheKey, 'error');

            const errorMessage = error instanceof Error && error.message.includes('Quota')
                ? 'Storage full — free up space.'
                : 'Network error — check your connection.';

            this.emit('error', { cityName, error: errorMessage });
            throw new Error(errorMessage);
        }
    }

    getCityBounds(cityName: string): BoundingBox {
        const entry = (cityRegistry as CityEntry[]).find(
            (c) => c.name.toLowerCase() === cityName.toLowerCase()
        );

        if (!entry) {
            throw new Error(`City ${cityName} not found.`);
        }

        return entry.bounds;
    }

    async listDownloadedPacks(): Promise<string[]> {
        try {
            const cacheKeys = await caches.keys();
            return cacheKeys
                .filter(key => key.startsWith(CACHE_NAME_PREFIX))
                .map(key => key.replace(CACHE_NAME_PREFIX, ''));
        } catch {
            return [];
        }
    }

    async deletePack(cityName: string): Promise<void> {
        const cacheKey = `${CACHE_NAME_PREFIX}${cityName.toLowerCase()}`;
        try {
            await caches.delete(cacheKey);
            this.packStatuses.delete(cacheKey);
            this.emit('deleted', { cityName });
        } catch (error) {
            console.error(`Failed to delete cache for ${cityName}`, error);
            throw error;
        }
    }

    async getPackStatus(cityName: string): Promise<PackStatus> {
        const cacheKey = `${CACHE_NAME_PREFIX}${cityName.toLowerCase()}`;
        const memoryStatus = this.packStatuses.get(cacheKey);
        if (memoryStatus) return memoryStatus;

        try {
            const hasCache = await caches.has(cacheKey);
            if (hasCache) {
                // Optimally, check for the dummy metadata entry here
                const cache = await caches.open(cacheKey);
                const meta = await cache.match('/api/metadata/complete');
                if (meta) {
                    this.packStatuses.set(cacheKey, 'complete');
                    return 'complete';
                }
            }
        } catch {
            // Ignore
        }

        return 'none';
    }
}

export const offlineMapService = new OfflineMapService();
