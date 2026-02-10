'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage() {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password })
            });

            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);

                // Redirect based on role
                const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff', 'admin'];
                if (adminRoles.includes(data.user.role)) {
                    router.push('/admin');
                } else {
                    router.push('/');
                }

            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Check backend.');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'white' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1E293B' }}>Industrial Login</h1>

                {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mobile Number</label>
                        <input
                            type="tel"
                            value={mobile}
                            onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            placeholder="9876543210"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            title="Please enter a valid 10-digit mobile number"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                placeholder="********"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748B'
                                }}
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Secure Login</button>
                    <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#64748B' }}>
                        Don't have an account? <a href="/signup" style={{ color: '#F37021', textDecoration: 'none', fontWeight: 600 }}>Sign up</a>
                    </p>
                    <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                        <a href="/forgot-password" style={{ color: '#64748B', textDecoration: 'none' }}>Forgot Password?</a>
                    </p>
                </form>
            </div>
        </div>
    );
}
