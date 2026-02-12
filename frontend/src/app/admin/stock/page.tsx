"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { FiPlus, FiEye } from "react-icons/fi";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";

interface StockEntry {
    _id: string;
    invoice_no: string;
    bill_date: string;
    party_id: {
        _id: string;
        name: string;
    };
    final_bill_amount: number;
    tallyStatus: string; // 'pending' | 'queued' | 'saved' | 'failed'
    tallyErrorLog?: string;
}

export default function StockList() {
    const [entries, setEntries] = useState<StockEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

    const fetchStock = async () => {
        try {
            const res = await api.get('/admin/stock');
            setEntries(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const handleSync = async (id: string) => {
        setSyncing(id);
        try {
            await api.post(`/admin/stock/${id}/sync`);
            // Refresh to get updated status
            setTimeout(fetchStock, 1000); // Small delay to allow async update
        } catch (error) {
            console.error('Sync failed', error);
            showError('Sync failed. Check console for details.');
        } finally {
            setSyncing(null);
        }
    };

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
                    <h1 className="page-title">Stock Inward Register</h1>

                </div>
                <Link href="/admin/stock/add" className="btn btn-primary">
                    <FiPlus /> New Stock Entry
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <DataTable
                    title="Stock Inward Register"
                    data={entries}
                    columns={[
                        { header: 'Date', accessor: (item) => new Date(item.bill_date).toLocaleDateString(), sortable: true },
                        { header: 'Invoice No', accessor: 'invoice_no', sortable: true, className: "font-mono font-semibold" },
                        { header: 'Party', accessor: (item) => item.party_id?.name || 'Unknown', sortable: true },
                        { header: 'Amount', accessor: (item) => `₹${item.final_bill_amount}`, sortable: true, className: "font-bold text-right" },
                        {
                            header: 'Tally Status',
                            accessor: (item) => (
                                item.tallyStatus === 'saved' ? (
                                    <span className="badge" style={{ background: '#ecfdf5', color: '#065f46' }}>✓ Synced</span>
                                ) : item.tallyStatus === 'queued' ? (
                                    <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>⏳ Queued</span>
                                ) : item.tallyStatus === 'failed' ? (
                                    <div title={item.tallyErrorLog}>
                                        <span className="badge" style={{ background: '#fef2f2', color: '#991b1b', cursor: 'help' }}>Failed</span>
                                    </div>
                                ) : (
                                    <span className="badge" style={{ background: '#e2e8f0', color: '#64748B' }}>Pending</span>
                                )
                            ),
                            sortable: true
                        },
                        {
                            header: 'Actions',
                            accessor: (item) => (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    {item.tallyStatus !== 'saved' && (
                                        <button
                                            onClick={() => handleSync(item._id)}
                                            disabled={syncing === item._id}
                                            className="btn-icon"
                                            style={{ color: '#F37021' }}
                                            title="Retry Tally Sync"
                                        >
                                            {syncing === item._id ? '...' : '↻'}
                                        </button>
                                    )}
                                    <button className="btn-icon">
                                        <FiEye />
                                    </button>
                                </div>
                            ),
                            sortable: false
                        }
                    ]}
                    searchKeys={['invoice_no']}
                    itemsPerPage={10}
                />
            )}
        </div>
    )
}
