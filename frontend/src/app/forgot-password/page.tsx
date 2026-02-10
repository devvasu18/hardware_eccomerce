'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useModal } from '../hooks/useModal';
import Modal from '../components/Modal';

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const { modalState, showSuccess, showError, hideModal } = useModal();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let payload: any = {};
        // Simple heuristic: if it contains @, treat as email, else mobile (digits)
        if (identifier.includes('@')) {
            payload.email = identifier;
        } else {
            // Remove non-digits
            const mobile = identifier.replace(/\D/g, '');
            if (mobile.length < 10) {
                // You might want inline validation here
                return;
            }
            payload.mobile = mobile;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/auth/forgotpassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            // Should always return 200/success for security
            if (res.ok) {
                setStatus('success');
                showSuccess('If an account exists with these credentials, a reset link has been sent to your email and/or WhatsApp.', 'Request Sent', {
                    confirmText: 'Back to Login',
                    onConfirm: () => window.location.href = '/login'
                });
            } else {
                // Specific error from backend
                setStatus('idle');
                showError(data.message || 'Failed to send reset link.');
            }

        } catch (error) {
            setStatus('idle');
            showError('Network error. Please try again later.');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'white', borderRadius: '8px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.5rem', color: '#1E293B', fontWeight: 700 }}>Forgot Password</h1>
                <p style={{ textAlign: 'center', color: '#64748B', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Enter your registered email or mobile number to receive a reset link.
                </p>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#10b981', marginBottom: '1rem', fontSize: '3rem' }}>✓</div>
                        <p style={{ color: '#334155', fontWeight: 600 }}>We've processed your request.</p>
                        <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.5rem' }}>Check your Email or WhatsApp for the reset link.</p>
                        <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem', textDecoration: 'none' }}>Back to Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Email or Mobile Number</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1rem' }}
                                placeholder="john@example.com or 9876543210"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Processing...' : 'Send Reset Link'}
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <Link href="/login" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                )}
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
