'use client';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ pendingOrders: 0, onDemandRequests: 0, tallyFailures: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Overview</h1>
            <div className="grid">
                <div className="card">
                    <h3>Pending Orders</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#F37021' }}>{stats.pendingOrders}</p>
                </div>
                <div className="card">
                    <h3>On-Demand Requests</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{stats.onDemandRequests}</p>
                </div>
                <div className="card">
                    <h3>Tally Sync Failures</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>{stats.tallyFailures}</p>
                </div>
            </div>
        </div>
    );
}
