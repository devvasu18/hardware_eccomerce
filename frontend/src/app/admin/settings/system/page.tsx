'use client';

import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useModal } from '../../../hooks/useModal';
import Modal from '../../../components/Modal';
import { FiSave, FiRefreshCw, FiSettings, FiMail, FiMessageSquare, FiClock, FiGlobe, FiPhone, FiPackage, FiBell, FiCreditCard, FiPlay } from 'react-icons/fi';

export default function SystemSettingsPage() {
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
        notificationSoundEnabled: true,
        notificationSound: '/sounds/order_alert.mp3',
        orderNotificationSound: '/sounds/payment_success.mp3'
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

    const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'notificationSound' | 'orderNotificationSound') => {
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
        else setUploadingOrderSound(true);

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
            else setUploadingOrderSound(false);
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
                    <FiSettings />
                    System Settings
                </h1>
                <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
                    Configure company information and notification preferences. These settings are used across all customer communications.
                </p>
            </div>

            <form onSubmit={handleSave}>
                {/* Company Information Section */}
                <div className="card" style={{ padding: '2rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiGlobe size={20} />
                        Company Information
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Company Name *
                            </label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                placeholder="e.g., Your Company Name"
                                required
                            />
                            <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748B', fontSize: '0.85rem' }}>
                                Used in all customer emails and messages
                            </small>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Company Website
                            </label>
                            <input
                                type="url"
                                value={settings.companyWebsite}
                                onChange={(e) => handleChange('companyWebsite', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Support Email *
                            </label>
                            <input
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => handleChange('supportEmail', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                placeholder="support@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Support Contact Number *
                            </label>
                            <input
                                type="tel"
                                value={settings.supportContactNumber}
                                onChange={(e) => handleChange('supportContactNumber', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                placeholder="+91 1234567890"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                WhatsApp Support Number *
                            </label>
                            <input
                                type="tel"
                                value={settings.whatsappSupportNumber}
                                onChange={(e) => handleChange('whatsappSupportNumber', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                placeholder="+91 1234567890"
                                required
                            />
                            <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748B', fontSize: '0.85rem' }}>
                                Displayed in customer notifications
                            </small>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Company Address *
                            </label>
                            <textarea
                                value={settings.companyAddress}
                                onChange={(e) => handleChange('companyAddress', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', minHeight: '80px', resize: 'vertical' }}
                                placeholder="Full company address for invoices"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                GST Number
                            </label>
                            <input
                                type="text"
                                value={settings.companyGstNumber}
                                onChange={(e) => handleChange('companyGstNumber', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                placeholder="e.g., 24ABCDE1234F1Z5"
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Settings Section */}
                <div className="card" style={{ padding: '2rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiMessageSquare size={20} />
                        Notification Preferences
                    </h2>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* WhatsApp Master Integration Switch */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: settings.whatsappIntegrationEnabled ? '#ecfdf5' : '#fff1f2', borderRadius: '8px', border: `1px solid ${settings.whatsappIntegrationEnabled ? '#10b981' : '#f43f5e'}`, marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: settings.whatsappIntegrationEnabled ? '#10b981' : '#f43f5e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <FiMessageSquare size={24} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, color: '#1E293B', margin: 0, fontSize: '1.1rem' }}>WhatsApp Integration (Master)</p>
                                    <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0.25rem 0 0' }}>
                                        {settings.whatsappIntegrationEnabled
                                            ? 'Integration is active. All WhatsApp features are enabled.'
                                            : 'Integration is DISABLED. QR Scanners, Message Sending, and Queue System are all paused.'}
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '64px', height: '32px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.whatsappIntegrationEnabled}
                                    onChange={(e) => handleChange('whatsappIntegrationEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.whatsappIntegrationEnabled ? '#10B981' : '#cbd5e1',
                                    borderRadius: '32px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '24px',
                                        width: '24px',
                                        left: settings.whatsappIntegrationEnabled ? '36px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        {/* Tally Master Integration Switch */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: settings.tallyIntegrationEnabled ? '#f0f9ff' : '#fff1f2', borderRadius: '8px', border: `1px solid ${settings.tallyIntegrationEnabled ? '#0ea5e9' : '#f43f5e'}`, marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: settings.tallyIntegrationEnabled ? '#0ea5e9' : '#f43f5e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <FiSettings size={24} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, color: '#1E293B', margin: 0, fontSize: '1.1rem' }}>Tally Integration (Master)</p>
                                    <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0.25rem 0 0' }}>
                                        {settings.tallyIntegrationEnabled
                                            ? 'Integration is active. Orders and Stock entries are synced to Tally Prime.'
                                            : 'Integration is DISABLED. No data will be sent to Tally and background sync is paused.'}
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '64px', height: '32px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.tallyIntegrationEnabled}
                                    onChange={(e) => handleChange('tallyIntegrationEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.tallyIntegrationEnabled ? '#0EA5E9' : '#cbd5e1',
                                    borderRadius: '32px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '24px',
                                        width: '24px',
                                        left: settings.tallyIntegrationEnabled ? '36px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}></span>
                                </span>
                            </label>
                        </div>

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
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Order Notification Sound</p>
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
                    </div>
                </div>

                {/* Payment Settings Section */}
                <div className="card" style={{ padding: '2rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiCreditCard size={20} />
                        Payment Modes
                    </h2>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiGlobe size={20} color="#3B82F6" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Online Payment</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Enable PayU payment gateway for customers to pay online
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.onlinePaymentEnabled}
                                    onChange={(e) => handleChange('onlinePaymentEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.onlinePaymentEnabled ? '#10B981' : '#cbd5e1',
                                    borderRadius: '30px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: settings.onlinePaymentEnabled ? '34px' : '4px',
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
                                <FiPhone size={20} color="#10B981" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Cash on Delivery (COD)</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Allow customers to pay when they receive the order
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.codEnabled}
                                    onChange={(e) => handleChange('codEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.codEnabled ? '#10B981' : '#cbd5e1',
                                    borderRadius: '30px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: settings.codEnabled ? '34px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s'
                                    }}></span>
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Advanced Settings Section */}
                <div className="card" style={{ padding: '2rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiClock size={20} />
                        Advanced Settings
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Shipment Asset Expiry (Days) *
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={settings.shipmentAssetExpiryDays}
                                onChange={(e) => handleChange('shipmentAssetExpiryDays', parseInt(e.target.value))}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                required
                            />
                            <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748B', fontSize: '0.85rem' }}>
                                Number of days shipment tracking links and images remain accessible
                            </small>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                On-Demand Response Time
                            </label>
                            <input
                                type="text"
                                value={settings.onDemandResponseTime}
                                onChange={(e) => handleChange('onDemandResponseTime', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                placeholder="e.g., 48 hours"
                            />
                            <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748B', fontSize: '0.85rem' }}>
                                Expected response time shown in on-demand request notifications
                            </small>
                        </div>
                    </div>
                </div>

                {/* Inventory Settings Section */}
                <div className="card" style={{ padding: '2rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiPackage size={20} />
                        Inventory & Stock Alerts
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Global Low Stock Threshold *
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={settings.lowStockThreshold}
                                onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
                                required
                            />
                            <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748B', fontSize: '0.85rem' }}>
                                Admin will be notified via Email/WhatsApp when stock falls below this level
                            </small>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiBell size={20} color="#F59E0B" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Enable Low Stock Alerts</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                        Receive real-time alerts for low inventory
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.lowStockAlertsEnabled}
                                    onChange={(e) => handleChange('lowStockAlertsEnabled', e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: settings.lowStockAlertsEnabled ? '#10B981' : '#cbd5e1',
                                    borderRadius: '30px',
                                    transition: '0.3s',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: settings.lowStockAlertsEnabled ? '34px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s'
                                    }}></span>
                                </span>
                            </label>
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
