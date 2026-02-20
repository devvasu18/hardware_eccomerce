'use client';
import { useEffect } from 'react';

const AppReadySignaler = () => {
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Android && (window as any).Android.onAppReady) {
            // Add a small delay to allow paint to complete
            requestAnimationFrame(() => {
                setTimeout(() => {
                    (window as any).Android.onAppReady();
                }, 50);
            });
        }
    }, []);
    return null;
};

export default AppReadySignaler;
