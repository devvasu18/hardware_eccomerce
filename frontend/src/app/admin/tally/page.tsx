'use client';

import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

interface Order {
    _id: string;
    totalAmount: number;
    status: string;
    tallyStatus: string; // 'pending', 'saved', 'failed'
    tallyErrorLog?: string;
    createdAt: string;
}

export default function TallySyncPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const { modalState, hideModal, showSuccess, showError } = useModal();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            // API returns { orders: [...], page, pages, count }
            if (data.orders && Array.isArray(data.orders)) {
                setOrders(data.orders);
            } else if (Array.isArray(data)) {
                // Fallback if API changes to return array directly
                setOrders(data);
            } else {
                setOrders([]);
            }
        }
    };

    const handleSync = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/tally/sales/${id}`, {
                method: 'POST'
            });
            const data = await res.json();

            if (res.ok) {
                if (data.queued) {
                    showSuccess('Tally is offline. Order added to sync queue and will process automatically.');
                } else {
                    showSuccess('Order has been successfully synced to Tally!');
                }
            } else {
                showError(`Sync failed: ${data.message || 'Unknown error occurred'}`);
            }
            fetchOrders(); // Refresh status
        } catch (e) {
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter only orders that are NOT synced yet or failed
    const pendingSync = orders.filter(o => o.tallyStatus !== 'saved' && o.status !== 'Cancelled');

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Tally Prime Integration Logs</h1>

            <div className="grid" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h3>Pending Sync</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingSync.length}</p>
                </div>
                <div className="card">
                    <h3>Total Synced</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{orders.length - pendingSync.length}</p>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Order ID</th>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Amount</th>
                            <th style={{ padding: '1rem' }}>Tally Status</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem' }}>{order._id.slice(-6).toUpperCase()}</td>
                                <td style={{ padding: '1rem' }}>{order.createdAt.split('T')[0]}</td>
                                <td style={{ padding: '1rem' }}>₹{order.totalAmount}</td>
                                <td style={{ padding: '1rem' }}>
                                    {order.tallyStatus === 'saved' ? (
                                        <span className="badge" style={{ background: '#ecfdf5', color: '#065f46' }}>✓ Synced</span>
                                    ) : order.tallyStatus === 'queued' ? (
                                        <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>⏳ Queued</span>
                                    ) : order.tallyStatus === 'failed' ? (
                                        <div>
                                            <span className="badge" style={{ background: '#fef2f2', color: '#991b1b' }}>Failed</span>
                                            <p style={{ fontSize: '0.7rem', color: '#ef4444', maxWidth: '200px', marginTop: '0.25rem' }}>{order.tallyErrorLog?.slice(0, 50)}...</p>
                                        </div>
                                    ) : (
                                        <span className="badge" style={{ background: '#e2e8f0', color: '#64748B' }}>Pending</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {order.tallyStatus !== 'saved' && order.status !== 'Cancelled' && (
                                        <button
                                            onClick={() => handleSync(order._id)}
                                            disabled={loading}
                                            className="btn btn-outline"
                                            style={{ borderColor: '#F37021', color: '#F37021', padding: '0.5rem', fontSize: '0.8rem' }}
                                        >
                                            {loading ? 'Syncing...' : 'Push to Tally'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- NEW SECTION: Status Logs --- */}
            <h2 style={{ fontSize: '1.25rem', marginTop: '3rem', marginBottom: '1rem' }}>Activity Logs</h2>
            <StatusLogsTable />

            <Modal
                isOpen={modalState.isOpen}
                onClose={hideModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
                showCancel={modalState.showCancel}
            />
        </div>
    );
}

function StatusLogsTable() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/tally/admin/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setLogs(data.data);
        };
        fetchLogs();
    }, []);

    return (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <tr>
                        <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Message</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Stats (Q/S/F)</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log: any) => (
                        <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem' }}>
                                {new Date(log.checkedAt).toLocaleTimeString()} <br />
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                    {new Date(log.checkedAt).toLocaleDateString()}
                                </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                                <span className="badge" style={{
                                    background: log.status === 'online' ? '#ecfdf5' : '#fef2f2',
                                    color: log.status === 'online' ? '#047857' : '#b91c1c'
                                }}>
                                    {log.status.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', maxWidth: '300px' }}>
                                {log.errorMessage || '-'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                                {log.queueProcessed} / <span style={{ color: 'green' }}>{log.queueSuccess}</span> / <span style={{ color: 'red' }}>{log.queueFailed}</span>
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No logs available</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
