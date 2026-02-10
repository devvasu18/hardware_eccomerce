'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { FiRefreshCw, FiCheckCircle, FiAlertCircle, FiSmartphone, FiActivity } from 'react-icons/fi';

const SessionManager = ({ sessionId, title }: { sessionId: string, title: string }) => {
    const [status, setStatus] = useState<string>('initializing');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchStatus = useCallback(async () => {
        try {
            const res = await api.get(`/whatsapp/status/${sessionId}`);
            setStatus(res.data.status);
            setQrCode(res.data.qr);
            setPhoneNumber(res.data.number);
            setLastUpdated(new Date());
        } catch (error) {
            console.error(`Failed to fetch status for ${sessionId}`, error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const restartSession = async () => {
        if (!confirm(`Are you sure you want to restart ${sessionId}? This will disconnect any active session and generate a new QR code.`)) return;

        setLoading(true);
        setStatus('initializing');
        try {
            await api.post(`/whatsapp/restart/${sessionId}`);
            // Poll will update status
        } catch (error) {
            console.error(`Failed to restart ${sessionId}`, error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'connected':
            case 'inChat':
            case 'isLogged': return '#10B981'; // Green
            case 'qr_ready': return '#F59E0B'; // Orange
            case 'initializing': return '#3B82F6'; // Blue
            case 'error_duplicate_number': return '#EF4444'; // Red
            default: return '#EF4444'; // Red
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected': return phoneNumber ? `Connected: +${phoneNumber}` : 'Connected';
            case 'qr_ready': return 'Scan QR Code';
            case 'initializing': return 'Initializing...';
            case 'inChat': return phoneNumber ? `Connected: +${phoneNumber}` : 'Connected';
            case 'isLogged': return 'Connected';
            case 'notLogged': return 'Disconnected';
            case 'error_duplicate_number': return 'Duplicate Number Detected';
            case 'browserClose': return 'Browser Closed';
            case 'qrReadSuccess': return 'QR Read Successfully';
            case 'autocloseCalled': return 'Auto Close Called';
            case 'desconnectedMobile': return 'Mobile Disconnected';
            case 'deleteToken': return 'Token Deleted';
            case 'chatsAvailable': return 'Connected';
            case 'deviceNotConnected': return 'Device Not Connected';
            case 'serverWssNotConnected': return 'Server WSS Disconnected';
            case 'noOpenBrowser': return 'No Open Browser';
            case 'initBrowser': return 'Initializing Browser';
            case 'openBrowser': return 'Browser Open';
            case 'connectBrowserWs': return 'Connecting Browser WS';
            case 'initWhatsapp': return 'Initializing WhatsApp';
            case 'waiteLogin': return 'Waiting for Login';
            case 'checkLogin': return 'Checking Login';
            case 'successPage': return 'Success Page';
            case 'waitForLogin': return 'Waiting for Login';
            case 'waitChat': return 'Waiting for Chat';
            case 'successChat': return 'Success Chat';
            default: return status?.replace(/([A-Z])/g, ' $1').trim() || 'Unknown';
        }
    };

    return (
        <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#334155', margin: 0 }}>{title}</h2>
                <span style={{
                    marginLeft: '1rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: getStatusColor() + '20',
                    color: getStatusColor()
                }}>
                    {getStatusText()}
                </span>
                <button
                    onClick={() => { setLoading(true); fetchStatus(); }}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            <div className="grid desktop-grid-2" style={{ gap: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                {/* Status Details */}
                <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: getStatusColor(),
                            boxShadow: `0 0 0 4px ${getStatusColor()}33`
                        }}></div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{getStatusText()}</span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: '#64748B' }}>
                        <p style={{ margin: 0 }}><strong>Session ID:</strong> {sessionId}</p>
                        <p style={{ margin: '0.3rem 0 0' }}><strong>Last Check:</strong> {lastUpdated.toLocaleTimeString()}</p>
                        {phoneNumber && (
                            <p style={{ margin: '0.3rem 0 0' }}><strong>Linked No.:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>+{phoneNumber}</span></p>
                        )}
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        {['connected', 'inChat', 'isLogged'].includes(status) ? (
                            <div style={{ padding: '0.8rem', background: '#ECFDF5', color: '#065F46', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <FiCheckCircle size={18} />
                                <span>Active & Ready</span>
                            </div>
                        ) : status === 'qr_ready' ? (
                            <div style={{ padding: '0.8rem', background: '#FEF3C7', color: '#92400E', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <FiAlertCircle size={18} />
                                <span>Scan QR Code</span>
                            </div>
                        ) : status === 'error' ? (
                            <div style={{ padding: '0.8rem', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <FiAlertCircle size={18} />
                                <span>Connection Error. Try restarting.</span>
                                <button onClick={restartSession} style={{ marginLeft: 'auto', padding: '0.2rem 0.6rem', border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    Reset Channel
                                </button>
                            </div>
                        ) : status === 'error_duplicate_number' ? (
                            <div style={{ padding: '0.8rem', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FiAlertCircle size={18} />
                                    <strong>Duplicate Number Detected!</strong>
                                </div>
                                <span style={{ fontSize: '0.85rem' }}>This number is already connected on another channel. Please scan with a DIFFERENT number.</span>

                                <button onClick={restartSession} style={{ width: 'fit-content', marginTop: '0.5rem', padding: '0.3rem 0.8rem', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    Reset to Try Again
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding: '0.8rem', background: '#EFF6FF', color: '#1E40AF', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <FiActivity className="spin" size={18} />
                                <span>Connecting...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* QR Code Area */}
                <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {qrCode ? (
                        <div style={{ border: '4px solid #1e293b', padding: '0.5rem', borderRadius: '8px', background: 'white' }}>
                            <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '200px', height: '200px' }} />
                        </div>
                    ) : ['connected', 'inChat', 'isLogged'].includes(status) ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <FiCheckCircle size={56} color="#10B981" style={{ marginBottom: '0.5rem' }} />
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Paired</h3>
                            {phoneNumber && (
                                <p style={{ margin: '0.5rem 0 0', fontWeight: 600, color: '#059669' }}>
                                    +{phoneNumber}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            <p>Loading QR...</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default function WhatsAppSettings() {
    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiSmartphone />
                    WhatsApp Multi-Channel Integration
                </h1>
                <p style={{ color: '#64748B', marginTop: '0.5rem' }}>
                    Manage your primary and secondary WhatsApp channels here. Both channels work in parallel to increase capacity safely.
                </p>
            </div>

            <SessionManager sessionId="primary" title="Primary Channel (Number 1)" />
            <SessionManager sessionId="secondary" title="Secondary Channel (Number 2)" />

            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

