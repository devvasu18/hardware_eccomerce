'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DiagnosticPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    const handleClearAndRelogin = () => {
        localStorage.clear();
        router.push('/login');
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Authentication Diagnostic</h1>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Current Auth Context</h2>
                <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                    {JSON.stringify(user, null, 2)}
                </pre>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>LocalStorage Token</h2>
                <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '0.75rem' }}>
                    {token || 'No token found'}
                </pre>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>LocalStorage User</h2>
                <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                    {storedUser || 'No user found'}
                </pre>
            </div>

            <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fbbf24' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Status</h2>
                <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Logged In:</strong> {user ? 'Yes' : 'No'}
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Role:</strong> {user?.role || 'N/A'}
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Can Access Admin:</strong> {user?.role === 'super_admin' ? '✅ Yes' : '❌ No'}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={handleClearAndRelogin}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Clear Storage & Re-login
                </button>

                <button
                    onClick={() => router.push('/login')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Go to Login
                </button>

                {user?.role === 'super_admin' && (
                    <button
                        onClick={() => router.push('/admin/users')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Go to Admin Users
                    </button>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#dbeafe', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Super Admin Credentials</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}><strong>Mobile:</strong> 9999999999</p>
                <p style={{ fontSize: '0.875rem' }}><strong>Password:</strong> 123456</p>
            </div>
        </div>
    );
}
