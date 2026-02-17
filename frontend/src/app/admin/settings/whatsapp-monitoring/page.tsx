'use client';

import { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiRefreshCw, FiTrash2, FiActivity } from 'react-icons/fi';
import api from '../../../utils/api';


interface SessionData {
    connected: boolean;
    status: string;
    number?: string;
}

interface QueueStats {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
}

interface HealthData {
    overall: string;
    sessions: Record<string, SessionData>;
    queue: QueueStats;
}

interface FailedMessage {
    _id: string;
    recipient: string;
    messageBody: string;
    error: string;
    attempts: number;
    failedAt: string;
}

export default function WhatsAppMonitoring() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [stats, setStats] = useState<any>(null); // Keeping stats as any since usage isn't clear from snippet, but health covers the main error
    const [failedMessages, setFailedMessages] = useState<FailedMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [healthRes, statsRes, failedRes] = await Promise.all([
                api.get('/whatsapp/health'),
                api.get('/whatsapp/stats'),
                api.get('/whatsapp/failed?limit=10')
            ]);

            setHealth(healthRes.data);
            setStats(statsRes.data);
            setFailedMessages(failedRes.data.messages || []);
        } catch (error) {
            console.error('Failed to fetch monitoring data:', error);
        } finally {
            setLoading(false);
        }
    };

    const retryMessage = async (id) => {
        try {
            setRetrying(true);
            await api.post(`/whatsapp/failed/${id}/retry`);
            alert('Message queued for retry');
            fetchData();
        } catch (error) {
            alert('Failed to retry message: ' + error.message);
        } finally {
            setRetrying(false);
        }
    };

    const retryAllFailed = async () => {
        if (!confirm('Retry all failed messages?')) return;

        try {
            setRetrying(true);
            const res = await api.post('/whatsapp/failed/retry-all');
            alert(res.data.message);
            fetchData();
        } catch (error) {
            alert('Failed to retry messages: ' + error.message);
        } finally {
            setRetrying(false);
        }
    };

    const deleteMessage = async (id) => {
        if (!confirm('Permanently delete this message?')) return;

        try {
            await api.delete(`/whatsapp/failed/${id}`);
            alert('Message deleted');
            fetchData();
        } catch (error) {
            alert('Failed to delete message: ' + error.message);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    }

    const getHealthColor = (status) => {
        switch (status) {
            case 'healthy': return '#10B981';
            case 'degraded': return '#F59E0B';
            case 'warning': return '#F59E0B';
            case 'critical': return '#EF4444';
            default: return '#6B7280';
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                WhatsApp System Monitoring
            </h1>

            {/* Overall Health */}
            {health && (
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    border: `2px solid ${getHealthColor(health.overall)}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <FiActivity size={32} color={getHealthColor(health.overall)} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>System Status</h2>
                            <p style={{ margin: 0, color: getHealthColor(health.overall), fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {health.overall}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        {Object.entries(health.sessions).map(([sessionId, session]) => (
                            <div key={sessionId} style={{
                                padding: '1rem',
                                background: '#F9FAFB',
                                borderRadius: '8px',
                                border: `2px solid ${session.connected ? '#10B981' : '#EF4444'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {session.connected ? (
                                        <FiCheckCircle color="#10B981" size={20} />
                                    ) : (
                                        <FiAlertCircle color="#EF4444" size={20} />
                                    )}
                                    <strong style={{ textTransform: 'capitalize' }}>{sessionId}</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>
                                    Status: {session.status}
                                </p>
                                {session.number && (
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                                        +{session.number}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Queue Statistics */}
            {health && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <StatCard label="Pending" value={health.queue.pending || 0} color="#3B82F6" />
                    <StatCard label="Processing" value={health.queue.processing || 0} color="#F59E0B" />
                    <StatCard label="Sent" value={health.queue.sent || 0} color="#10B981" />
                    <StatCard label="Failed" value={health.queue.failed || 0} color="#EF4444" />
                </div>
            )}

            {/* Failed Messages */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Failed Messages</h2>
                    {failedMessages.length > 0 && (
                        <button
                            onClick={retryAllFailed}
                            disabled={retrying}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: retrying ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <FiRefreshCw size={16} />
                            Retry All
                        </button>
                    )}
                </div>

                {failedMessages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>
                        No failed messages 🎉
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Recipient</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Message</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Error</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Attempts</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Failed At</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {failedMessages.map((msg) => (
                                    <tr key={msg._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                        <td style={{ padding: '0.75rem' }}>{msg.recipient}</td>
                                        <td style={{ padding: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {msg.messageBody}
                                        </td>
                                        <td style={{ padding: '0.75rem', color: '#EF4444', fontSize: '0.85rem' }}>
                                            {msg.error}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{msg.attempts}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                                            {msg.failedAt ? new Date(msg.failedAt).toLocaleString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => retryMessage(msg._id)}
                                                    disabled={retrying}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        background: '#10B981',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: retrying ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.85rem'
                                                    }}
                                                    title="Retry"
                                                >
                                                    <FiRefreshCw size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteMessage(msg._id)}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        background: '#EF4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem'
                                                    }}
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: `2px solid ${color}`,
            textAlign: 'center'
        }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                {label}
            </p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color }}>
                {value}
            </p>
        </div>
    );
}
