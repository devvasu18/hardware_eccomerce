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

interface StockEntry {
    _id: string;
    invoice_no: string;
    bill_date: string;
    final_bill_amount: number;
    tallyStatus: string;
    tallyErrorLog?: string;
}

export default function TallySyncPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders');
    const [loading, setLoading] = useState(false);
    const { modalState, hideModal, showSuccess, showError } = useModal();

    useEffect(() => {
        fetchOrders();
        fetchStock();
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

    const fetchStock = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/admin/stock', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setStockEntries(Array.isArray(data) ? data : []);
        }
    };

    const handleSync = async (id: string) => {
        setLoading(true);
        try {
            const url = activeTab === 'orders'
                ? `http://localhost:5000/api/tally/sales/${id}`
                : `http://localhost:5000/api/admin/stock/${id}/sync`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();

            if (res.ok) {
                if (data.queued) {
                    showSuccess('Tally is offline. Order added to sync queue and will process automatically.');
                } else {
                    showSuccess(`${activeTab === 'orders' ? 'Order' : 'Stock Entry'} has been successfully synced to Tally!`);
                }
            } else {
                showError(`Sync failed: ${data.message || 'Unknown error occurred'}`);
            }
            fetchOrders(); // Refresh status
            fetchStock();
        } catch (e) {
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter only orders/stock that are NOT synced yet or failed
    const pendingOrders = orders.filter(o => o.tallyStatus !== 'saved' && o.status !== 'Cancelled');
    const pendingStock = stockEntries.filter(s => s.tallyStatus !== 'saved');

    const pendingCount = pendingOrders.length + pendingStock.length;
    const syncedCount = (orders.length - pendingOrders.length) + (stockEntries.length - pendingStock.length);

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Tally Prime Integration Logs</h1>

            <div className="grid" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h3>Pending Sync (Total)</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingCount}</p>
                </div>
                <div className="card">
                    <h3>Total Synced</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{syncedCount}</p>
                </div>
            </div>

            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                        padding: '1rem',
                        borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'orders' ? 'var(--primary)' : 'inherit',
                        fontWeight: activeTab === 'orders' ? 600 : 400
                    }}
                >
                    Sales Orders ({orders.length})
                </button>
                <button
                    onClick={() => setActiveTab('stock')}
                    style={{
                        padding: '1rem',
                        borderBottom: activeTab === 'stock' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'stock' ? 'var(--primary)' : 'inherit',
                        fontWeight: activeTab === 'stock' ? 600 : 400
                    }}
                >
                    Stock Entries ({stockEntries.length})
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
                {activeTab === 'orders' ? (
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
                                    <td style={{ padding: '1rem' }}>
                                        {order._id.slice(-6).toUpperCase()}
                                        {order.status === 'Cancelled' && <span style={{ fontSize: '0.7em', color: 'red', marginLeft: '5px' }}>(CN)</span>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{order.createdAt.split('T')[0]}</td>
                                    <td style={{ padding: '1rem' }}>₹{order.totalAmount}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <StatusBadge status={order.tallyStatus} error={order.tallyErrorLog} />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {order.tallyStatus !== 'saved' && order.status !== 'Cancelled' && (
                                            <button
                                                onClick={() => handleSync(order._id)}
                                                disabled={loading}
                                                className="btn btn-outline"
                                                style={{ borderColor: '#F37021', color: '#F37021', padding: '0.5rem', fontSize: '0.8rem' }}
                                            >
                                                {loading ? '...' : 'Push'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Invoice No</th>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Amount</th>
                                <th style={{ padding: '1rem' }}>Tally Status</th>
                                <th style={{ padding: '1rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockEntries.map(entry => (
                                <tr key={entry._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{entry.invoice_no}</td>
                                    <td style={{ padding: '1rem' }}>{apiDate(entry.bill_date)}</td>
                                    <td style={{ padding: '1rem' }}>₹{entry.final_bill_amount}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <StatusBadge status={entry.tallyStatus} error={entry.tallyErrorLog} />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {entry.tallyStatus !== 'saved' && (
                                            <button
                                                onClick={() => handleSync(entry._id)}
                                                disabled={loading}
                                                className="btn btn-outline"
                                                style={{ borderColor: '#F37021', color: '#F37021', padding: '0.5rem', fontSize: '0.8rem' }}
                                            >
                                                {loading ? '...' : 'Push'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

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

function StatusBadge({ status, error }: { status: string, error?: string }) {
    if (status === 'saved') {
        return <span className="badge" style={{ background: '#ecfdf5', color: '#065f46' }}>✓ Synced</span>;
    }
    if (status === 'queued') {
        return <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>⏳ Queued</span>;
    }
    if (status === 'failed') {
        return (
            <div>
                <span className="badge" style={{ background: '#fef2f2', color: '#991b1b' }}>Failed</span>
                {error && <p style={{ fontSize: '0.7rem', color: '#ef4444', maxWidth: '200px', marginTop: '0.25rem' }}>{error.slice(0, 50)}...</p>}
            </div>
        );
    }
    return <span className="badge" style={{ background: '#e2e8f0', color: '#64748B' }}>Pending</span>;
}

function apiDate(dateStr: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
}
