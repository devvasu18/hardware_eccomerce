"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiUploadCloud } from "react-icons/fi";
import Image from "next/image";
import FormModal from "../../../components/FormModal";

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
    const [image, setImage] = useState<File | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<{ title: string; slug: string; percentage: number }>();
    const title = watch('title');

    useEffect(() => {
        fetchOffers();
    }, []);

    useEffect(() => {
        if (title) {
            setValue('slug', title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [title, setValue]);

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

            alert('Offer Created Successfully');
            handleCloseModal();
            fetchOffers();
        } catch (error) {
            console.error(error);
            alert('Operation failed');
        }
    };

    const handleAdd = () => {
        reset();
        setImage(null);
        setPreviewImage(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        reset();
        setImage(null);
        setPreviewImage(null);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Offers & Discounts</h1>
                <button onClick={handleAdd} className="btn btn-primary">
                    <FiPlus /> Create New Offer
                </button>
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
                                    <div className="img-preview" style={{ width: '80px', height: '45px', position: 'relative' }}>
                                        {off.banner_image ? (
                                            <Image
                                                src={off.banner_image.startsWith('http') ? off.banner_image : `/api/${off.banner_image}`}
                                                alt={off.title}
                                                fill
                                                style={{ objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: '0.75rem', background: '#f3f4f6', borderRadius: '4px' }}>N/A</div>
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
                        {offers.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No offers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Create New Offer Bucket"
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Offer Title</label>
                            <input
                                {...register("title", { required: true })}
                                className="form-input"
                                placeholder="e.g. Monsoon Sale"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Discount Percentage (%)</label>
                            <input
                                type="number"
                                {...register("percentage", { required: true })}
                                className="form-input"
                                placeholder="10"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Slug</label>
                            <input
                                {...register("slug", { required: true })}
                                className="form-input"
                                readOnly
                                style={{ width: '100%', padding: '0.5rem', background: '#f9fafb' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Banner Image</label>
                            <div className="upload-box" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', border: '1px dashed #ccc', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                                    <div style={{ marginTop: '0.5rem', width: '200px', height: '100px', position: 'relative', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
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
                            <FiPlus /> Add Offer
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
