// System Settings Context and Hook
// Provides global access to system settings across the frontend

let cachedSettings: any = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch system settings from API
 * Uses caching to avoid excessive API calls
 */
export async function getSystemSettings() {
    const now = Date.now();

    // Return cached if still valid
    if (cachedSettings && (now - lastFetch) < CACHE_DURATION) {
        return cachedSettings;
    }

    try {
        const res = await fetch('/api/public/settings');

        if (!res.ok) {
            throw new Error('Failed to fetch settings');
        }

        const settings = await res.json();
        cachedSettings = settings;
        lastFetch = now;

        return settings;
    } catch (error) {
        console.error('Failed to fetch system settings:', error);

        // Return defaults if API fails
        return {
            companyName: 'Hardware Store',
            companyWebsite: '',
            supportEmail: 'support@example.com',
            supportContactNumber: '+91 1234567890',
            whatsappSupportNumber: '+91 1234567890',
            onlinePaymentEnabled: true,
            codEnabled: false
        };
    }
}

/**
 * Clear the cache (useful after settings update)
 */
export function clearSettingsCache() {
    cachedSettings = null;
    lastFetch = 0;
}
