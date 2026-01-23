"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye } from "react-icons/fi";
import Image from "next/image";

interface User {
    _id: string;
    username: string;
    email: string;
    mobile: string;
    role: string;
    image?: string;
    createdAt: string;
}

export default function UserList() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, [page, searchTerm]);

    const fetchUsers = async () => {
        try {
            const res = await api.get(`/users?pageNumber=${page}&keyword=${searchTerm}`);
            setUsers(res.data.users);
            setTotalPages(res.data.pages);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete the user but preserve their order history.')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>View and manage registered customers.</p>
                </div>
                <Link href="/admin/users/add" className="btn btn-primary">
                    <FiPlus /> Add New User
                </Link>
            </div>

            {/* Search Bar */}
            <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <FiSearch style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        className="form-input"
                        style={{ border: 'none', boxShadow: 'none' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>Avatar</th>
                            <th>Name</th>
                            <th>Contact Info</th>
                            <th>Role</th>
                            <th>Joined Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E2E8F0', overflow: 'hidden', position: 'relative' }}>
                                        {user.image ? (
                                            <Image src={`http://localhost:5000/${user.image}`} alt={user.username} fill style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ fontWeight: 600 }}>{user.username}</td>
                                <td>
                                    <div style={{ fontSize: '0.9rem' }}>{user.email}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.mobile}</div>
                                </td>
                                <td>
                                    <span className={`badge ${user.role === 'customer' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link href={`/admin/users/${user._id}/view`} className="btn-icon" style={{ color: 'var(--primary)' }} title="360 View">
                                            <FiEye />
                                        </Link>
                                        <Link href={`/admin/users/${user._id}/edit`} className="btn-icon" style={{ color: 'var(--info)' }}>
                                            <FiEdit2 />
                                        </Link>
                                        <button onClick={() => handleDelete(user._id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Logic */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary">Prev</button>
                <div style={{ padding: '0.5rem 1rem' }}>Page {page} of {totalPages}</div>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary">Next</button>
            </div>
        </div>
    );
}
