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

            await api.post('/admin/sub-categories', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            reset();
            setImage(null);
            fetchSubCategories();
        } catch (error) {
            alert('Operation failed');
        }
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
                <div className="card-header">
                    Add New Sub-Category
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
                            <div className="upload-box" style={{ padding: '1rem', flexDirection: 'row', gap: '1rem', justifyContent: 'flex-start' }}>
                                <input
                                    type="file"
                                    onChange={(e) => e.target.files && setImage(e.target.files[0])}
                                />
                                <div style={{ color: 'var(--primary)' }}>
                                    <FiUploadCloud size={24} />
                                </div>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    {image ? image.name : "Choose file..."}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary">
                            <FiPlus /> Create Sub-Category
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
                                            <Image src={`/api/${sc.image}`} alt={sc.name} fill />
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
