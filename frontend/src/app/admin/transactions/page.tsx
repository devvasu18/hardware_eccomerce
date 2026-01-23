"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import { FiFilter, FiDownload, FiDollarSign, FiSearch, FiCode, FiX, FiCheck, FiAlertCircle, FiCalendar } from "react-icons/fi";

export default function TransactionList() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [selectedTx, setSelectedTx] = useState<any>(null); // For Modal

    useEffect(() => {
        fetchTransactions();
    }, [page, statusFilter, dateRange]);

    const fetchTransactions = async () => {
        try {
            let query = `/transactions?pageNumber=${page}`;
            if (statusFilter) query += `&status=${statusFilter}`;
            if (dateRange.start) query += `&startDate=${dateRange.start}`;
            if (dateRange.end) query += `&endDate=${dateRange.end}`;

            const res = await api.get(query);
            setTransactions(res.data.transactions);
            setTotalPages(res.data.pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let color = '#64748B';
        let bg = '#F1F5F9';
        let icon = null;

        if (status === 'Success') { color = '#10B981'; bg = '#ECFDF5'; icon = <FiCheck />; }
        else if (status === 'Failed') { color = '#EF4444'; bg = '#FEF2F2'; icon = <FiX />; }
        else if (status === 'Refunded') { color = '#F59E0B'; bg = '#FFFBEB'; icon = <FiAlertCircle />; }

        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: bg, color: color, padding: '4px 10px',
                borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
            }}>
                {icon} {status}
            </span>
        );
    }

    return (
        <div className="container">
            {/* Modal */}
            {selectedTx && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-in" style={{ background: 'white', width: '600px', maxHeight: '90vh', overflow: 'hidden', borderRadius: '12px' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Transaction Details</h3>
                            <button onClick={() => setSelectedTx(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><FiX size={24} /></button>
                        </div>
                        <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
                            <div className="form-grid">
                                <div>
                                    <label className="form-label">Payment ID</label>
                                    <div className="form-input" style={{ background: '#F8FAFC' }}>{selectedTx.paymentId}</div>
                                </div>
                                <div>
                                    <label className="form-label">Method</label>
                                    <div className="form-input" style={{ background: '#F8FAFC' }}>{selectedTx.paymentMethod}</div>
                                </div>
                                <div>
                                    <label className="form-label">Amount</label>
                                    <div className="form-input" style={{ background: '#F8FAFC', fontWeight: 'bold' }}>₹{selectedTx.amount}</div>
                                </div>
                                <div>
                                    <label className="form-label">Date</label>
                                    <div className="form-input" style={{ background: '#F8FAFC' }}>{new Date(selectedTx.createdAt).toLocaleString()}</div>
                                </div>
                                <div>
                                    <label className="form-label">Linked Order</label>
                                    <div className="form-input" style={{ background: '#F8FAFC', color: 'var(--primary)', fontWeight: 600 }}>
                                        #{selectedTx.order?._id?.slice(-6).toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiCode /> Gateway Response (JSON)</label>
                                <pre style={{
                                    background: '#1E293B', color: '#10B981', padding: '1rem',
                                    borderRadius: '8px', overflowX: 'auto', fontSize: '0.8rem',
                                    marginTop: '0.5rem'
                                }}>
                                    {JSON.stringify(selectedTx.gatewayResponse || {}, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Transactions</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Audit financial records / Date Range Analysis.</p>
                </div>
                <button className="btn btn-secondary">
                    <FiDownload /> Export CSV
                </button>
            </div>

            <div className="card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '250px' }}>
                    <FiSearch style={{ position: 'absolute', top: '10px', left: '10px', color: '#94A3B8' }} />
                    <input className="form-input" placeholder="Search by Payment ID..." style={{ paddingLeft: '2.5rem' }} />
                </div>

                {/* Status Filter */}
                <select
                    className="form-select"
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    style={{ width: 'auto' }}
                >
                    <option value="">All Statuses</option>
                    <option value="Success">Success</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                </select>

                <div style={{ height: '24px', width: '1px', background: '#E2E8F0', margin: '0 0.5rem' }}></div>

                {/* Date Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}><FiCalendar /> From:</span>
                    <input
                        type="date" className="form-input" style={{ width: 'auto', padding: '0.5rem' }}
                        value={dateRange.start}
                        onChange={e => { setDateRange({ ...dateRange, start: e.target.value }); setPage(1); }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>To:</span>
                    <input
                        type="date" className="form-input" style={{ width: 'auto', padding: '0.5rem' }}
                        value={dateRange.end}
                        onChange={e => { setDateRange({ ...dateRange, end: e.target.value }); setPage(1); }}
                    />
                </div>

                {(dateRange.start || dateRange.end) && (
                    <button
                        onClick={() => setDateRange({ start: '', end: '' })}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Order ID</th>
                            <th>User</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            <th>Method</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx._id}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>{tx.paymentId.substring(0, 16)}...</td>
                                <td style={{ color: 'var(--primary)', fontWeight: 600 }}>#{tx.order?._id?.slice(-6).toUpperCase()}</td>
                                <td>
                                    <div>{tx.user?.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{tx.user?.email}</div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{tx.amount}</td>
                                <td>{tx.paymentMethod}</td>
                                <td style={{ fontSize: '0.85rem' }}>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td><StatusBadge status={tx.status} /></td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => setSelectedTx(tx)} className="btn-icon">
                                        <FiCode />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && !loading && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>No transactions found matching criteria.</td></tr>
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
