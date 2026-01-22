"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import api from "../../utils/api";
import { FiSave, FiUploadCloud, FiX, FiArrowLeft } from "react-icons/fi";
import Image from "next/image";
import { useRouter } from "next/navigation";

// --- Schema ---
const productSchema = z.object({
    title: z.string().min(3, "Title is required"),
    slug: z.string().min(3, "Slug is required"),
    subtitle: z.string().optional(),
    part_number: z.string().optional(),

    category: z.string().min(1, "Category is required"),
    sub_category: z.string().optional(),
    brand: z.string().optional(),
    offer: z.string().optional(),

    hsn_code: z.string().optional(),
    gst_rate: z.number().optional(),

    mrp: z.coerce.number().min(1, "MRP is required"),
    selling_price_a: z.coerce.number().min(1, "Selling Price A is required"),
    selling_price_b: z.coerce.number().optional(),
    selling_price_c: z.coerce.number().optional(),
    delivery_charge: z.coerce.number().default(0),

    opening_stock: z.coerce.number().default(0),
    low_stock_threshold: z.coerce.number().default(5),
    max_unit_buy: z.coerce.number().optional(),

    description: z.string().optional(),

    color_name: z.string().optional(),
    color_hex: z.string().optional(),
    size: z.string().optional(),

    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
    productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [hsns, setHsns] = useState<any[]>([]);

    const [featuredImage, setFeaturedImage] = useState<File | null>(null);
    const [featuredImage2, setFeaturedImage2] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);

    // Preview states for edit mode
    const [previewFeatured, setPreviewFeatured] = useState<string | null>(null);
    const [previewFeatured2, setPreviewFeatured2] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            gst_rate: 18,
            delivery_charge: 0,
            opening_stock: 0,
            low_stock_threshold: 5
        }
    });

    // Watchers for Calculations
    const mrp = useWatch({ control, name: "mrp" });
    const sellingPrice = useWatch({ control, name: "selling_price_a" });
    const selectedCategory = useWatch({ control, name: "category" });
    const productTitle = useWatch({ control, name: "title" });

    // Auto Generate Slug (Only in Create Mode)
    useEffect(() => {
        if (!productId && productTitle) {
            const slug = productTitle.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
            setValue("slug", slug);
        }
    }, [productTitle, setValue, productId]);

    // Fetch Masters & Product Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, brandRes, offerRes, hsnRes] = await Promise.all([
                    api.get('/admin/categories'),
                    api.get('/admin/brands'),
                    api.get('/admin/offers'),
                    api.get('/admin/hsn')
                ]);
                setCategories(catRes.data);
                setBrands(brandRes.data);
                setOffers(offerRes.data);
                setHsns(hsnRes.data);

                // If Editing, Fetch Product
                if (productId) {
                    const prodRes = await api.get(`/admin/products/${productId}`);
                    const product = prodRes.data;

                    // Populate Form
                    reset({
                        title: product.title,
                        slug: product.slug,
                        subtitle: product.subtitle,
                        part_number: product.part_number,
                        category: product.category?._id || product.category,
                        sub_category: product.sub_category?.[0],
                        brand: product.brand?._id || product.brand,
                        offer: product.offer?._id || product.offer,
                        hsn_code: product.hsn_code?._id || product.hsn_code,
                        gst_rate: product.gst_rate,
                        mrp: product.mrp,
                        selling_price_a: product.selling_price_a,
                        selling_price_b: product.selling_price_b,
                        selling_price_c: product.selling_price_c,
                        delivery_charge: product.delivery_charge,
                        opening_stock: product.opening_stock,
                        low_stock_threshold: product.low_stock_threshold,
                        max_unit_buy: product.max_unit_buy,
                        description: product.description,
                        color_name: product.color_name,
                        color_hex: product.color_hex,
                        size: product.size,
                        meta_title: product.meta_title,
                        meta_description: product.meta_description
                    });

                    // Set Previews
                    if (product.featured_image) setPreviewFeatured(`/api/${product.featured_image}`);
                    if (product.featured_image_2) setPreviewFeatured2(`/api/${product.featured_image_2}`);
                }

            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, [productId, reset]);

    // Filter SubCategories
    useEffect(() => {
        if (selectedCategory) {
            api.get(`/admin/sub-categories?category_id=${selectedCategory}`)
                .then(res => setSubCategories(res.data))
                .catch(console.error);
        } else {
            setSubCategories([]);
        }
    }, [selectedCategory]);

    const onSubmit = async (data: ProductFormData) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) formData.append(key, value.toString());
            });

            if (featuredImage) formData.append('featured_image', featuredImage);
            if (featuredImage2) formData.append('featured_image_2', featuredImage2);
            galleryImages.forEach(file => formData.append('gallery_images', file));

            if (productId) {
                await api.put(`/admin/products/${productId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Product Updated Successfully!');
            } else {
                await api.post('/admin/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Product Created Successfully!');
            }
            router.push('/admin/products');
        } catch (err: any) {
            console.error(err);
            alert('Error saving product: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const youSave = (mrp || 0) - (sellingPrice || 0);
    const youSavePercent = mrp ? Math.round((youSave / mrp) * 100) : 0;

    return (
        <div className="container" style={{ maxWidth: '1400px' }}>
            {/* Actions Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => router.back()} className="btn btn-secondary">
                    <FiArrowLeft /> Back to List
                </button>
                <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    <FiSave /> {loading ? 'Saving...' : 'Save Product'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                {/* Left Column (Main Info) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Basic Info Card */}
                    <div className="card">
                        <div className="card-header">Basic Details</div>
                        <div className="form-grid">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Product Title *</label>
                                <input {...register("title")} className="form-input" placeholder="e.g. Heavy Duty Drill" />
                                {errors.title && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.title.message}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Slug</label>
                                <input {...register("slug")} className="form-input" readOnly />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Part Number</label>
                                <input {...register("part_number")} className="form-input" placeholder="MFG-001" />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Subtitle</label>
                                <input {...register("subtitle")} className="form-input" placeholder="Short description" />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Description</label>
                                <textarea {...register("description")} className="form-textarea" style={{ minHeight: '150px' }} placeholder="Detailed product description..."></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="card">
                        <div className="card-header">Pricing & Tax</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">HSN Code</label>
                                <select {...register("hsn_code")} className="form-select"
                                    onChange={(e) => {
                                        const hsn = hsns.find(h => h._id === e.target.value);
                                        if (hsn) setValue("gst_rate", hsn.gst_rate);
                                    }}
                                >
                                    <option value="">-- Select HSN --</option>
                                    {hsns.map(h => <option key={h._id} value={h._id}>{h.hsn_code} ({h.gst_rate}%)</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">GST Rate (%)</label>
                                <input type="number" {...register("gst_rate")} className="form-input" readOnly />
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: 'var(--radius)', marginTop: '1.5rem', border: '1px solid var(--border)' }}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">MRP (₹)</label>
                                    <input type="number" {...register("mrp")} className="form-input" placeholder="0.00" style={{ fontWeight: 'bold' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Selling Price A (₹)</label>
                                    <input type="number" {...register("selling_price_a")} className="form-input" placeholder="0.00" style={{ color: 'var(--success)', fontWeight: 'bold' }} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>You Save:</span>
                                <span style={{ color: 'var(--success)', fontWeight: '600' }}>₹{youSave} ({youSavePercent}%)</span>
                            </div>
                        </div>

                        <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Wholesale Price B (₹)</label>
                                <input type="number" {...register("selling_price_b")} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Special Price C (₹)</label>
                                <input type="number" {...register("selling_price_c")} className="form-input" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column (Sidebar Info) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Classification */}
                    <div className="card">
                        <div className="card-header">Classification</div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Category *</label>
                            <select {...register("category")} className="form-select">
                                <option value="">-- Select Category --</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                            {errors.category && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.category.message}</span>}
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Sub-Category</label>
                            <select {...register("sub_category")} className="form-select">
                                <option value="">-- Select Sub-Category --</option>
                                {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Brand</label>
                            <select {...register("brand")} className="form-select">
                                <option value="">-- Select Brand --</option>
                                {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Applied Offer</label>
                            <select {...register("offer")} className="form-select">
                                <option value="">-- No Offer --</option>
                                {offers.map(o => <option key={o._id} value={o._id}>{o.title} ({o.percentage}%)</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="card">
                        <div className="card-header">Product Images</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Featured 1 */}
                            <div className="upload-box" style={{ height: '150px' }}>
                                {featuredImage ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <Image src={URL.createObjectURL(featuredImage)} alt="Preview" fill style={{ objectFit: 'contain' }} />
                                        <button onClick={(e) => { e.preventDefault(); setFeaturedImage(null) }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px', border: 'none' }}><FiX /></button>
                                    </div>
                                ) : previewFeatured ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <Image src={previewFeatured} alt="Existing" fill style={{ objectFit: 'contain' }} />
                                        <button onClick={(e) => { e.preventDefault(); setPreviewFeatured(null) }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px', border: 'none' }}><FiX /></button>
                                    </div>
                                ) : (
                                    <>
                                        <FiUploadCloud size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Main Image</span>
                                        <input type="file" onChange={(e) => e.target.files && setFeaturedImage(e.target.files[0])} />
                                    </>
                                )}
                            </div>

                            {/* Featured 2 */}
                            <div className="upload-box" style={{ height: '120px' }}>
                                {featuredImage2 ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <Image src={URL.createObjectURL(featuredImage2)} alt="Preview" fill style={{ objectFit: 'contain' }} />
                                        <button onClick={(e) => { e.preventDefault(); setFeaturedImage2(null) }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px', border: 'none' }}><FiX /></button>
                                    </div>
                                ) : previewFeatured2 ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <Image src={previewFeatured2} alt="Existing" fill style={{ objectFit: 'contain' }} />
                                        <button onClick={(e) => { e.preventDefault(); setPreviewFeatured2(null) }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px', border: 'none' }}><FiX /></button>
                                    </div>
                                ) : (
                                    <>
                                        <FiUploadCloud size={20} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hover Image</span>
                                        <input type="file" onChange={(e) => e.target.files && setFeaturedImage2(e.target.files[0])} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className="card">
                        <div className="card-header">Inventory</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Opening Stock</label>
                                <input type="number" {...register("opening_stock")} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Low Stock Alert</label>
                                <input type="number" {...register("low_stock_threshold")} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Max Buy/User</label>
                                <input type="number" {...register("max_unit_buy")} className="form-input" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
