"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiUploadCloud } from "react-icons/fi";
import Image from "next/image";

interface Offer {
    _id: string;
    title: string;
    slug: string;
    percentage: number;
    banner_image: string;
}

export default function OfferMaster() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [image, setImage] = useState<File | null>(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<{ title: string; slug: string; percentage: number }>();
    const title = watch('title');

    useEffect(() => {
        fetchOffers();
    }, []);

    useEffect(() => {
        if (title && !editingId) {
            setValue('slug', title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [title, editingId, setValue]);

    const fetchOffers = async () => {
        try {
            const res = await api.get('/admin/offers');
            setOffers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: { title: string; slug: string; percentage: number }) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('slug', data.slug);
            formData.append('percentage', data.percentage.toString());
            if (image) formData.append('banner_image', image);

            await api.post('/admin/offers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            reset();
            setImage(null);
            fetchOffers();
        } catch (error) {
            alert('Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this Offer?')) return;
        try {
            await api.delete(`/admin/offers/${id}`);
            fetchOffers();
        } catch (error) {
            alert('Delete failed');
        }
    };

    return (
        <div className="container">
            <h1 className="page-title">Offers & Discounts</h1>

            <div className="card">
                <div className="card-header">
                    Create New Offer Bucket
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Offer Title</label>
                            <input
                                {...register("title", { required: true })}
                                className="form-input"
                                placeholder="e.g. Monsoon Sale"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Discount Percentage (%)</label>
                            <input
                                type="number"
                                {...register("percentage", { required: true })}
                                className="form-input"
                                placeholder="10"
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
                            <label className="form-label">Banner Image</label>
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
                            <FiPlus /> Add Offer
                        </button>
                    </div>
                </form>
            </div>

            <div className="table-container">
                <div className="table-header">Active Offers</div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Banner</th>
                            <th>Title</th>
                            <th>Percentage</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers.map(off => (
                            <tr key={off._id}>
                                <td>
                                    <div className="img-preview" style={{ width: '80px', height: '45px' }}>
                                        {off.banner_image ? (
                                            <Image
                                                src={off.banner_image.startsWith('http') ? off.banner_image : `/api/${off.banner_image}`}
                                                alt={off.title}
                                                fill
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: '0.75rem' }}>N/A</div>
                                        )}
                                    </div>
                                </td>
                                <td>{off.title}</td>
                                <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{off.percentage}%</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => handleDelete(off._id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
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
