'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../hooks/useModal';
import Modal from '../components/Modal';

export default function ChangePasswordPage() {
    const { user, login } = useAuth();
    const router = useRouter();
    const { modalState, showSuccess, showError, hideModal } = useModal();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'newPassword' || e.target.name === 'confirmPassword') {
            setPasswordError('');
        }
    };

    const validatePassword = (password: string) => {
        // Min 8 chars
        return password.length >= 8;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setPasswordError("Passwords don't match");
            return;
        }

        if (!validatePassword(formData.newPassword)) {
            setPasswordError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Update token in context if returned
                if (data.token && user) {
                    login(data.token, user);
                }
                showSuccess('Password changed successfully.', 'Success', {
                    onConfirm: () => {
                        router.push('/profile'); // Redirect to profile or home
                    }
                });
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showError(data.message || 'Failed to change password');
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem' }}>
            <div className="card" style={{ padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>Change Password</h1>
                    <Link href="/profile" style={{ color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ← Back to Profile
                    </Link>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            required
                            placeholder="Enter current password"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            placeholder="Enter new password"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                        <small style={{ display: 'block', marginTop: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                            Min 8 characters.
                        </small>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm new password"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>

                    {passwordError && (
                        <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#ef4444', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
                            {passwordError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 600, marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

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
