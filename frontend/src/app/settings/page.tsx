'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../utils/api';
// Using standard HTML elements or Lucide/Feather icons if available, assuming standard react-icons are used in project
import { FiSave, FiBell, FiGlobe, FiMoon, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function UserSettingsPage() {
    const { user, loadUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [settings, setSettings] = useState({
        notifications: {
            email: true,
            whatsapp: true,
            sms: true
        },
        language: 'en',
        theme: 'light'
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
                theme: user.settings.theme || 'light'
            });
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await api.put('/auth/settings', settings);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            await loadUser(); // Refresh user context to apply settings globally if needed
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', minHeight: '80vh' }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                    Account Settings
                </h1>
                <p style={{ color: '#64748B', fontSize: '1rem' }}>
                    Manage your preferences and notification settings.
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
                    backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: message.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#f87171'}`
                }}>
                    {message.type === 'success' ? <FiCheck size={20} /> : <FiAlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave}>
                {/* Notification Settings */}
                <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                            <FiBell size={20} />
                        </div>
                        Notification Preferences
                    </h2>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {/* Email Notifications */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div>
                                <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Email Notifications</p>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                    Receive order updates, invoices, and promotions via email
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div>
                                <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>WhatsApp Notifications</p>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                    Get real-time updates and delivery status on WhatsApp
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div>
                                <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>SMS Notifications</p>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                                    Receive critical alerts and OTPs via SMS
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

                {/* Preferences Section */}
                <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '8px', color: '#16a34a' }}>
                            <FiGlobe size={20} />
                        </div>
                        General Preferences
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Language
                            </label>
                            <select
                                value={settings.language}
                                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                            >
                                <option value="en">English (default)</option>
                                <option value="hi">Hindi</option>
                                <option value="gu">Gujarati</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                Theme
                            </label>
                            <select
                                value={settings.theme}
                                onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                            >
                                <option value="light">Light Mode</option>
                                <option value="dark">Dark Mode</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <FiSave size={18} />
                        {saving ? 'Saving Changes...' : 'Save Settings'}
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
                    background-color: #cbd5e1;
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
                    background-color: #3b82f6;
                }
                input:focus + .slider {
                    box-shadow: 0 0 1px #3b82f6;
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
    );
}
