'use client';

import { useState, useEffect } from 'react';
import { FiMail, FiCheckCircle, FiRefreshCw, FiTrash2, FiActivity, FiAlertCircle } from 'react-icons/fi';
import api from '../../../utils/api';

export default function EmailMonitoring() {
    const [health, setHealth] = useState(null);
    const [failedEmails, setFailedEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [healthRes, failedRes] = await Promise.all([
                api.get('/email/health'),
                api.get('/email/failed?limit=10')
            ]);

            setHealth(healthRes.data);
            setFailedEmails(failedRes.data.emails || []);
        } catch (error) {
            console.error('Failed to fetch monitoring data:', error);
        } finally {
            setLoading(false);
        }
    };

    const retryEmail = async (id) => {
        try {
            setRetrying(true);
            await api.post(`/email/failed/${id}/retry`);
            alert('Email queued for retry');
            fetchData();
        } catch (error) {
            alert('Failed to retry email: ' + error.message);
        } finally {
            setRetrying(false);
        }
    };

    const retryAllFailed = async () => {
        if (!confirm('Retry all failed emails?')) return;

        try {
            setRetrying(true);
            const res = await api.post('/email/failed/retry-all');
            alert(res.data.message);
            fetchData();
        } catch (error) {
            alert('Failed to retry emails: ' + error.message);
        } finally {
            setRetrying(false);
        }
    };

    const deleteEmail = async (id) => {
        if (!confirm('Permanently delete this email record?')) return;

        try {
            await api.delete(`/email/failed/${id}`);
            alert('Email record deleted');
            fetchData();
        } catch (error) {
            alert('Failed to delete email: ' + error.message);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FiMail /> Email System Monitoring
            </h1>

            {/* Overall Health Stats */}
            {health && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: health.smtpStatus === 'connected' ? '#F0FDF4' : '#FEF2F2',
                        borderRadius: '12px',
                        border: `1px solid ${health.smtpStatus === 'connected' ? '#BBF7D0' : '#FECACA'}`,
                        width: 'fit-content'
                    }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: health.smtpStatus === 'connected' ? '#10B981' : '#EF4444'
                        }} />
                        <span style={{ fontWeight: 600, color: health.smtpStatus === 'connected' ? '#166534' : '#991B1B' }}>
                            SMTP Service: {health.smtpStatus === 'connected' ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        <StatCard label="Total in Queue" value={health.total} color="#6366F1" />
                        <StatCard label="Pending" value={health.pending} color="#3B82F6" />
                        <StatCard label="Processing" value={health.processing} color="#F59E0B" />
                        <StatCard label="Sent Successfully" value={health.sent} color="#10B981" />
                        <StatCard label="Failed" value={health.failed} color="#EF4444" />
                    </div>
                </div>
            )}

            {/* Failed Emails List */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiAlertCircle color="#EF4444" /> Recent Failures
                    </h2>
                    {failedEmails.length > 0 && (
                        <button
                            onClick={retryAllFailed}
                            disabled={retrying}
                            style={{
                                padding: '0.6rem 1.2rem',
                                background: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: retrying ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 500
                            }}
                        >
                            <FiRefreshCw className={retrying ? 'spin' : ''} size={18} />
                            Retry All Failed
                        </button>
                    )}
                </div>

                {failedEmails.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748B', padding: '3rem' }}>
                        <FiCheckCircle size={48} color="#10B981" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1.1rem' }}>All emails delivered successfully!</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F8FAF6', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Recipient</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Subject</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Error Details</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Try</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Failed At</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {failedEmails.map((email) => (
                                    <tr key={email._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{email.to}</td>
                                        <td style={{ padding: '1rem', color: '#64748B' }}>{email.subject}</td>
                                        <td style={{ padding: '1rem', color: '#EF4444', fontSize: '0.85rem' }}>
                                            <div style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                                                {email.error || 'Unknown error'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{email.attempts}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748B' }}>
                                            {email.failedAt ? new Date(email.failedAt).toLocaleString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => retryEmail(email._id)}
                                                    disabled={retrying}
                                                    style={{
                                                        padding: '0.4rem',
                                                        background: '#10B981',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: retrying ? 'not-allowed' : 'pointer'
                                                    }}
                                                    title="Retry email"
                                                >
                                                    <FiRefreshCw size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteEmail(email._id)}
                                                    style={{
                                                        padding: '0.4rem',
                                                        background: '#EF4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Delete record"
                                                >
                                                    <FiTrash2 size={16} />
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

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            borderLeft: `6px solid ${color}`,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s'
        }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B', fontWeight: 500, marginBottom: '0.5rem' }}>
                {label}
            </p>
            <p style={{ margin: 0, fontSize: '2.25rem', fontWeight: 'bold', color: '#1E293B' }}>
                {value.toLocaleString()}
            </p>
        </div>
    );
}
