/**
 * DownloadMapPage.tsx (Web Version)
 * ----------------------
 * Search for Indian cities and simulate downloading offline map packs.
 *
 * Rewritten from React Native <View>/<Text> to standard React DOM <div>/<span>
 * using Tailwind CSS for styling and Lucide React for icons.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Search, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

import cityRegistry from '../data/cityRegistry.json';
import {
    CityEntry,
    DownloadProgress,
    offlineMapService,
    PackStatus,
} from '../services/OfflineMapService';

// ─── Type Definitions ────────────────────────────────────────────────────────

interface CityItem extends CityEntry {
    status: PackStatus;
    progress: number;
}

interface StorageInfo {
    usedMB: number;
    totalMB: number;
    percent: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DownloadMapPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statuses, setStatuses] = useState<Record<string, PackStatus>>({});
    const [progressMap, setProgressMap] = useState<Record<string, number>>({});
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Initialisation ──────────────────────────────────────────────────────

    useEffect(() => {
        const loadStatuses = async () => {
            const statusMap: Record<string, PackStatus> = {};
            for (const city of cityRegistry as CityEntry[]) {
                statusMap[city.name] = await offlineMapService.getPackStatus(city.name);
            }
            setStatuses(statusMap);
            setLoading(false);
        };

        loadStatuses();
        loadStorageInfo();
    }, []);

    useEffect(() => {
        const onProgress = (p: DownloadProgress) => {
            setProgressMap((prev) => ({ ...prev, [p.cityName]: p.percent }));
        };

        const onComplete = ({ cityName }: { cityName: string }) => {
            setStatuses((prev) => ({ ...prev, [cityName]: 'complete' }));
            setProgressMap((prev) => ({ ...prev, [cityName]: 100 }));
            loadStorageInfo();
        };

        const onError = ({ cityName, error }: { cityName: string; error: string }) => {
            setStatuses((prev) => ({ ...prev, [cityName]: 'error' }));
            alert(`Download Error - ${cityName}: ${error}`); // Basic browser alert
        };

        const onDeleted = ({ cityName }: { cityName: string }) => {
            setStatuses((prev) => ({ ...prev, [cityName]: 'none' }));
            setProgressMap((prev) => ({ ...prev, [cityName]: 0 }));
            loadStorageInfo();
        };

        offlineMapService.on('progress', onProgress);
        offlineMapService.on('complete', onComplete);
        offlineMapService.on('error', onError);
        offlineMapService.on('deleted', onDeleted);

        return () => {
            offlineMapService.off('progress', onProgress);
            offlineMapService.off('complete', onComplete);
            offlineMapService.off('error', onError);
            offlineMapService.off('deleted', onDeleted);
        };
    }, []);

    // ── Storage Info (Browser Simulation) ───────────────────────────────────

    const loadStorageInfo = async () => {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 0;

                if (quota > 0) {
                    const usedMB = Math.round(usage / (1024 * 1024));
                    const totalMB = Math.round(quota / (1024 * 1024));
                    setStorageInfo({
                        usedMB,
                        totalMB,
                        percent: Math.round((usedMB / totalMB) * 100),
                    });
                    return;
                }
            }
        } catch {
            // Ignore
        }
        setStorageInfo(null);
    };

    // ── Filtered Cities ────────────────────────────────────────────────────

    const filteredCities = useMemo<CityItem[]>(() => {
        const query = searchQuery.toLowerCase().trim();
        return (cityRegistry as CityEntry[])
            .filter(
                (city) =>
                    city.name.toLowerCase().includes(query) ||
                    city.state.toLowerCase().includes(query)
            )
            .map((city) => ({
                ...city,
                status: statuses[city.name] ?? 'none',
                progress: progressMap[city.name] ?? 0,
            }));
    }, [searchQuery, statuses, progressMap]);

    // ── Handlers ───────────────────────────────────────────────────────────

    const handleDownload = useCallback(async (city: CityEntry) => {
        setStatuses((prev) => ({ ...prev, [city.name]: 'downloading' }));
        setProgressMap((prev) => ({ ...prev, [city.name]: 0 }));

        try {
            await offlineMapService.downloadCityPack(city.name, city.bounds);
        } catch {
            // Error handled by event listener
        }
    }, []);

    const handleDelete = useCallback((city: CityEntry) => {
        if (window.confirm(`Remove offline map for ${city.name}? You'll need to re-download it for offline use.`)) {
            offlineMapService.deletePack(city.name).catch(() => {
                alert(`Failed to delete map pack for ${city.name}.`);
            });
        }
    }, []);

    // ── Render Helpers ─────────────────────────────────────────────────────

    const getStatusBadge = (status: PackStatus) => {
        switch (status) {
            case 'complete':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-500 text-xs font-semibold">
                        <CheckCircle2 size={14} /> Downloaded
                    </span>
                );
            case 'downloading':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 text-xs font-semibold">
                        <Download size={14} className="animate-bounce" /> Downloading
                    </span>
                );
            case 'error':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-xs font-semibold">
                        <AlertCircle size={14} /> Error
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-400 text-xs font-medium">
                        Not downloaded
                    </span>
                );
        }
    };

    // ── Main Render ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p>Loading map packs…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 pt-12 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Offline Maps</h1>
                    <p className="text-slate-400">
                        Download city maps for offline navigation while travelling. Maps are securely cached in your browser.
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Search cities…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredCities.length === 0 ? (
                        <p className="text-center text-slate-500 py-12">No cities match your search.</p>
                    ) : (
                        filteredCities.map((city) => (
                            <div
                                key={city.name}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-xl font-semibold text-white">{city.name}</h2>
                                            {getStatusBadge(city.status)}
                                        </div>
                                        <p className="text-slate-400 text-sm">{city.state}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        {(city.status === 'none' || city.status === 'error') && (
                                            <button
                                                onClick={() => handleDownload(city)}
                                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            >
                                                <Download size={16} /> Download
                                            </button>
                                        )}

                                        {city.status === 'complete' && (
                                            <button
                                                onClick={() => handleDelete(city)}
                                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-red-400 focus:outline-none"
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {city.status === 'downloading' && (
                                    <div className="mt-5 flex items-center gap-4">
                                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                                                style={{ width: `${city.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-slate-400 text-sm font-mono w-10 text-right">
                                            {city.progress}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

            </div>

            {/* Fixed Storage Indicator */}
            {storageInfo && (
                <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-safe">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Browser Storage</span>
                            <span className="text-xs text-slate-500 font-mono">
                                {storageInfo.usedMB.toLocaleString()} MB / {storageInfo.totalMB.toLocaleString()} MB
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${storageInfo.percent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${storageInfo.percent}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
