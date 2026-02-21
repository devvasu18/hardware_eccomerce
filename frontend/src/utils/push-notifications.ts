
// Helper for Android Bridge
declare global {
    interface Window {
        Android: {
            showToast(message: string): void;
            openExternalLink(url: string): void;
            getAppVersion(): string;
            requestFCMToken(): void;
        };
        onReceiveFCMToken: (token: string) => void;
    }
}

export const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && window.Android) {
        // Native Android Flow
        window.Android.requestFCMToken();

        // Listen for the callback
        window.onReceiveFCMToken = async (token) => {
            await saveTokenToBackend(token);
        };
    } else if ('Notification' in window) {
        // Web Push Flow (if you add PWA push later)
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
            }
        });
    }
};

const saveTokenToBackend = async (token: string) => {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) return;

        await fetch(`/api/notifications/register-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ token, platform: 'android' })
        });
    } catch (e) {
        console.error('Failed to save FCM token', e);
    }
};
