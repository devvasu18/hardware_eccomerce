/**
 * Simple 3-layer caching utility for Next.js Client Components
 * Layers:
 * 1. Memory (fastest, survives route changes)
 * 2. LocalStorage (persistent, survives app restarts)
 * 3. Background Revalidation (silently refreshes stale data)
 */

type CacheEntry<T> = {
    data: T;
    timestamp: number;
    ttl: number; // in milliseconds
};

// Layer 1: Memory Cache (survives route changes as it's outside the component tree)
const memoryCache: Record<string, CacheEntry<any>> = {};

export const cache = {
    /**
     * Get data from cache (Memory or LocalStorage)
     */
    get: <T>(key: string): T | null => {
        if (typeof window === 'undefined') return null;

        // 1. Try Memory Cache
        let entry = memoryCache[key];

        // 2. Try LocalStorage if not in Memory
        if (!entry) {
            const stored = localStorage.getItem(`app_cache_${key}`);
            if (stored) {
                try {
                    entry = JSON.parse(stored);
                    // Sync to memory for faster access next time
                    if (entry) memoryCache[key] = entry;
                } catch (e) {
                    return null;
                }
            }
        }

        if (!entry) return null;

        // Note: We return data even if expired, let the caller decide if they want to revalidate in background
        return entry.data;
    },

    /**
     * Set data to cache
     */
    set: <T>(key: string, data: T, ttlMinutes: number = 5) => {
        if (typeof window === 'undefined') return;

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttlMinutes * 60 * 1000,
        };

        // Update Memory
        memoryCache[key] = entry;

        // Update LocalStorage
        try {
            localStorage.setItem(`app_cache_${key}`, JSON.stringify(entry));
        } catch (e) {
            console.warn('Cache write to localStorage failed:', e);
        }
    },

    /**
     * Check if a cache key is expired
     */
    isExpired: (key: string): boolean => {
        const entry = memoryCache[key];
        if (!entry) {
            // Check localStorage if memory is empty
            const stored = typeof window !== 'undefined' ? localStorage.getItem(`app_cache_${key}`) : null;
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    return Date.now() - parsed.timestamp > parsed.ttl;
                } catch (e) {
                    return true;
                }
            }
            return true;
        }
        return Date.now() - entry.timestamp > entry.ttl;
    },

    /**
     * Remove specific key from cache
     */
    remove: (key: string) => {
        delete memoryCache[key];
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`app_cache_${key}`);
        }
    },

    /**
     * Clear all app-related cache
     */
    clear: () => {
        Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
        if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('app_cache_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }
};
