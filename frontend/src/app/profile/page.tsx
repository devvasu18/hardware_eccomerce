'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ProfilePage() {
    const { user, login } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        mobile: ''
    });

    // Mobile Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForMobileChange, setPasswordForMobileChange] = useState('');
    const [mobileChangeLoading, setMobileChangeLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRequestMobileChange = async () => {
        setMobileChangeLoading(true);
        setError('');
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const res = await fetch(`${API_URL}/auth/request-mobile-change`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: passwordForMobileChange })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || 'Verification link sent to your email.');
                setShowPasswordModal(false);
                setPasswordForMobileChange('');
            } else {
                // If error, show it in the main error area or keep modal open?
                // Let's close modal and show error in main page to avoid UI clutter in modal, or better, show prompt in modal?
                // For simplicity, close modal and show error on page.
                setError(data.message || 'Failed to request mobile change.');
                setShowPasswordModal(false);
            }
        } catch (err) {
            setError('Network error occurred.');
            setShowPasswordModal(false);
        } finally {
            setMobileChangeLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                mobile: user.mobile || ''
            });
        } else {
            // Redirect if not logged in
            // router.push('/login'); // Handled by AuthContext mostly but good processing
        }
    }, [user, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Profile updated successfully!');
                // Update AuthContext user
                const updatedUser = { ...user, ...data }; // data should return updated user fields
                login(token || '', updatedUser); // Re-login strictly to update state
            } else {
                setError(data.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('Network error occurring while updating profile.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <main>
                <Header />
                <div className="container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                    <p>Please log in to view your profile.</p>
                </div>
            </main>
        );
    }

    return (
        <main style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: '4rem' }}>
            <Header />
            <div className="container" style={{ maxWidth: '600px', margin: '3rem auto' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-primary)' }}>My Profile</h1>

                <div className="card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>

                    {message && (
                        <div style={{ padding: '1rem', background: 'rgba(22, 101, 52, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--success)' }}>
                            {message}
                        </div>
                    )}
                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(153, 27, 27, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--danger)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)' }}>Mobile Number</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!formData.email) {
                                            setError('Please add an email address first to change your mobile number.');
                                            return;
                                        }
                                        setShowPasswordModal(true);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary)',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        padding: 0
                                    }}
                                >
                                    Change Mobile No.
                                </button>
                            </div>
                            <input
                                type="text"
                                name="mobile"
                                value={formData.mobile}
                                disabled
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                                title="Mobile number cannot be changed directly"
                            />
                        </div>

                        {/* Password Confirmation Modal for Mobile Change */}
                        {showPasswordModal && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}>
                                <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Verify Password</h3>
                                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        To change your mobile number, please enter your current password. A verification link will be sent to your email <strong>{formData.email}</strong>.
                                    </p>
                                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={passwordForMobileChange}
                                            onChange={(e) => setPasswordForMobileChange(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', outline: 'none' }}
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
                                                color: 'var(--text-muted)'
                                            }}
                                        >
                                            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => { setShowPasswordModal(false); setPasswordForMobileChange(''); }}
                                            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRequestMobileChange}
                                            disabled={mobileChangeLoading || !passwordForMobileChange}
                                            style={{
                                                padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer',
                                                opacity: (mobileChangeLoading || !passwordForMobileChange) ? 0.7 : 1
                                            }}
                                        >
                                            {mobileChangeLoading ? 'Processing...' : 'Send Link'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isLoading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>
                </div>
            </div >
        </main >
    );
}
