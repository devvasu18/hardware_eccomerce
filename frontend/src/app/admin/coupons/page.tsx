"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { FiPlus, FiEdit2, FiTrash2, FiTag } from "react-icons/fi";

interface Coupon {
    _id: string;
    code: string;
    description: string;
    discount_type: 'Percentage' | 'Fixed Amount';
    discount_value: number;
    usage_count: number;
    status: boolean;
}

export default function CouponList() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await api.get('/coupons');
            setCoupons(res.data);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this coupon?')) return;
        try {
            await api.delete(`/coupons/${id}`);
            setCoupons(prev => prev.filter(c => c._id !== id));
        } catch (error) {
            alert('Failed to delete coupon');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setCoupons(prev => prev.map(c => c._id === id ? { ...c, status: !currentStatus } : c));
            await api.put(`/coupons/${id}`, { status: !currentStatus });
        } catch (error) {
            alert('Failed to update status');
            fetchCoupons(); // Revert on error
        }
    }

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Coupon Manager</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Create and manage discount codes.</p>
                </div>
                <Link href="/admin/coupons/add" className="btn btn-primary">
                    <FiPlus /> New Coupon
                </Link>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Description</th>
                            <th>Used</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map(coupon => (
                            <tr key={coupon._id}>
                                <td>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', letterSpacing: '1px' }}>
                                        {coupon.code}
                                    </div>
                                </td>
                                <td>
                                    <span className="badge badge-warning">
                                        {coupon.discount_type === 'Percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                    </span>
                                </td>
                                <td>{coupon.description}</td>
                                <td>{coupon.usage_count} times</td>
                                <td>
                                    <button
                                        onClick={() => toggleStatus(coupon._id, coupon.status)}
                                        className={`badge ${coupon.status ? 'badge-success' : 'badge-warning'}`}
                                        style={{ border: 'none', cursor: 'pointer', opacity: coupon.status ? 1 : 0.7 }}
                                    >
                                        {coupon.status ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link href={`/admin/coupons/${coupon._id}/edit`} className="btn-icon" style={{ color: 'var(--info)' }}>
                                            <FiEdit2 />
                                        </Link>
                                        <button onClick={() => handleDelete(coupon._id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No coupons found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
