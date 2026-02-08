"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import Image from "next/image";
import FormModal from "../../../components/FormModal";

interface Category {
    _id: string;
    name: string;
}

interface SubCategory {
    _id: string;
    name: string;
    slug: string;
    category_id: Category;
    image: string;
}

export default function SubCategoryMaster() {
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<{ name: string; slug: string; category_id: string }>();
    const name = watch('name');

    useEffect(() => {
        fetchSubCategories();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (name && !editingId) {
            setValue('slug', name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [name, editingId, setValue]);

    const fetchSubCategories = async () => {
        try {
            const res = await api.get('/admin/sub-categories');
            setSubCategories(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const onSubmit = async (data: { name: string; slug: string; category_id: string }) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('slug', data.slug);
            formData.append('category_id', data.category_id);
            if (image) formData.append('image', image);

            if (editingId) {
                await api.put(`/admin/sub-categories/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Updated successfully');
            } else {
                await api.post('/admin/sub-categories', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Created successfully');
            }

            handleCloseModal();
            fetchSubCategories();
        } catch (error) {
            console.error(error);
            alert('Operation failed');
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        reset();
        setImage(null);
        setPreviewImage(null);
        setIsModalOpen(true);
    };

    const handleEdit = (sc: SubCategory) => {
        setEditingId(sc._id);
        setValue('name', sc.name);
        setValue('slug', sc.slug);
        // Handle case where category_id might be populated object or ID string based on API response
        setValue('category_id', sc.category_id?._id || (typeof sc.category_id === 'string' ? sc.category_id : ''));
        setImage(null);
        setPreviewImage(sc.image ? (sc.image.startsWith('http') ? sc.image : `/api/${sc.image}`) : null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset();
        setImage(null);
        setPreviewImage(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this Sub-Category?')) return;
        try {
            await api.delete(`/admin/sub-categories/${id}`);
            fetchSubCategories();
        } catch (error) {
            alert('Delete failed');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Sub-Category Manager</h1>
                <button onClick={handleAdd} className="btn btn-primary">
                    <FiPlus /> Add New Sub-Category
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">Sub-Category List</div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>Image</th>
                            <th>Name</th>
                            <th>Parent Category</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subCategories.map(sc => (
                            <tr key={sc._id}>
                                <td>
                                    <div className="img-preview">
                                        {sc.image ? (
                                            <Image
                                                src={sc.image.startsWith('http') ? sc.image : `/api/${sc.image}`}
                                                alt={sc.name}
                                                fill
                                            />
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>N/A</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{sc.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sc.slug}</div>
                                </td>
                                <td>
                                    <span className="badge badge-warning" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                                        {sc.category_id?.name || 'Unknown'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => handleEdit(sc)} className="btn-icon" style={{ color: 'var(--primary)', marginRight: '0.5rem' }}>
                                        <FiEdit2 />
                                    </button>
                                    <button onClick={() => handleDelete(sc._id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Edit Sub-Category' : 'Add New Sub-Category'}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Parent Category</label>
                            <select
                                {...register("category_id", { required: "Category is required" })}
                                className="form-select"
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="">-- Select Category --</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                            {errors.category_id && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.category_id.message}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sub-Category Name</label>
                            <input
                                {...register("name", { required: true })}
                                className="form-input"
                                placeholder="e.g. Cordless Drills"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Slug</label>
                            <input
                                {...register("slug", { required: true })}
                                className="form-input"
                                readOnly
                                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#f9fafb' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cover Image</label>
                            <div className="upload-box" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', border: '1px dashed #ccc', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                setImage(file);
                                                setPreviewImage(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>
                                {previewImage && (
                                    <div style={{ marginTop: '0.5rem', width: '200px', height: '120px', position: 'relative', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                        <Image
                                            src={previewImage}
                                            alt="Preview"
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn" style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            {editingId ? 'Update Sub-Category' : 'Create Sub-Category'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
