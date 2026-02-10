'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '../../hooks/useModal';
import Modal from '../../components/Modal';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter();
    const { token } = use(params);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { modalState, showSuccess, showError, hideModal } = useModal();
    const [loading, setLoading] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const res = await fetch(`/api/auth/resetpassword/${token}/check`);
                if (!res.ok) {
                    setIsTokenValid(false);
                }
            } catch (error) {
                setIsTokenValid(false);
            } finally {
                setIsValidating(false);
            }
        };
        checkToken();
    }, [token]);

    const validatePassword = (password: string) => {
        return password.length >= 8;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showError("Passwords do not match");
            return;
        }

        if (!validatePassword(password)) {
            showError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/auth/resetpassword/${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                showSuccess('Password has been reset successfully. You can now login.', 'Success', {
                    onConfirm: () => router.push('/login')
                });
            } else {
                showError(data.message || 'Failed to reset password. Link may be expired.');
            }

        } catch (error) {
            showError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (isValidating) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)' }}>
                <div style={{ color: 'white', fontSize: '1.2rem' }}>Verifying link...</div>
            </div>
        );
    }

    if (!isTokenValid) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)' }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#1E293B', fontWeight: 700 }}>Link Expired</h1>
                    <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>This password reset link is invalid or has expired.</p>
                    <Link href="/forgot-password" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'white', borderRadius: '8px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1E293B', fontWeight: 700 }}>Set New Password</h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1rem' }}
                            placeholder="Min 8 chars"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1rem' }}
                            placeholder="Confirm password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Reseting...' : 'Reset Password'}
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
