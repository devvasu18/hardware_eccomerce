"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import Image from "next/image";

interface Banner {
    _id: string;
    title: string;
    image: string;
    offer_id?: {
        title: string;
        percentage: number;
    };
    product_ids?: any[];
}

export default function BannerList() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await api.get('/banners');
            setBanners(res.data);
        } catch (error) {
            console.error('Failed to fetch banners', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        try {
            await api.delete(`/banners/${id}`);
            setBanners(prev => prev.filter(b => b._id !== id));
        } catch (error) {
            alert('Failed to delete banner');
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Banner Manager</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage homepage sliders and promotional banners.</p>
                </div>
                <Link href="/admin/banners/add" className="btn btn-primary">
                    <FiPlus /> Add New Banner
                </Link>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '150px' }}>Image</th>
                            <th>Title</th>
                            <th>Linked To</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {banners.map(banner => (
                            <tr key={banner._id}>
                                <td>
                                    <div style={{ width: '120px', height: '60px', position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                        <Image
                                            src={banner.image.startsWith('http') ? banner.image : `http://localhost:5000/${banner.image}`}
                                            alt={banner.title}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                </td>
                                <td style={{ fontWeight: 600 }}>{banner.title}</td>
                                <td>
                                    {banner.offer_id ? (
                                        <span className="badge badge-success">Offer: {banner.offer_id.title} ({banner.offer_id.percentage}%)</span>
                                    ) : (
                                        <span className="badge badge-warning">Products: {banner.product_ids?.length || 0}</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link href={`/admin/banners/${banner._id}/edit`} className="btn-icon" style={{ color: 'var(--info)' }}>
                                            <FiEdit2 />
                                        </Link>
                                        <button onClick={() => handleDelete(banner._id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {banners.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No banners found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
