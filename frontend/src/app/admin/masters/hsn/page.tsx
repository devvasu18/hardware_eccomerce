"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import FormModal from "../../../components/FormModal";

interface HSN {
    _id: string;
    hsn_code: string;
    gst_rate: number;
}

export default function HSNMaster() {
    const [hsns, setHsns] = useState<HSN[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, setValue } = useForm<{ hsn_code: string; gst_rate: number }>();

    useEffect(() => {
        fetchHSNs();
    }, []);

    const fetchHSNs = async () => {
        try {
            const res = await api.get('/admin/hsn');
            setHsns(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: { hsn_code: string; gst_rate: number }) => {
        try {
            if (editingId) {
                await api.put(`/admin/hsn/${editingId}`, data);
                alert('HSN Updated successfully');
            } else {
                await api.post('/admin/hsn', data);
                alert('HSN Created successfully');
            }
            handleCloseModal();
            fetchHSNs();
        } catch (error) {
            console.error(error);
            alert('Operation failed');
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        reset();
        setIsModalOpen(true);
    };

    const startEdit = (hsn: HSN) => {
        setEditingId(hsn._id);
        setValue('hsn_code', hsn.hsn_code);
        setValue('gst_rate', hsn.gst_rate);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this HSN Code?')) return;
        try {
            await api.delete(`/admin/hsn/${id}`);
            fetchHSNs();
        } catch (error) {
            alert('Delete failed');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0 }}>HSN Code Management</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Manage Goods and Services Tax codes for your inventory.</p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    <FiPlus /> Add New HSN Code
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">Existing HSN Codes</div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>HSN Code</th>
                            <th>GST Rate</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hsns.map(hsn => (
                            <tr key={hsn._id}>
                                <td style={{ fontWeight: 500 }}>{hsn.hsn_code}</td>
                                <td>
                                    <span className="badge badge-success">{hsn.gst_rate}% GST</span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => startEdit(hsn)} className="btn-icon" style={{ color: 'var(--info)' }}><FiEdit2 /></button>
                                        <button onClick={() => handleDelete(hsn._id)} className="btn-icon" style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {hsns.length === 0 && !loading && (
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Edit HSN Code' : 'Add New HSN Code'}
                maxWidth="500px"
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">HSN Code</label>
                            <input
                                {...register("hsn_code", { required: true })}
                                className="form-input"
                                placeholder="e.g. 8467"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">GST Rate (%)</label>
                            <select
                                {...register("gst_rate", { required: true })}
                                className="form-select"
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn" style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            {editingId ? 'Update HSN Code' : 'Create HSN Code'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
