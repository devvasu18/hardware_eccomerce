'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../utils/api';
import { FiSave, FiBell, FiGlobe, FiMoon, FiSun, FiMonitor, FiCheck, FiAlertCircle } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function UserSettingsPage() {
    const { user, loadUser } = useAuth();
    const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [settings, setSettings] = useState({
        notifications: {
            email: true,
            whatsapp: true,
            sms: true
        },
        language: 'en',
        theme: 'system' as 'light' | 'dark' | 'system'
    });

    // Load settings from user context when available
    useEffect(() => {
        if (user && user.settings) {
            setSettings({
                notifications: {
                    email: user.settings.notifications?.email ?? true,
                    whatsapp: user.settings.notifications?.whatsapp ?? true,
                    sms: user.settings.notifications?.sms ?? true
                },
                language: user.settings.language || 'en',
                theme: (user.settings.theme as any) || 'system'
            });
            // Ensure global language context matches user preference if set
            if (user.settings.language && user.settings.language !== language) {
                // We don't auto-switch here to avoid jarring UX, let them explicitly save
            }
        }
    }, [user]);

    const handleNotificationChange = (field: string, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [field]: value
            }
        }));
    };

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setSettings(prev => ({ ...prev, theme: newTheme }));
        setGlobalTheme(newTheme); // Apply immediately
    };

    const handleLanguageChange = (newLang: string) => {
        setSettings(prev => ({ ...prev, language: newLang }));
        setLanguage(newLang as any); // Apply immediately for preview
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await api.put('/auth/settings', settings);
            setMessage({ type: 'success', text: t('settings_saved') });
            await loadUser(); // Refresh user context
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || t('settings_failed') });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Header />
            <div className="container" style={{ padding: '8rem 2rem 2rem', maxWidth: '900px', margin: '0 auto', minHeight: '80vh' }}>
                <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {t('account_settings')}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        {t('manage_preferences')}
                    </p>
                </div>

                {message && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`
                    }}>
                        {message.type === 'success' ? <FiCheck size={20} /> : <FiAlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave}>
                    {/* Notification Settings */}
                    <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '8px', background: 'var(--info-light)', borderRadius: '8px', color: 'var(--info)' }}>
                                <FiBell size={20} />
                            </div>
                            {t('notification_preferences')}
                        </h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Email Notifications */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('email_notifications')}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                                        {t('email_notifications_desc')}
                                    </p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.email}
                                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            {/* WhatsApp Notifications */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('whatsapp_notifications')}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                                        {t('whatsapp_notifications_desc')}
                                    </p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.whatsapp}
                                        onChange={(e) => handleNotificationChange('whatsapp', e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            {/* SMS Notifications */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('sms_notifications')}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                                        {t('sms_notifications_desc')}
                                    </p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.sms}
                                        onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Appearance & General Section */}
                    <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '8px', background: 'var(--success-light)', borderRadius: '8px', color: 'var(--success)' }}>
                                <FiGlobe size={20} />
                            </div>
                            {t('appearance_general')}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                    {t('theme_mode')}
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    <div
                                        onClick={() => handleThemeChange('light')}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: `2px solid ${settings.theme === 'light' ? 'var(--primary)' : 'var(--border)'}`,
                                            background: settings.theme === 'light' ? 'var(--surface-hover)' : 'var(--background)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <FiSun size={24} style={{ marginBottom: '0.5rem', color: settings.theme === 'light' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t('light')}</div>
                                    </div>
                                    <div
                                        onClick={() => handleThemeChange('dark')}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: `2px solid ${settings.theme === 'dark' ? 'var(--primary)' : 'var(--border)'}`,
                                            background: settings.theme === 'dark' ? 'var(--surface-hover)' : 'var(--background)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <FiMoon size={24} style={{ marginBottom: '0.5rem', color: settings.theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t('dark')}</div>
                                    </div>
                                    <div
                                        onClick={() => handleThemeChange('system')}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: `2px solid ${settings.theme === 'system' ? 'var(--primary)' : 'var(--border)'}`,
                                            background: settings.theme === 'system' ? 'var(--surface-hover)' : 'var(--background)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <FiMonitor size={24} style={{ marginBottom: '0.5rem', color: settings.theme === 'system' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t('system')}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                    {t('preferred_language')}
                                </label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem',
                                        background: 'var(--background)',
                                        color: 'var(--text-primary)',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="en">English (default)</option>
                                    <option value="hi">Hindi</option>
                                    <option value="gu">Gujarati</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 2.5rem' }}
                        >
                            <FiSave size={18} />
                            {saving ? t('saving') : t('save_settings')}
                        </button>
                    </div>
                </form>

                <style jsx>{`
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 26px;
                }
                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: var(--text-light);
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: var(--primary);
                }
                input:checked + .slider:before {
                    transform: translateX(24px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
            `}</style>
            </div>
            <Footer />
        </>
    );
}
