"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { FiPlus, FiEdit2, FiTrash2, FiTag } from "react-icons/fi";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";

interface Coupon {
    _id: string;
    code: string;
    description: string;
    discount_type: 'Percentage' | 'Fixed Amount';
    discount_value: number;
    usage_count: number;
    status: boolean;
    expiry_date?: string;
}

export default function CouponList() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

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
        showModal(
            'Delete Coupon',
            'Delete this coupon?',
            'warning',
            {
                showCancel: true,
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.delete(`/coupons/${id}`);
                        setCoupons(prev => prev.filter(c => c._id !== id));
                        showSuccess("Coupon deleted successfully");
                    } catch (error) {
                        showError('Failed to delete coupon');
                    }
                }
            }
        );
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setCoupons(prev => prev.map(c => c._id === id ? { ...c, status: !currentStatus } : c));
            await api.put(`/coupons/${id}`, { status: !currentStatus });
            showSuccess('Status updated');
        } catch (error) {
            showError('Failed to update status');
            fetchCoupons(); // Revert on error
        }
    }

    return (
        <div className="container">
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Coupon Manager</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Create and manage discount codes.</p>
                </div>
                <Link href="/admin/coupons/add" className="btn btn-primary">
                    <FiPlus /> New Coupon
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <DataTable
                    title="Active Coupons"
                    data={coupons}
                    columns={[
                        {
                            header: 'Code',
                            accessor: (item) => (
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#F37021', letterSpacing: '1px' }}>
                                    {item.code}
                                </div>
                            ),
                            sortable: true
                        },
                        {
                            header: 'Discount',
                            accessor: (item) => (
                                <span className="badge badge-warning">
                                    {item.discount_type === 'Percentage' ? `${item.discount_value}% OFF` : `₹${item.discount_value} OFF`}
                                </span>
                            ),
                            sortable: true
                        },
                        {
                            header: 'Expiry Date',
                            accessor: (item) => item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'No Expiry',
                            sortable: true
                        },
                        { header: 'Description', accessor: 'description', sortable: false },
                        { header: 'Used', accessor: (item) => `${item.usage_count} times`, sortable: true },
                        {
                            header: 'Status',
                            accessor: (item) => (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleStatus(item._id, item.status); }}
                                    className={`badge ${item.status ? 'badge-success' : 'badge-warning'}`}
                                    style={{ border: 'none', cursor: 'pointer', opacity: item.status ? 1 : 0.7 }}
                                >
                                    {item.status ? 'Active' : 'Inactive'}
                                </button>
                            ),
                            sortable: true
                        }
                    ]}
                    searchKeys={['code', 'description']}
                    onEdit={(item) => window.location.href = `/admin/coupons/${item._id}/edit`}
                    onDelete={(item) => handleDelete(item._id)}
                    itemsPerPage={10}
                />
            )}
        </div>
    );
}
