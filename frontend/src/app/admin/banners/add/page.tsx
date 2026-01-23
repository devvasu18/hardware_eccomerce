"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "../../../utils/api";
import { useRouter } from "next/navigation";
import { FiSave, FiUploadCloud, FiX } from "react-icons/fi";
import Image from "next/image";

interface Offer {
    _id: string;
    title: string;
    percentage: number;
}

interface Product {
    _id: string;
    title: string;
    opening_stock: number;
}

export default function AddBannerPage() {
    const router = useRouter();
    const { register, handleSubmit, watch, setValue } = useForm();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [linkType, setLinkType] = useState<'offer' | 'products'>('offer');

    // Data
    const [offers, setOffers] = useState<Offer[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    // Multi-Select State
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    useEffect(() => {
        // Fetch dependencies
        const fetchData = async () => {
            try {
                const [offerRes, productRes] = await Promise.all([
                    api.get('/admin/offers'), // Assuming this endpoint exists, typically standard logic
                    api.get('/admin/products')
                ]);
                // If /admin/offers doesn't exist, we might fail. 
                // Checking previous files: `adminMasterRoutes` handles offers? 
                // `app.use('/api/admin', require('./routes/adminMasterRoutes'));`
                // `adminMasterRoutes` probably has `router.get('/offers', ...)` -> `/api/admin/offers`

                setOffers(offerRes.data || []);
                setAllProducts(productRes.data || []);
            } catch (error) {
                console.error('Error loading data', error);
            }
        };
        fetchData();
    }, []);

    // Filter products
    useEffect(() => {
        if (!productSearch) {
            setFilteredProducts([]);
            return;
        }
        const lower = productSearch.toLowerCase();
        setFilteredProducts(allProducts.filter(p =>
            p.title.toLowerCase().includes(lower) && !selectedProductIds.includes(p._id)
        ).slice(0, 10)); // Limit results
    }, [productSearch, allProducts, selectedProductIds]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            setValue('image', file);
        }
    };

    const toggleProduct = (id: string) => {
        if (selectedProductIds.includes(id)) {
            setSelectedProductIds(prev => prev.filter(p => p !== id));
        } else {
            setSelectedProductIds(prev => [...prev, id]);
        }
        setProductSearch('');
    };

    const onSubmit = async (data: any) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        if (data.image) formData.append('image', data.image);

        if (linkType === 'offer') {
            formData.append('offer_id', data.offer_id);
        } else {
            // Pass as comma separated string or append multiple times
            formData.append('manual_product_ids', selectedProductIds.join(','));
        }

        try {
            await api.post('/banners', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Banner created!');
            router.push('/admin/banners');
        } catch (error) {
            console.error(error);
            alert('Failed to create banner');
        }
    };

    return (
        <div className="container">
            <h1 className="page-title">Add New Banner</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="form-grid" style={{ alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Basic Info */}
                    <div className="card">
                        <div className="card-header">Basic Details</div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Banner Title</label>
                            <input {...register("title", { required: true })} className="form-input" placeholder="e.g. Summer Sale 2026" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description (Optional)</label>
                            <textarea {...register("description")} className="form-input" rows={3} placeholder="Short text for the banner..."></textarea>
                        </div>
                    </div>

                    {/* Linking Logic */}
                    <div className="card">
                        <div className="card-header">Target Link</div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setLinkType('offer')}
                                className={`btn ${linkType === 'offer' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1 }}
                            >
                                Link to Specific Offer
                            </button>
                            <button
                                type="button"
                                onClick={() => setLinkType('products')}
                                className={`btn ${linkType === 'products' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1 }}
                            >
                                Manually Select Products
                            </button>
                        </div>

                        {linkType === 'offer' && (
                            <div className="form-group">
                                <label className="form-label">Select Active Offer</label>
                                <select {...register("offer_id")} className="form-select">
                                    <option value="">-- Choose Offer --</option>
                                    {offers.map(o => <option key={o._id} value={o._id}>{o.title} ({o.percentage}%)</option>)}
                                </select>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Selecting an offer will automatically link all products currently associated with it.
                                </p>
                            </div>
                        )}

                        {linkType === 'products' && (
                            <div className="form-group">
                                <label className="form-label">Search & Add Products</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        placeholder="Type to search products..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                    {filteredProducts.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: 'white', border: '1px solid var(--border)',
                                            zIndex: 50, maxHeight: '200px', overflowY: 'auto',
                                            borderRadius: '0 0 8px 8px', boxShadow: 'var(--shadow-lg)'
                                        }}>
                                            {filteredProducts.map(p => (
                                                <div
                                                    key={p._id}
                                                    onClick={() => toggleProduct(p._id)}
                                                    style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {selectedProductIds.map(id => {
                                        const prod = allProducts.find(p => p._id === id);
                                        return (
                                            <div key={id} className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}>
                                                {prod?.title}
                                                <FiX style={{ cursor: 'pointer' }} onClick={() => toggleProduct(id)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Sidebar / Image */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card">
                        <div className="card-header">Banner Image</div>
                        <label className="upload-box">
                            <input type="file" accept="image/*" onChange={handleImageChange} required />
                            {imagePreview ? (
                                <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                                    <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} />
                                </div>
                            ) : (
                                <>
                                    <FiUploadCloud style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }} />
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Click to Upload</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JPG, PNG, WebP (Max 5MB)</div>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="card">
                        <div className="card-header">Publish</div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            <FiSave /> Save Banner
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}
