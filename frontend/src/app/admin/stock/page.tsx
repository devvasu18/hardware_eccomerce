"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { FiPlus, FiEye } from "react-icons/fi";

interface StockEntry {
    _id: string;
    invoice_no: string;
    bill_date: string;
    party_id: {
        _id: string;
        name: string;
    };
    final_bill_amount: number;
}

export default function StockList() {
    const [entries, setEntries] = useState<StockEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchStock();
    }, []);

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Stock Inward Register</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track purchase invoices and inventory additions.</p>
                </div>
                <Link href="/admin/stock/add" className="btn btn-primary">
                    <FiPlus /> New Stock Entry
                </Link>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Invoice No</th>
                            <th>Party</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(entry => (
                            <tr key={entry._id}>
                                <td>{new Date(entry.bill_date).toLocaleDateString()}</td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{entry.invoice_no}</td>
                                <td>{entry.party_id?.name || 'Unknown'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{entry.final_bill_amount}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button className="btn-icon">
                                        <FiEye />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No stock entries found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
