'use client';

import AdminSidebar from '@/app/admin/components/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import NotFound from '@/app/not-found';
import { useEffect, useState } from 'react';
import './admin.css';
import './admin-responsive.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    // Start with a local ready state to ensure we don't flash 404 while auth is initializing
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!loading) {
            setIsReady(true);
        }
    }, [loading]);

    if (!isReady) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#f1f5f9',
                color: '#0f766e'
            }}>
                Loading...
            </div>
        );
    }

    if (!user || user.role !== 'super_admin') {
        return <NotFound />;
    }

    return (
        <div className="admin-layout-container">
            <AdminSidebar />

            {/* MainContent */}
            <main className="admin-main-content">
                {children}
            </main>
        </div>
    );
}
