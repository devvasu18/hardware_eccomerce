"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { FiEye, FiFilter } from "react-icons/fi";
import ExportButton from "../../components/ExportButton";

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

interface Order {
    _id: string;
    user: { username: string };
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    createdAt: string;
}

export default function OrderList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        try {
            const res = await api.get(`/orders?pageNumber=${page}&status=${statusFilter}`);
            setOrders(res.data.orders);
            setTotalPages(res.data.pages);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        try {
            const res = await api.get('/orders/export', {
                params: { format, status: statusFilter },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const ext = format === 'excel' ? 'xlsx' : format;
            link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Delivered': return 'badge-success';
            case 'Cancelled':
            case 'Payment Failed': return 'badge-danger';
            case 'Order Placed': return 'badge-info'; // Use info or warning
            case 'Payment Pending': return 'badge-warning';
            default: return 'badge-warning';
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Order Processing</h1>

                </div>
                <ExportButton onExport={handleExport} />
            </div>


            {/* Filters */}
            <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <FiFilter style={{ color: 'var(--text-muted)' }} />
                <select
                    className="form-select"
                    style={{ width: 'auto' }}
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Statuses</option>
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Payment Failed">Payment Failed</option>
                    <option value="Order Placed">Order Placed</option>
                    <option value="Packed">Packed</option>
                    <option value="Assigned to Bus">Assigned to Bus</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{order._id.slice(-6).toUpperCase()}</td>
                                <td>{order.user?.username || 'Guest'}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td style={{ fontWeight: 600 }}>₹{order.totalAmount}</td>
                                <td>
                                    <span style={{ fontSize: '0.8rem', color: order.paymentStatus === 'Paid' ? 'var(--success)' : 'orange' }}>
                                        {order.paymentMethod} ({order.paymentStatus})
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <Link href={`/admin/orders/${order._id}`} className="btn-icon" style={{ color: 'var(--primary)' }}>
                                        <FiEye /> View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No orders found matching filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary">Prev</button>
                    <div style={{ padding: '0.5rem 1rem' }}>Page {page} of {totalPages}</div>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary">Next</button>
                </div>
            )}
        </div>
    );
}
