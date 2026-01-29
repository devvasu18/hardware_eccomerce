"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "../../../../utils/api";
import { useRouter } from "next/navigation";
import { FiSave, FiUploadCloud, FiX, FiTrash2 } from "react-icons/fi";
import Image from "next/image";

interface Banner {
    _id: string;
    title: string;
    description: string;
    image: string;
    offer_id?: string;
    product_ids: { _id: string; title: string, opening_stock: number }[];
    position?: string;
    textColor?: string;
    buttonColor?: string;
    buttonText?: string;
    buttonLink?: string;
}

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

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { register, handleSubmit, watch, setValue } = useForm();
    const [bannerId, setBannerId] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [linkType, setLinkType] = useState<'offer' | 'products'>('offer');

    // Data
    const [offers, setOffers] = useState<Offer[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    // Loaded Banner Data
    const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);

    // Multi-Select State (For ADDING new manual products)
    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [newProductIds, setNewProductIds] = useState<string[]>([]); // Products we want to ADD on save

    useEffect(() => {
        params.then(p => {
            setBannerId(p.id);
            fetchInitialData(p.id);
        });
    }, [params]);

    const fetchInitialData = async (id: string) => {
        try {
            const [offerRes, productRes, bannerRes] = await Promise.all([
                api.get('/admin/offers'),
                api.get('/admin/products'),
                api.get('/banners') // Get all to filter, or specific if /api/banners/:id exists (likely does via standard rest or I made a findById in controller?)
                // Controller has updateBanner at /:id but do I have getById?
                // The prompt for "API Endpoints" didn't explicitly ask for GET /:id but update needs it.
                // Standard REST usually has it. My controller `getBanners` was GET /.
                // I did NOT implement `getBannerById` in my controller code block in Step 616.
                // BUT `updateBanner` finds by ID.
                // I need to fetch the specific banner. I might have to rely on proper REST or add it.
                // Let's check my `bannerController.js` in Step 616... Nope, missing GET /:id.
                // I should add it quickly or just filter from the list if the list is small (it is).
            ]);

            // Temporary workaround if GET /:id is missing: Find in list
            const foundBanner = bannerRes.data.find((b: any) => b._id === id);

            setOffers(offerRes.data || []);
            setAllProducts(productRes.data || []);

            if (foundBanner) {
                setValue('title', foundBanner.title);
                setValue('description', foundBanner.description);
                setValue('offer_id', foundBanner.offer_id?._id || foundBanner.offer_id); // Handle populated vs string

                // Styles
                setValue('position', foundBanner.position || 'center-left');
                setValue('textColor', foundBanner.textColor || '#ffffff');
                setValue('buttonColor', foundBanner.buttonColor || '#0F172A');
                setValue('buttonText', foundBanner.buttonText || 'Shop Now');
                setValue('buttonLink', foundBanner.buttonLink || '/products');

                setImagePreview(foundBanner.image.startsWith('http') ? foundBanner.image : `http://localhost:5000/${foundBanner.image}`);

                if (foundBanner.offer_id) {
                    setLinkType('offer');
                } else {
                    setLinkType('products');
                }

                // Populate linked products
                setLinkedProducts(foundBanner.product_ids || []);
            }
        } catch (error) {
            console.error('Error loading data', error);
        }
    };

    // Filter products
    useEffect(() => {
        if (!productSearch) {
            setFilteredProducts([]);
            return;
        }
        const lower = productSearch.toLowerCase();
        setFilteredProducts(allProducts.filter(p =>
            p.title.toLowerCase().includes(lower) &&
            !linkedProducts.find(lp => lp._id === p._id) &&
            !newProductIds.includes(p._id)
        ).slice(0, 5));
    }, [productSearch, allProducts, linkedProducts, newProductIds]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            setValue('image', file);
        }
    };

    const toggleNewProduct = (id: string) => {
        if (newProductIds.includes(id)) {
            setNewProductIds(prev => prev.filter(p => p !== id));
        } else {
            setNewProductIds(prev => [...prev, id]);
        }
        setProductSearch('');
    }

    // Special Feature: Remove Product from Banner Live
    const removeProduct = async (prodId: string) => {
        if (!confirm('Remove this product from the banner immediately?')) return;
        try {
            await api.delete(`/banners/${bannerId}/products/${prodId}`);
            setLinkedProducts(prev => prev.filter(p => p._id !== prodId));
        } catch (error) {
            alert('Failed to remove product');
        }
    };

    const onSubmit = async (data: any) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description || '');

        // Styles
        formData.append('position', data.position);
        formData.append('textColor', data.textColor);
        formData.append('buttonColor', data.buttonColor);
        formData.append('buttonText', data.buttonText);
        formData.append('buttonLink', data.buttonLink);

        // Only append image if a new file was selected
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }

        if (linkType === 'offer') {
            // If switching to offer, we send offer_id
            formData.append('offer_id', data.offer_id);
        } else {
            // If Manual:
            // We need to send the FULL list of desired products?
            // Or does backend merge? 
            // My backend logic: "If manual_product_ids provided, use it".
            // So I should combine existing linked products (ids) + newProductIds
            const existingIds = linkedProducts.map(p => p._id);
            const combined = [...existingIds, ...newProductIds];
            const unique = Array.from(new Set(combined));

            formData.append('manual_product_ids', unique.join(','));
            // Also, empty offer_id to clear it
            formData.append('offer_id', '');
        }

        try {
            await api.put(`/banners/${bannerId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Banner updated!');
            router.push('/admin/banners');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to update banner');
        }
    };

    if (!bannerId) return <div className="p-10">Loading...</div>;

    return (
        <div className="container">
            <h1 className="page-title">Edit Banner</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="form-grid" style={{ alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Basic Info */}
                    <div className="card">
                        <div className="card-header">Basic Details</div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Banner Title</label>
                            <input {...register("title", { required: true })} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description (Optional)</label>
                            <textarea {...register("description")} className="form-input" rows={3}></textarea>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="card">
                        <div className="card-header">Appearance</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Text Position</label>
                                <select {...register("position")} className="form-select">
                                    <option value="top-left">Top Left</option>
                                    <option value="top-center">Top Center</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="center-left">Center Left</option>
                                    <option value="center">Center</option>
                                    <option value="center-right">Center Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-center">Bottom Center</option>
                                    <option value="bottom-right">Bottom Right</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Text Color</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="color" {...register("textColor")} style={{ height: '38px', width: '50px', padding: 0, border: 'none', background: 'none' }} />
                                    <input {...register("textColor")} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Button Color</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="color" {...register("buttonColor")} style={{ height: '38px', width: '50px', padding: 0, border: 'none', background: 'none' }} />
                                    <input {...register("buttonColor")} className="form-input" />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Button Text</label>
                                <input {...register("buttonText")} className="form-input" placeholder="Shop Now" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Button Link</label>
                                <input {...register("buttonLink")} className="form-input" placeholder="/products" />
                            </div>
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
                                Link to Offer
                            </button>
                            <button
                                type="button"
                                onClick={() => setLinkType('products')}
                                className={`btn ${linkType === 'products' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1 }}
                            >
                                Manual Products
                            </button>
                        </div>

                        {linkType === 'offer' && (
                            <div className="form-group">
                                <label className="form-label">Select Active Offer</label>
                                <select {...register("offer_id")} className="form-select">
                                    <option value="">-- Choose Offer --</option>
                                    {offers.map(o => <option key={o._id} value={o._id}>{o.title} ({o.percentage}%)</option>)}
                                </select>
                            </div>
                        )}

                        {linkType === 'products' && (
                            <div className="form-group">
                                <label className="form-label">Add More Products</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        placeholder="Search to add..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                    {filteredProducts.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: 'white', border: '1px solid var(--border)',
                                            zIndex: 50, maxHeight: '200px', overflowY: 'auto'
                                        }}>
                                            {filteredProducts.map(p => (
                                                <div
                                                    key={p._id}
                                                    onClick={() => toggleNewProduct(p._id)}
                                                    style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Pending Additions */}
                                {newProductIds.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginBottom: '0.25rem' }}>Added (Unsaved):</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {newProductIds.map(id => {
                                                const prod = allProducts.find(p => p._id === id);
                                                return (
                                                    <span key={id} className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        {prod?.title} <FiX style={{ cursor: 'pointer' }} onClick={() => toggleNewProduct(id)} />
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Linked Products Manager (The specific feature requested) */}
                    {linkType === 'products' && (
                        <div className="card">
                            <div className="card-header">
                                Currently Linked Products ({linkedProducts.length})
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {linkedProducts.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>No products linked yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {linkedProducts.map((p) => (
                                            <div key={p._id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)'
                                            }}>
                                                <span style={{ fontWeight: 500 }}>{p.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProduct(p._id)}
                                                    className="btn-icon"
                                                    style={{ color: 'var(--danger)', background: '#FEF2F2' }}
                                                    title="Remove from banner"
                                                >
                                                    <FiX />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Sidebar / Image */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card">
                        <div className="card-header">Banner Image</div>
                        <label className="upload-box">
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {imagePreview ? (
                                <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                                    <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} />
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)' }}>No Image</div>
                            )}
                        </label>
                    </div>

                    <div className="card">
                        <div className="card-header">Publish Changes</div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            <FiSave /> Update Banner
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/admin/banners')}
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: '1rem' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}
