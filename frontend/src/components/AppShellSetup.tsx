'use client';

import { useEffect } from 'react';
import { isAppMode } from '@/utils/app-bridge';

export default function AppShellSetup() {
    useEffect(() => {
        if (isAppMode()) {
            document.body.classList.add('app-mode');
            // Optional: Inform the native shell that the web app is ready
            // if ((window as any).Android?.onWebAppReady) {
            //   (window as any).Android.onWebAppReady();
            // }
        }
    }, []);

    return null;
}
