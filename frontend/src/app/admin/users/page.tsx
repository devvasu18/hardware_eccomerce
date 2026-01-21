'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface User {
    _id?: string;
    username: string;
    mobile: string;
    role: string;
    customerType: string;
    wholesaleDiscount?: number;
    address?: string;
    password?: string; // For creation only
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<User>({
        username: '',
        mobile: '',
        role: 'customer',
        customerType: 'regular',
        wholesaleDiscount: 0,
        address: '',
        password: ''
    });

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                if (res.status === 401 || res.status === 403) {
                    alert('Access Denied: You are not authorized to view users. Please login as Admin.');
                } else {
                    alert('Failed to fetch users: ' + res.statusText);
                }
            }
        } catch (error) {
            alert('Failed to fetch users (Network Error)');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.mobile && u.mobile.toString().includes(searchTerm));

        if (searchTerm) return matchesSearch;

        return u.customerType === 'wholesale';
    });

    const handleCreateClick = () => {
        setEditingUser(null); // Create mode
        setFormData({
            username: '',
            mobile: '',
            role: 'customer',
            customerType: 'wholesale', // Default as per "Create Wholesale User" button intent
            wholesaleDiscount: 0,
            address: '',
            password: ''
        });
        setShowModal(true);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setFormData({
            ...user,
            wholesaleDiscount: user.wholesaleDiscount || 0,
            password: '' // Don't show password
        });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const isEdit = !!editingUser?._id;
            const url = isEdit
                ? `http://localhost:5000/api/users/${editingUser._id}`
                : `http://localhost:5000/api/users`;

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Save failed', error);
            alert('Network error');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>User Management</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Search by name or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            width: '300px'
                        }}
                    />
                    <button
                        onClick={handleCreateClick}
                        className="btn btn-primary"
                        style={{ background: '#F37021', border: 'none' }}
                    >
                        + Create Wholesale Customer
                    </button>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Username</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Mobile</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Role</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Type</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Discount</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{u.username}</td>
                                <td style={{ padding: '1rem' }}>{u.mobile}</td>
                                <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{u.role.replace('_', ' ')}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: u.customerType === 'wholesale' ? '#dbeafe' : '#f1f5f9',
                                        color: u.customerType === 'wholesale' ? '#1e40af' : '#64748b'
                                    }}>
                                        {u.customerType}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {u.wholesaleDiscount ? `${u.wholesaleDiscount}%` : '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={() => handleEditClick(u)}
                                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
                            {editingUser ? 'Edit User' : 'Create Wholesale Customer'}
                        </h2>

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mobile</label>
                                <input
                                    type="text"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    required
                                />
                            </div>

                            {!editingUser && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        required
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Address</label>
                                <textarea
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                >
                                    <option value="customer">Customer</option>
                                    <option value="super_admin">Super Admin</option>
                                    <option value="ops_admin">Ops Admin</option>
                                    <option value="logistics_admin">Logistics Admin</option>
                                    <option value="accounts_admin">Accounts Admin</option>
                                    <option value="support_staff">Support Staff</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem', background: '#f0f9ff', padding: '1rem', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#0369a1' }}>
                                    Wholesale Discount (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.wholesaleDiscount || ''}
                                    onChange={e => setFormData({ ...formData, wholesaleDiscount: e.target.value ? parseFloat(e.target.value) : 0 })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#0c4a6e' }}>
                                    Setting this value greater than 0 will automatically mark the user as a <strong>Wholesale Customer</strong>.
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ color: '#64748B' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
