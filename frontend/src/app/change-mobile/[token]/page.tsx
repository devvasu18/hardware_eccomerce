'use client';

import { useState } from 'react';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ChangeMobilePage({ params }: { params: { token: string } }) {
    const router = useRouter();
    const { logout } = useAuth(); // We might force logout after change
    const [newMobile, setNewMobile] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (!/^[0-9]{10}$/.test(newMobile)) {
            setError('Please enter a valid 10-digit mobile number');
            setLoading(false);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const res = await fetch(`${API_URL}/auth/change-mobile/${params.token}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newMobile })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.message || 'Failed to change mobile number');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
                <Header />
                <div className="container" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
                    <div className="card" style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1.5rem' }}>✓</div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>Mobile Number Updated</h1>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            Your mobile number has been successfully updated. Please login again with your new number.
                        </p>
                        <button
                            onClick={() => {
                                logout();
                                // router.push('/login'); // logout usually redirects
                            }}
                            className="btn btn-primary"
                            style={{
                                padding: '0.75rem 2rem',
                                fontSize: '1rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
            <Header />
            <div className="container" style={{ maxWidth: '500px', margin: '3rem auto' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#1e293b', textAlign: 'center' }}>Change Mobile Number</h1>

                <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>

                    {error && (
                        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            {error}
                        </div>
                    )}

                    <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                        Please enter your new 10-digit mobile number.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>New Mobile Number</label>
                            <input
                                type="text"
                                value={newMobile}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setNewMobile(val);
                                }}
                                placeholder="Enter 10-digit mobile number"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Changing...' : 'Change Mobile Number'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
