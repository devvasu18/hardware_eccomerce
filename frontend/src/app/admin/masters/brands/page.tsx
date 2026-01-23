"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiUploadCloud } from "react-icons/fi";
import Image from "next/image";

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

    const [showModal, setShowModal] = useState(false);

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
        setShowModal(true);
    };

    const handleEdit = (brand: Brand) => {
        setEditingId(brand._id);
        setLogo(null);
        setValue('name', brand.name);
        setValue('slug', brand.slug);
        setShowModal(true);
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
            setShowModal(false);
            reset();
            setLogo(null);
            fetchBrands();
        } catch (error) {
            alert('Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this Brand?')) return;
        try {
            await api.delete(`/admin/brands/${id}`);
            fetchBrands();
        } catch (error) {
            alert('Delete failed');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Brand Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage manufacturers and brand details.</p>
                </div>
                <button onClick={handleAddNew} className="btn btn-primary">
                    <FiPlus /> Add New Brand
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">All Brands</div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Logo</th>
                            <th>Brand Name</th>
                            <th>Slug</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.map(brand => (
                            <tr key={brand._id}>
                                <td style={{ width: '80px' }}>
                                    <div className="img-preview">
                                        {brand.logo_image ? (
                                            <Image
                                                src={brand.logo_image.startsWith('http') ? brand.logo_image : `/${brand.logo_image}`}
                                                alt={brand.name}
                                                fill
                                                unoptimized
                                            />
                                        ) : (
                                            <div style={{ padding: '10px', textAlign: 'center', color: '#ccc', fontWeight: 800 }}>{brand.name[0]}</div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ fontWeight: 600 }}>{brand.name}</td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{brand.slug}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => handleEdit(brand)} className="btn-icon" style={{ color: 'var(--primary)', marginRight: '1rem' }}>
                                        <FiEdit2 />
                                    </button>
                                    <button onClick={() => handleDelete(brand._id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {brands.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No brands found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{editingId ? 'Edit Brand' : 'Add New Brand'}</span>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
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
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ background: '#f1f5f9' }}>Cancel</button>
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
