'use client';

import { useEffect } from 'react';
import { isAppMode } from '@/utils/app-bridge';

export default function AppShellSetup() {
    useEffect(() => {
        if (isAppMode()) {
            document.body.classList.add('app-mode');

            // Request Notification Token from Android Native
            // We use dynamic import to avoid SSR issues with 'window'
            import('@/utils/push-notifications').then(({ requestNotificationPermission }) => {
                requestNotificationPermission();
            });
        }
    }, []);

    return null;
}
