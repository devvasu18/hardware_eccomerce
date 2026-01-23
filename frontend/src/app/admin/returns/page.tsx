"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiMoreHorizontal, FiDollarSign, FiFilter, FiAlertCircle } from "react-icons/fi";

export default function RefundList() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedRefund, setSelectedRefund] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    // Action Form
    const [adminNote, setAdminNote] = useState('');
    const [stockAdjustment, setStockAdjustment] = useState(false);

    useEffect(() => {
        fetchRefunds();
    }, [filter]);

    const fetchRefunds = async () => {
        try {
            const res = await api.get(`/refunds?status=${filter}`);
            setRefunds(res.data.refunds);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status: string) => {
        if (!confirm(`Are you sure you want to ${status} this request?`)) return;
        setProcessing(true);
        try {
            await api.put(`/refunds/${selectedRefund._id}/status`, {
                status,
                adminNote,
                stockAdjustment
            });
            alert(`Refund ${status} successfully`);
            setSelectedRefund(null);
            fetchRefunds();
        } catch (error) {
            alert('Action failed');
        } finally {
            setProcessing(false);
        }
    };

    const openModal = (refund: any) => {
        setSelectedRefund(refund);
        setAdminNote(refund.adminNote || '');
        setStockAdjustment(false);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let bg = '#F1F5F9', color = '#64748B';
        if (status === 'Pending') { bg = '#FFF7ED'; color = '#C2410C'; }
        if (status === 'Approved') { bg = '#ECFDF5'; color = '#047857'; }
        if (status === 'Processed') { bg = '#ECFDF5'; color = '#047857'; } // Same as approved visual or darker
        if (status === 'Rejected') { bg = '#FEF2F2'; color = '#B91C1C'; }

        return <span className="badge" style={{ background: bg, color }}>{status}</span>;
    };

    return (
        <div className="container">
            {/* Modal */}
            {selectedRefund && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-in" style={{ background: 'white', width: '600px', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Process Refund Request</h3>
                            <button onClick={() => setSelectedRefund(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><FiXCircle size={24} color="#94A3B8" /></button>
                        </div>

                        <div style={{ padding: '2rem' }}>
                            <div className="form-grid" style={{ marginBottom: '2rem' }}>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>REQUEST ID</label>
                                    <div style={{ fontWeight: 600 }}>{selectedRefund._id.slice(-6).toUpperCase()}</div>
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ORDER ID</label>
                                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>#{selectedRefund.order?._id?.slice(-6).toUpperCase()}</div>
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CUSTOMER</label>
                                    <div>{selectedRefund.user?.username}</div>
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>REFUND AMOUNT</label>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{selectedRefund.amount}</div>
                                </div>
                            </div>

                            <div style={{ background: '#FFF7ED', padding: '1rem', borderRadius: '8px', border: '1px solid #FFEDD5', marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ color: '#C2410C' }}>Reason for Return</label>
                                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>{selectedRefund.reason}</p>
                                {selectedRefund.description && <p style={{ fontSize: '0.85rem', color: '#9A3412', fontStyle: 'italic' }}>"{selectedRefund.description}"</p>}
                            </div>

                            {/* Actions Area */}
                            {selectedRefund.status === 'Pending' ? (
                                <div>
                                    <div className="form-group">
                                        <label className="form-label">Admin Note (Internal)</label>
                                        <textarea
                                            className="form-input"
                                            rows={2}
                                            value={adminNote}
                                            onChange={e => setAdminNote(e.target.value)}
                                            placeholder="Add comments..."
                                        />
                                    </div>

                                    {selectedRefund.product && (
                                        <div style={{ margin: '1rem 0', display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                id="restock"
                                                checked={stockAdjustment}
                                                onChange={e => setStockAdjustment(e.target.checked)}
                                            />
                                            <label htmlFor="restock" style={{ fontSize: '0.9rem' }}>Restock Item (Add back to inventory)</label>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                        <button
                                            onClick={() => handleAction('Rejected')}
                                            className="btn btn-secondary"
                                            disabled={processing}
                                            style={{ color: 'var(--danger)', justifyContent: 'center' }}
                                        >
                                            Reject Request
                                        </button>
                                        <button
                                            onClick={() => handleAction('Approved')}
                                            className="btn btn-primary"
                                            disabled={processing}
                                            style={{ justifyContent: 'center' }}
                                        >
                                            {processing ? 'Processing...' : 'Approve Refund'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    This request has been {selectedRefund.status}.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Returns & Refunds</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage customer return requests and wallet refunds.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="">All Requests</option>
                        <option value="Pending">Pending Action</option>
                        <option value="Processed">Processed</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>Date</th>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Item/Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.map(refund => (
                            <tr key={refund._id}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{refund._id.slice(-6).toUpperCase()}</td>
                                <td style={{ fontSize: '0.85rem' }}>{new Date(refund.createdAt).toLocaleDateString()}</td>
                                <td style={{ color: 'var(--primary)', fontWeight: 600 }}>#{refund.order?._id?.slice(-6).toUpperCase()}</td>
                                <td>
                                    <div>{refund.user?.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{refund.user?.email}</div>
                                </td>
                                <td>
                                    {refund.product ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', background: '#eee', borderRadius: '4px' }}>
                                                {/* Mini img */}
                                            </div>
                                            <span style={{ fontSize: '0.9rem' }}>{refund.product.title?.substring(0, 20)}...</span>
                                        </div>
                                    ) : (
                                        <span className="badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>Full Order</span>
                                    )}
                                </td>
                                <td style={{ fontWeight: 700 }}>₹{refund.amount}</td>
                                <td><StatusBadge status={refund.status} /></td>
                                <td>
                                    <button onClick={() => openModal(refund)} className="btn btn-sm btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {refunds.length === 0 && !loading && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>No refund requests found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
