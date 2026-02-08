"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiSave } from "react-icons/fi";
import FormModal from "../../../components/FormModal";

interface Party {
    _id: string;
    name: string;
    email: string;
    phone_no: string;
    gst_no: string;
    address: string;
}

export default function PartyMaster() {
    const [parties, setParties] = useState<Party[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, setValue } = useForm<Party>();

    useEffect(() => {
        fetchParties();
    }, []);

    const fetchParties = async () => {
        try {
            const res = await api.get('/admin/parties');
            setParties(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: Party) => {
        try {
            if (editingId) {
                await api.put(`/admin/parties/${editingId}`, data);
                alert('Party updated successfully');
            } else {
                await api.post('/admin/parties', data);
                alert('Party created successfully');
            }
            handleCloseModal();
            fetchParties();
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

    const startEdit = (party: Party) => {
        setEditingId(party._id);
        setValue('name', party.name);
        setValue('email', party.email);
        setValue('phone_no', party.phone_no);
        setValue('gst_no', party.gst_no);
        setValue('address', party.address);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this Party?')) return;
        try {
            await api.delete(`/admin/parties/${id}`);
            fetchParties();
        } catch (error) {
            alert('Delete failed');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0 }}>Party Master (Suppliers)</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Manage suppliers and vendors for stock entry.</p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    <FiPlus /> Add New Party
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">Registered Parties</div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>GST</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parties.map(party => (
                            <tr key={party._id}>
                                <td style={{ fontWeight: 500 }}>{party.name}</td>
                                <td>
                                    <div style={{ fontSize: '0.9rem' }}>{party.phone_no}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{party.email}</div>
                                </td>
                                <td>{party.gst_no || '-'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => startEdit(party)} className="btn-icon" style={{ color: 'var(--info)' }}><FiEdit2 /></button>
                                        <button onClick={() => handleDelete(party._id)} className="btn-icon" style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {parties.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No parties found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Edit Party' : 'Add New Party'}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Party Name *</label>
                            <input {...register("name", { required: true })} className="form-input" placeholder="e.g. ABC Traders" style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">GST No</label>
                            <input {...register("gst_no")} className="form-input" placeholder="22AAAAA0000A1Z5" style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone No</label>
                            <input {...register("phone_no")} className="form-input" placeholder="+91 98765 43210" style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input {...register("email")} className="form-input" placeholder="contact@abctraders.com" style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Address</label>
                            <textarea {...register("address")} className="form-input" rows={3} placeholder="Full address..." style={{ width: '100%', padding: '0.5rem' }}></textarea>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn" style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            {editingId ? 'Update Party' : 'Create Party'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
