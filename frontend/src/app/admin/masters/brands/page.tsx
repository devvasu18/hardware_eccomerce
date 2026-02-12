"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiUploadCloud } from "react-icons/fi";
import Image from "next/image";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { useModal } from "../../../hooks/useModal";

interface Brand {
    _id: string;
    name: string;
    slug: string;
    logo_image: string;
}

export default function BrandMaster() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [logo, setLogo] = useState<File | null>(null);

    const { register, handleSubmit, reset, setValue, watch } = useForm<{ name: string; slug: string }>();
    const name = watch('name');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const { modalState, showModal: showConfirmModal, hideModal: hideConfirmModal, showSuccess, showError } = useModal();

    useEffect(() => {
        fetchBrands();
    }, []);

    useEffect(() => {
        if (name && !editingId) {
            setValue('slug', name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [name, editingId, setValue]);

    const fetchBrands = async () => {
        try {
            const res = await api.get('/admin/brands');
            setBrands(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingId(null);
        setLogo(null);
        reset({ name: '', slug: '' });
        setIsFormOpen(true);
    };

    const handleEdit = (brand: Brand) => {
        setEditingId(brand._id);
        setLogo(null);
        setValue('name', brand.name);
        setValue('slug', brand.slug);
        setIsFormOpen(true);
    };

    const onSubmit = async (data: { name: string; slug: string }) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('slug', data.slug);
            if (logo) formData.append('logo_image', logo);

            if (editingId) {
                await api.put(`/admin/brands/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/brands', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsFormOpen(false);
            reset();
            setLogo(null);
            fetchBrands();
        } catch (error) {
            showError('Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        showConfirmModal(
            'Delete Brand',
            'Delete this Brand?',
            'warning',
            {
                showCancel: true,
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.delete(`/admin/brands/${id}`);
                        fetchBrands();
                        showSuccess("Brand deleted successfully");
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
                onClose={hideConfirmModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
                showCancel={modalState.showCancel}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Brand Management</h1>

                </div>
                <button onClick={handleAddNew} className="btn btn-primary">
                    <FiPlus /> Add New Brand
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <DataTable
                    title="All Brands"
                    data={brands}
                    columns={[
                        {
                            header: 'Logo',
                            accessor: (item) => (
                                <div className="img-preview" style={{ width: '40px', height: '40px', position: 'relative', overflow: 'hidden', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.logo_image ? (
                                        <Image
                                            src={item.logo_image.startsWith('http') ? item.logo_image : `/${item.logo_image}`}
                                            alt={item.name}
                                            fill
                                            unoptimized
                                            style={{ objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div style={{ color: '#ccc', fontWeight: 800 }}>{item.name[0]}</div>
                                    )}
                                </div>
                            ),
                            sortable: false
                        },
                        { header: 'Brand Name', accessor: 'name', sortable: true, className: "font-semibold" },
                        { header: 'Slug', accessor: 'slug', sortable: true, className: "text-muted font-mono" }
                    ]}
                    searchKeys={['name', 'slug']}
                    onEdit={handleEdit}
                    onDelete={(item) => handleDelete(item._id)}
                    itemsPerPage={10}
                />
            )}

            {/* Edit/Add Modal */}
            {isFormOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{editingId ? 'Edit Brand' : 'Add New Brand'}</span>
                            <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem' }}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Brand Name</label>
                                    <input
                                        {...register("name", { required: true })}
                                        className="form-input"
                                        placeholder="e.g. Bosch"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Slug</label>
                                    <input
                                        {...register("slug", { required: true })}
                                        className="form-input"
                                        readOnly
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Brand Logo</label>
                                    {editingId && !logo && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            Current logo will be kept if no new file is uploaded.
                                        </div>
                                    )}
                                    <div className="upload-box">
                                        <input
                                            type="file"
                                            onChange={(e) => e.target.files && setLogo(e.target.files[0])}
                                        />
                                        <div style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                                            <FiUploadCloud size={32} />
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                            {logo ? logo.name : "Click to upload new logo"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="btn" style={{ background: '#f1f5f9' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Update Brand' : 'Create Brand'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
