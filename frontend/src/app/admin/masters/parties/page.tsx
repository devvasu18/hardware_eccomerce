"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiSave } from "react-icons/fi";
import DataTable from "../../../components/DataTable";
import FormModal from "../../../components/FormModal";
import Modal from "../../../components/Modal";
import { useModal } from "../../../hooks/useModal";

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

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Party>();

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
                showSuccess('Updated successfully');
            } else {
                await api.post('/admin/parties', data);
                showSuccess('Created successfully');
            }
            handleCloseModal();
            fetchParties();
        } catch (error) {
            console.error(error);
            showError('Operation failed');
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
        showModal(
            'Delete Party',
            'Delete this Party?',
            'warning',
            {
                showCancel: true,
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.delete(`/admin/parties/${id}`);
                        fetchParties();
                        showSuccess("Deleted successfully");
                    } catch (error) {
                        showError('Delete failed');
                    }
                }
            }
        );
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0 }}>Party Master (Suppliers)</h1>

                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    <FiPlus /> Add New Party
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <DataTable
                    title="Registered Parties"
                    data={parties}
                    columns={[
                        { header: 'Name', accessor: 'name', sortable: true, className: "font-medium" },
                        {
                            header: 'Contact',
                            accessor: (item) => (
                                <div>
                                    <div style={{ fontSize: '0.9rem' }}>{item.phone_no}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.email}</div>
                                </div>
                            ),
                            sortable: false
                        },
                        { header: 'GST', accessor: (item) => item.gst_no || '-', sortable: true }
                    ]}
                    searchKeys={['name', 'gst_no', 'phone_no', 'email']}
                    onEdit={startEdit}
                    onDelete={(item) => handleDelete(item._id)}
                    itemsPerPage={10}
                />
            )}

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
                            <input
                                {...register("phone_no", {
                                    pattern: {
                                        value: /^[0-9]{10}$/,
                                        message: "Please enter a valid 10-digit number"
                                    },
                                    minLength: { value: 10, message: "Must be exactly 10 digits" },
                                    maxLength: { value: 10, message: "Must be exactly 10 digits" }
                                })}
                                className="form-input"
                                placeholder="9876543210"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                            {errors.phone_no && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone_no.message}</span>}
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
