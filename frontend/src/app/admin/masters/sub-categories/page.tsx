"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiUploadCloud } from "react-icons/fi";
import Image from "next/image";

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

            reset();
            reset();
            setImage(null);
            setPreviewImage(null);
            setEditingId(null);
            fetchSubCategories();
        } catch (error) {
            console.error(error);
            alert('Operation failed');
        }
    };

    const handleEdit = (sc: SubCategory) => {
        setEditingId(sc._id);
        setValue('name', sc.name);
        setValue('slug', sc.slug);
        // sc.category_id might be populated (object) or string depending on backend response.
        // check fetchSubCategories response structure. 
        // Based on page.tsx, it uses populated 'name' later, so sc.category_id is an object.
        setValue('category_id', sc.category_id ? sc.category_id._id : '');
        setImage(null);
        setPreviewImage(sc.image ? (sc.image.startsWith('http') ? sc.image : `/api/${sc.image}`) : null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
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
            <h1 className="page-title">Sub-Category Manager</h1>

            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{editingId ? 'Edit Sub-Category' : 'Add New Sub-Category'}</span>
                    {editingId && (
                        <button onClick={handleCancelEdit} className="btn btn-sm" style={{ background: '#eee' }}>
                            <FiX /> Cancel
                        </button>
                    )}
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Parent Category</label>
                            <select
                                {...register("category_id", { required: "Category is required" })}
                                className="form-select"
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
                        <div className="form-group">
                            <label className="form-label">Cover Image</label>
                            <div className="upload-box" style={{ padding: '1rem', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
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
                                    <div style={{ color: 'var(--primary)' }}>
                                        <FiUploadCloud size={24} />
                                    </div>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        {image ? image.name : "Choose file..."}
                                    </span>
                                </div>
                                {previewImage && (
                                    <div style={{ marginTop: '0.5rem', width: '100%', maxWidth: '200px', height: '120px', position: 'relative', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
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
                    <div style={{ marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary">
                            {editingId ? <><FiEdit2 /> Update Sub-Category</> : <><FiPlus /> Create Sub-Category</>}
                        </button>
                    </div>
                </form>
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
        </div>
    );
}
