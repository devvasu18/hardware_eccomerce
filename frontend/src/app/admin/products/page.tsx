'use client';

import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

interface Product {
    _id: string;
    name: string;
    basePrice: number; // Original Price
    discountedPrice: number; // Selling Price
    stock: number;
    gstRate: number;
    hsnCode: string;
    category: string;
    isOnDemand: boolean;
    isFeatured: boolean;
    isTopSale: boolean;
    isDailyOffer: boolean;
    isNewArrival: boolean;
    images?: string[];
    description?: string;
    brand?: string;
    warranty?: string;
    material?: string;
    countryOfOrigin?: string;
}

interface Category {
    _id: string;
    name: string;
    slug: string;
}

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [imageInputType, setImageInputType] = useState<'upload' | 'url'>('upload');
    const [imageUrlInput, setImageUrlInput] = useState('');
    const { modalState, hideModal, showSuccess, showError } = useModal();

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        const res = await fetch('http://localhost:5000/api/products');
        if (res.ok) setProducts(await res.json());
    };

    const fetchCategories = async () => {
        const res = await fetch('http://localhost:5000/api/categories');
        if (res.ok) setCategories(await res.json());
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        // Validation: Discount Price <= Original Price
        if (editingProduct.discountedPrice > editingProduct.basePrice) {
            showError('Discounted Price cannot be greater than Original Price.');
            return;
        }

        try {
            const url = editingProduct._id
                ? `http://localhost:5000/api/products/${editingProduct._id}`
                : `http://localhost:5000/api/products`;

            const method = editingProduct._id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingProduct)
            });

            if (res.ok) {
                showSuccess('Product has been saved successfully!');
                setShowForm(false);
                setEditingProduct(null);
                fetchProducts();
            } else {
                const errorData = await res.json();
                console.error('Save failed:', errorData);
                showError('Failed to save product. Please try again.');
            }
        } catch (err) {
            showError('Network error. Please check your connection and try again.');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('Image size should be less than 5MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                showError('Please upload an image file');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                if (editingProduct) {
                    setEditingProduct({ ...editingProduct, images: [base64String] });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const startEdit = (p: Product) => {
        setEditingProduct(p);
        const currentImage = p.images?.[0] || '';
        setImagePreview(currentImage);

        if (currentImage.startsWith('http') || currentImage.startsWith('https')) {
            setImageInputType('url');
            setImageUrlInput(currentImage);
        } else {
            setImageInputType('upload');
            setImageUrlInput('');
        }
        setShowForm(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Product Manager</h1>
                <button
                    onClick={() => {
                        setEditingProduct({
                            name: '',
                            basePrice: 0,
                            discountedPrice: 0,
                            stock: 0,
                            gstRate: 18,
                            hsnCode: '',
                            category: '',
                            isOnDemand: false,
                            isFeatured: false,
                            isTopSale: false,
                            isDailyOffer: false,
                            isNewArrival: false,
                            images: [],
                            description: '',
                            brand: '',
                            warranty: '',
                            material: '',
                            countryOfOrigin: 'India'
                        } as any);
                        setImagePreview('');
                        setImageInputType('upload');
                        setImageUrlInput('');
                        setShowForm(true);
                    }}
                    className="btn btn-primary"
                >
                    + Add New Product
                </button>
            </div>

            {showForm && editingProduct && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>{editingProduct._id ? 'Edit Product' : 'New Product'}</h3>
                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Product Name</label>
                            <input type="text" value={editingProduct.name ?? ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
                            <select
                                value={editingProduct.category ?? ''}
                                onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                required
                            >
                                <option value="">-- Select Category --</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Original Price (MRP) (₹)</label>
                            <input
                                type="number"
                                value={editingProduct.basePrice ?? ''}
                                onChange={e => setEditingProduct({ ...editingProduct, basePrice: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Discounted Price (Selling) (₹)</label>
                            <input
                                type="number"
                                value={editingProduct.discountedPrice ?? ''}
                                onChange={e => setEditingProduct({ ...editingProduct, discountedPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>HSN Code (Tax)</label>
                            <input type="text" value={editingProduct.hsnCode ?? ''} onChange={e => setEditingProduct({ ...editingProduct, hsnCode: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>GST Rate (%)</label>
                            <select value={editingProduct.gstRate} onChange={e => setEditingProduct({ ...editingProduct, gstRate: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Stock Quantity</label>
                            <input type="number" value={editingProduct.stock ?? ''} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                            <textarea
                                value={editingProduct.description ?? ''}
                                onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                rows={4}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }}
                                placeholder="Detailed product description..."
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Brand</label>
                            <input type="text" value={editingProduct.brand ?? ''} onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. Bosch, Stanley" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Material</label>
                            <input type="text" value={editingProduct.material ?? ''} onChange={e => setEditingProduct({ ...editingProduct, material: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. Stainless Steel" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Warranty</label>
                            <input type="text" value={editingProduct.warranty ?? ''} onChange={e => setEditingProduct({ ...editingProduct, warranty: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. 1 Year Manufacturer" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Country of Origin</label>
                            <input type="text" value={editingProduct.countryOfOrigin ?? ''} onChange={e => setEditingProduct({ ...editingProduct, countryOfOrigin: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. India" />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="isFeatured"
                                checked={editingProduct.isFeatured || false}
                                onChange={e => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <label htmlFor="isFeatured" style={{ fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                                ⭐ Mark as Featured Product
                            </label>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Product Image</label>

                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="imageInputType"
                                        value="upload"
                                        checked={imageInputType === 'upload'}
                                        onChange={() => {
                                            setImageInputType('upload');
                                            // Optional: Clear preview if switching types? 
                                            // Let's keep the preview until they actually upload/change something to avoid accidental loss.
                                        }}
                                        style={{ accentColor: '#3b82f6' }}
                                    />
                                    <span>Upload Image</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="imageInputType"
                                        value="url"
                                        checked={imageInputType === 'url'}
                                        onChange={() => {
                                            setImageInputType('url');
                                        }}
                                        style={{ accentColor: '#3b82f6' }}
                                    />
                                    <span>Image URL</span>
                                </label>
                            </div>

                            {imageInputType === 'upload' ? (
                                <>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        Recommended: Square image (500x500px or larger). Max size: 5MB
                                    </p>
                                </>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrlInput}
                                    onChange={(e) => {
                                        const url = e.target.value;
                                        setImageUrlInput(url);
                                        // Update preview immediately for URL
                                        setImagePreview(url);
                                        if (editingProduct) {
                                            setEditingProduct({ ...editingProduct, images: [url] });
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px'
                                    }}
                                />
                            )}
                        </div>

                        {imagePreview && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Image Preview</label>
                                <div style={{
                                    position: 'relative',
                                    width: '200px',
                                    height: '200px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <img
                                        src={imagePreview}
                                        alt="Product preview"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview('');
                                            setImageUrlInput('');
                                            if (editingProduct) {
                                                setEditingProduct({ ...editingProduct, images: [] });
                                            }
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'rgba(239, 68, 68, 0.9)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Product</button>
                        </div>
                    </form>
                </div>
            )
            }

            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Image</th>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Category</th>
                            <th style={{ padding: '1rem' }}>Pricing (MRP / Selling)</th>
                            <th style={{ padding: '1rem' }}>Stock</th>
                            <th style={{ padding: '1rem' }}>Featured</th>
                            <th style={{ padding: '1rem' }}>Tax Info</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem' }}>
                                    {p.images && p.images.length > 0 ? (
                                        <img
                                            src={p.images[0]}
                                            alt={p.name}
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '1px solid #e2e8f0'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            background: '#f1f5f9',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            color: '#94a3b8'
                                        }}>
                                            No Image
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.name}</td>
                                <td style={{ padding: '1rem' }}>{p.category}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {(p.discountedPrice > 0 && p.discountedPrice < p.basePrice) && (
                                            <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.875rem' }}>₹{p.basePrice}</span>
                                        )}
                                        <span style={{ fontWeight: 600, color: '#16a34a' }}>₹{p.discountedPrice || p.basePrice}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span className={p.stock < 10 ? 'badge badge-sale' : 'badge badge-new'}>{p.stock}</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {p.isFeatured ? (
                                        <span style={{ fontSize: '1.5rem', color: '#f59e0b' }} title="Featured Product">⭐</span>
                                    ) : (
                                        <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>—</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ display: 'block', fontSize: '0.9rem' }}>GST: {p.gstRate || 18}%</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>HSN: {p.hsnCode}</span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => startEdit(p)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={modalState.isOpen}
                onClose={hideModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
                showCancel={modalState.showCancel}
            />
        </div >
    );
}
