'use client';

import { useEffect, useRef } from 'react';
import { isAppMode } from '@/utils/app-bridge';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function AppShellSetup() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const pushTracked = useRef(false);

    useEffect(() => {
        if (isAppMode()) {
            document.body.classList.add('app-mode');

            // Request Notification Token from Android Native
            import('@/utils/push-notifications').then(({ requestNotificationPermission }) => {
                requestNotificationPermission();
            });
        }
    }, []);

    useEffect(() => {
        const fromPush = searchParams.get('from_push');
        const campaignId = searchParams.get('campaignId');

        if (fromPush === 'true' && campaignId && !pushTracked.current) {
            pushTracked.current = true;

            // Track the open event
            const token = localStorage.getItem('token');
            const fcmToken = localStorage.getItem('fcm_token') || 'unknown'; // assuming fcm_token is stored during registration, if not we pass what we have

            fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/campaigns/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    campaignId,
                    event: 'OPENED',
                    token: fcmToken
                })
            }).catch(e => console.error('Failed to track push open', e));

            // Authentication Guard for deep linking
            if (!token) {
                // Not logged in -> save target URL and go to login
                const fullUrl = `${pathname}?${searchParams.toString()}`;
                sessionStorage.setItem('redirectAfterLogin', fullUrl);
                router.push('/login');
            }
        }
    }, [searchParams, pathname, router]);

    return null;
}
