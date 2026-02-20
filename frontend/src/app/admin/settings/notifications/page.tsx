'use client';

import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useModal } from '../../../hooks/useModal';
import Modal from '../../../components/Modal';
import { FiSave, FiRefreshCw, FiSettings, FiMail, FiMessageSquare, FiClock, FiGlobe, FiPhone, FiPackage, FiBell, FiCreditCard, FiPlay } from 'react-icons/fi';

export default function NotificationSettingsPage() {
    const { modalState, showSuccess, showError, hideModal } = useModal();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        companyName: '',
        companyWebsite: '',
        supportEmail: '',
        supportContactNumber: '',
        whatsappSupportNumber: '',
        companyAddress: '',
        companyGstNumber: '',
        emailNotificationsEnabled: true,
        whatsappNotificationsEnabled: true,
        passwordResetNotificationsEnabled: true,
        whatsappIntegrationEnabled: true,
        tallyIntegrationEnabled: true,
        shipmentAssetExpiryDays: 7,
        onDemandResponseTime: '48 hours',
        lowStockThreshold: 10,
        lowStockAlertsEnabled: true,
        onlinePaymentEnabled: true,
        codEnabled: false,
        arrivalNotificationEnabled: true,
        arrivalNotificationSound: 'default',
        notificationSoundEnabled: true,
        notificationSound: '/sounds/order_alert.mp3',
        orderNotificationSound: '/sounds/payment_success.mp3',
        paymentSuccessSound: '/sounds/payment_success.mp3',
        orderUpdateSound: 'default',
        adminNotificationSound: 'default'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/settings/system');
            setSettings(res.data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
            showError('Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const [uploadingSound, setUploadingSound] = useState(false);
    const [uploadingOrderSound, setUploadingOrderSound] = useState(false);
    const [uploadingPaymentSound, setUploadingPaymentSound] = useState(false);
    const [uploadingArrivalSound, setUploadingArrivalSound] = useState(false);
    const [uploadingOrderUpdateSound, setUploadingOrderUpdateSound] = useState(false);
    const [uploadingAdminNotificationSound, setUploadingAdminNotificationSound] = useState(false);
    const [playingSound, setPlayingSound] = useState<string | null>(null);

    const playPreview = (url: string) => {
        if (!url || url === 'custom') {
            showError('Please select or upload a sound first');
            return;
        }

        let soundUrl = url;
        if (url === 'default') {
            // Determine default based on which field might be calling (simplified for now)
            // If it's the notification section, maybe use /sounds/notification.mp3
            soundUrl = '/sounds/notification.mp3';
        }

        try {
            const audio = new Audio(soundUrl);
            setPlayingSound(url);
            audio.play().catch(error => {
                console.error('Error playing sound:', error);
                showError('Could not play sound preview');
                setPlayingSound(null);
            });
            audio.onended = () => setPlayingSound(null);
        } catch (error) {
            console.error('Audio creation error:', error);
            showError('Audio playback not supported or invalid file');
        }
    };

    const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'notificationSound' | 'orderNotificationSound' | 'paymentSuccessSound' | 'arrivalNotificationSound' | 'orderUpdateSound' | 'adminNotificationSound') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
            showError('Please upload a valid MP3 or WAV file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showError('File size must be less than 2MB');
            return;
        }

        const formData = new FormData();
        formData.append('sound', file);

        if (field === 'notificationSound') setUploadingSound(true);
        else if (field === 'orderNotificationSound') setUploadingOrderSound(true);
        else if (field === 'arrivalNotificationSound') setUploadingArrivalSound(true);
        else if (field === 'orderUpdateSound') setUploadingOrderUpdateSound(true);
        else if (field === 'adminNotificationSound') setUploadingAdminNotificationSound(true);
        else setUploadingPaymentSound(true);

        try {
            const res = await api.post('/admin/settings/upload-sound', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setSettings(prev => ({
                    ...prev,
                    [field]: res.data.url
                }));
                showSuccess('Sound uploaded successfully! Don\'t forget to save settings.');
            }
        } catch (error: any) {
            console.error('Sound upload failed:', error);
            showError(error.response?.data?.message || 'Failed to upload sound');
        } finally {
            if (field === 'notificationSound') setUploadingSound(false);
            else if (field === 'orderNotificationSound') setUploadingOrderSound(false);
            else if (field === 'arrivalNotificationSound') setUploadingArrivalSound(false);
            else if (field === 'orderUpdateSound') setUploadingOrderUpdateSound(false);
            else if (field === 'adminNotificationSound') setUploadingAdminNotificationSound(false);
            else setUploadingPaymentSound(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put('/admin/settings/system', settings);
            showSuccess('System settings saved successfully!', 'Success');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem' }}>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                    <FiRefreshCw className="spin" size={32} style={{ marginBottom: '1rem' }} />
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FiBell />
                    Notification Settings
                </h1>
                <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
                    Configure notification preferences and specific sounds for various activities.
                </p>
            </div>

            <form onSubmit={handleSave}>
                {/* Notification Settings Section */}
                <div className="card" style={{ padding: '2rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiMail size={20} color="#3B82F6" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Email Notifications</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Send order confirmations and updates via email
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotificationsEnabled}
                                    onChange={(e) => handleChange('emailNotificationsEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.emailNotificationsEnabled ? '#10B981' : '#cbd5e1',
                                    borderRadius: '30px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: settings.emailNotificationsEnabled ? '34px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px', opacity: settings.whatsappIntegrationEnabled ? 1 : 0.6, pointerEvents: settings.whatsappIntegrationEnabled ? 'auto' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiMessageSquare size={20} color="#25D366" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>WhatsApp Notifications</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Send order confirmations and updates via WhatsApp
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.whatsappNotificationsEnabled}
                                    onChange={(e) => handleChange('whatsappNotificationsEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.whatsappNotificationsEnabled ? '#10B981' : '#cbd5e1',
                                    borderRadius: '30px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: settings.whatsappNotificationsEnabled ? '34px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiSettings size={20} color="#8B5CF6" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Password Reset Notifications</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Send confirmation notifications when password is reset successfully
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.passwordResetNotificationsEnabled}
                                    onChange={(e) => handleChange('passwordResetNotificationsEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.passwordResetNotificationsEnabled ? '#10B981' : '#cbd5e1',
                                    borderRadius: '30px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: settings.passwordResetNotificationsEnabled ? '34px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiClock size={20} color="#F59E0B" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Arrival Notification (15 min before)</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Send a notification 15 minutes before the expected arrival time
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.arrivalNotificationEnabled !== false}
                                    onChange={(e) => handleChange('arrivalNotificationEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.arrivalNotificationEnabled !== false ? '#10B981' : '#cbd5e1',
                                    borderRadius: '30px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: settings.arrivalNotificationEnabled !== false ? '34px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        {/* Arrival Notification Sound Setting */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiBell size={20} color="#F59E0B" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Arrival Notification Sound</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Specific ringtone for the 15-minute arrival notification
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {settings.notificationSoundEnabled && (
                                    <select
                                        value={settings.arrivalNotificationSound || 'default'}
                                        onChange={(e) => handleChange('arrivalNotificationSound', e.target.value)}
                                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', maxWidth: '150px' }}
                                    >
                                        <option value="default">Default</option>
                                        <option value="/sounds/payment_success_chime.mp3">Modern Payment Chime</option>
                                        <option value="/sounds/payment_success.mp3">Payment Success</option>
                                        <option value="/sounds/order_alert.mp3">Order Alert</option>
                                        <option value="custom">Custom Sound</option>
                                        {settings.arrivalNotificationSound && !['default', '/sounds/payment_success.mp3', '/sounds/order_alert.mp3', 'custom'].includes(settings.arrivalNotificationSound) && (
                                            <option value={settings.arrivalNotificationSound}>Uploaded Sound</option>
                                        )}
                                    </select>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => playPreview(settings.arrivalNotificationSound)}
                                        disabled={playingSound === settings.arrivalNotificationSound}
                                        style={{
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: '#fff',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: '#3b82f6'
                                        }}
                                        title="Test Sound"
                                    >
                                        {playingSound === settings.arrivalNotificationSound ? <FiRefreshCw className="spin" /> : <FiPlay />}
                                        Test
                                    </button>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <>
                                        <input
                                            type="file"
                                            id="arrival-sound-upload"
                                            accept=".mp3,.wav"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleSoundUpload(e, 'arrivalNotificationSound')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('arrival-sound-upload')?.click()}
                                            disabled={uploadingArrivalSound}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                background: '#fff',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {uploadingArrivalSound ? <FiRefreshCw className="spin" /> : <FiPhone />}
                                            Upload
                                        </button>
                                    </>
                                )}


                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiBell size={20} color="#F59E0B" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Notification Sound</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Play a sound when a new notification arrives
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {settings.notificationSoundEnabled && (
                                    <select
                                        value={settings.notificationSound || 'default'}
                                        onChange={(e) => handleChange('notificationSound', e.target.value)}
                                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', maxWidth: '150px' }}
                                    >
                                        <option value="default">Default</option>
                                        <option value="/sounds/payment_success_chime.mp3">Modern Payment Chime</option>
                                        <option value="/sounds/order_alert.mp3">Cash Register (Cha-Ching)</option>
                                        <option value="/sounds/notification.mp3">Subtle Chime</option>
                                        <option value="custom">Custom Sound</option>
                                        {settings.notificationSound && !['default', '/sounds/order_alert.mp3', '/sounds/notification.mp3', 'custom'].includes(settings.notificationSound) && (
                                            <option value={settings.notificationSound}>Uploaded Sound</option>
                                        )}
                                    </select>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => playPreview(settings.notificationSound)}
                                        disabled={playingSound === settings.notificationSound}
                                        style={{
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: '#fff',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: '#3b82f6'
                                        }}
                                        title="Test Sound"
                                    >
                                        {playingSound === settings.notificationSound ? <FiRefreshCw className="spin" /> : <FiPlay />}
                                        Test
                                    </button>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <>
                                        <input
                                            type="file"
                                            id="sound-upload"
                                            accept=".mp3,.wav"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleSoundUpload(e, 'notificationSound')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('sound-upload')?.click()}
                                            disabled={uploadingSound}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                background: '#fff',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {uploadingSound ? <FiRefreshCw className="spin" /> : <FiPhone />}
                                            Upload
                                        </button>
                                    </>
                                )}

                                <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.notificationSoundEnabled !== false} // Default to true if undefined
                                        onChange={(e) => handleChange('notificationSoundEnabled', e.target.checked)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: settings.notificationSoundEnabled !== false ? '#10B981' : '#cbd5e1',
                                        borderRadius: '30px',
                                        transition: '0.3s',
                                        cursor: 'pointer'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '""',
                                            height: '22px',
                                            width: '22px',
                                            left: settings.notificationSoundEnabled !== false ? '34px' : '4px',
                                            bottom: '4px',
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            transition: '0.3s'
                                        }}></span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Order Placed Sound Setting */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiBell size={20} color="#10B981" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Order placed Notification Sound (only customer)</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Specific ringtone for "Order Placed" success notifications
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {settings.notificationSoundEnabled && (
                                    <select
                                        value={settings.orderNotificationSound || 'default'}
                                        onChange={(e) => handleChange('orderNotificationSound', e.target.value)}
                                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', maxWidth: '150px' }}
                                    >
                                        <option value="default">Default</option>
                                        <option value="/sounds/payment_success_chime.mp3">Modern Payment Chime</option>
                                        <option value="/sounds/payment_success.mp3">Payment Success</option>
                                        <option value="/sounds/order_alert.mp3">Order Alert</option>
                                        <option value="custom">Custom Sound</option>
                                        {settings.orderNotificationSound && !['default', '/sounds/payment_success.mp3', '/sounds/order_alert.mp3', 'custom'].includes(settings.orderNotificationSound) && (
                                            <option value={settings.orderNotificationSound}>Uploaded Sound</option>
                                        )}
                                    </select>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => playPreview(settings.orderNotificationSound)}
                                        disabled={playingSound === settings.orderNotificationSound}
                                        style={{
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: '#fff',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: '#3b82f6'
                                        }}
                                        title="Test Sound"
                                    >
                                        {playingSound === settings.orderNotificationSound ? <FiRefreshCw className="spin" /> : <FiPlay />}
                                        Test
                                    </button>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <>
                                        <input
                                            type="file"
                                            id="order-sound-upload"
                                            accept=".mp3,.wav"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleSoundUpload(e, 'orderNotificationSound')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('order-sound-upload')?.click()}
                                            disabled={uploadingOrderSound}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                background: '#fff',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {uploadingOrderSound ? <FiRefreshCw className="spin" /> : <FiPhone />}
                                            Upload
                                        </button>
                                    </>
                                )}


                            </div>
                        </div>

                        {/* Payment Success Sound Setting */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiCreditCard size={20} color="#3B82F6" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Payment Success Notification Sound (only customer)</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Ringtone played when a customer's payment is successfully processed
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {settings.notificationSoundEnabled && (
                                    <select
                                        value={settings.paymentSuccessSound || 'default'}
                                        onChange={(e) => handleChange('paymentSuccessSound', e.target.value)}
                                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', maxWidth: '150px' }}
                                    >
                                        <option value="default">Default</option>
                                        <option value="/sounds/payment_success_chime.mp3">Modern Payment Chime</option>
                                        <option value="/sounds/payment_success.mp3">Payment Success</option>
                                        <option value="/sounds/order_alert.mp3">Order Alert</option>
                                        <option value="custom">Custom Sound</option>
                                        {settings.paymentSuccessSound && !['default', '/sounds/payment_success.mp3', '/sounds/order_alert.mp3', 'custom'].includes(settings.paymentSuccessSound) && (
                                            <option value={settings.paymentSuccessSound}>Uploaded Sound</option>
                                        )}
                                    </select>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => playPreview(settings.paymentSuccessSound)}
                                        disabled={playingSound === settings.paymentSuccessSound}
                                        style={{
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: '#fff',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: '#3b82f6'
                                        }}
                                        title="Test Sound"
                                    >
                                        {playingSound === settings.paymentSuccessSound ? <FiRefreshCw className="spin" /> : <FiPlay />}
                                        Test
                                    </button>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <>
                                        <input
                                            type="file"
                                            id="payment-sound-upload"
                                            accept=".mp3,.wav"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleSoundUpload(e, 'paymentSuccessSound')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('payment-sound-upload')?.click()}
                                            disabled={uploadingPaymentSound}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                background: '#fff',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {uploadingPaymentSound ? <FiRefreshCw className="spin" /> : <FiPhone />}
                                            Upload
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Order Update Sound Setting */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiBell size={20} color="#8B5CF6" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Order Update Notification Sound (only customer)</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Specific ringtone for updates like "Packed", "Shipped", etc.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {settings.notificationSoundEnabled && (
                                    <select
                                        value={settings.orderUpdateSound || 'default'}
                                        onChange={(e) => handleChange('orderUpdateSound', e.target.value)}
                                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', maxWidth: '150px' }}
                                    >
                                        <option value="default">Default</option>
                                        <option value="/sounds/payment_success_chime.mp3">Modern Payment Chime</option>
                                        <option value="/sounds/payment_success.mp3">Payment Success</option>
                                        <option value="/sounds/order_alert.mp3">Order Alert</option>
                                        <option value="custom">Custom Sound</option>
                                        {settings.orderUpdateSound && !['default', '/sounds/payment_success.mp3', '/sounds/order_alert.mp3', 'custom'].includes(settings.orderUpdateSound) && (
                                            <option value={settings.orderUpdateSound}>Uploaded Sound</option>
                                        )}
                                    </select>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => playPreview(settings.orderUpdateSound)}
                                        disabled={playingSound === settings.orderUpdateSound}
                                        style={{
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: '#fff',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: '#3b82f6'
                                        }}
                                        title="Test Sound"
                                    >
                                        {playingSound === settings.orderUpdateSound ? <FiRefreshCw className="spin" /> : <FiPlay />}
                                        Test
                                    </button>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <>
                                        <input
                                            type="file"
                                            id="order-update-sound-upload"
                                            accept=".mp3,.wav"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleSoundUpload(e, 'orderUpdateSound')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('order-update-sound-upload')?.click()}
                                            disabled={uploadingOrderUpdateSound}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                background: '#fff',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {uploadingOrderUpdateSound ? <FiRefreshCw className="spin" /> : <FiPhone />}
                                            Upload
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Admin Notification Sound Setting */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiBell size={20} color="#EF4444" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Admin Global Notification Sound</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Default sound for any push notifications sent to Admins.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {settings.notificationSoundEnabled && (
                                    <select
                                        value={settings.adminNotificationSound || 'default'}
                                        onChange={(e) => handleChange('adminNotificationSound', e.target.value)}
                                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', maxWidth: '150px' }}
                                    >
                                        <option value="default">Default</option>
                                        <option value="/sounds/payment_success_chime.mp3">Modern Payment Chime</option>
                                        <option value="/sounds/payment_success.mp3">Payment Success</option>
                                        <option value="/sounds/order_alert.mp3">Order Alert</option>
                                        <option value="custom">Custom Sound</option>
                                        {settings.adminNotificationSound && !['default', '/sounds/payment_success.mp3', '/sounds/order_alert.mp3', 'custom'].includes(settings.adminNotificationSound) && (
                                            <option value={settings.adminNotificationSound}>Uploaded Sound</option>
                                        )}
                                    </select>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => playPreview(settings.adminNotificationSound)}
                                        disabled={playingSound === settings.adminNotificationSound}
                                        style={{
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: '#fff',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: '#3b82f6'
                                        }}
                                        title="Test Sound"
                                    >
                                        {playingSound === settings.adminNotificationSound ? <FiRefreshCw className="spin" /> : <FiPlay />}
                                        Test
                                    </button>
                                )}

                                {settings.notificationSoundEnabled && (
                                    <>
                                        <input
                                            type="file"
                                            id="admin-notification-sound-upload"
                                            accept=".mp3,.wav"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleSoundUpload(e, 'adminNotificationSound')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('admin-notification-sound-upload')?.click()}
                                            disabled={uploadingAdminNotificationSound}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                background: '#fff',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {uploadingAdminNotificationSound ? <FiRefreshCw className="spin" /> : <FiPhone />}
                                            Upload
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>




                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '6px', fontSize: '1rem' }}
                        disabled={saving}
                    >
                        <FiSave size={18} />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

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

            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
