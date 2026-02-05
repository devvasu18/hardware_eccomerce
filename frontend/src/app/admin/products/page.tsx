"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Link from "next/link";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiSearch, FiRefreshCw } from "react-icons/fi";

interface Product {
    _id: string;
    title: string;
    slug: string;
    category: {
        _id: string;
        name: string;
    };
    brand: {
        _id: string;
        name: string;
    };
    mrp: number;
    selling_price_a: number;
    selling_price_b: number;
    selling_price_c: number;
    opening_stock: number;
    featured_image: string;
    gst_rate: number;
    hsn_code: string;
    isActive: boolean;
    variations?: {
        price: number;
        mrp?: number;
        isActive: boolean;
    }[];
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/admin/products');
            setProducts(res.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to deactivate this product?")) return;
        try {
            await api.delete(`/admin/products/${id}`);
            // Update local state to mark as inactive instead of removing
            setProducts(prev => prev.map(p =>
                p._id === id ? { ...p, isActive: false } : p
            ));
            alert("Product deactivated successfully");
        } catch (error) {
            // Check if error is due to product already being inactive (depends on backend logic)
            // But since we want to move it to inactive tab, we assume success if no error.
            console.error(error);
            alert("Failed to deactivate product");
        }
    };

    const handleRestore = async (id: string) => {
        if (!confirm("Are you sure you want to restore this product?")) return;
        try {
            // Reuse the update endpoint to set isActive: true
            await api.put(`/admin/products/${id}`, { isActive: true });

            setProducts(prev => prev.map(p =>
                p._id === id ? { ...p, isActive: true } : p
            ));
            alert("Product restored successfully");
        } catch (error) {
            console.error(error);
            alert("Failed to restore product");
        }
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        // Tab Filter
        // If activeTab is 'active', we show products where isActive is true (or undefined/default)
        // If activeTab is 'inactive', we show products where isActive is false
        const matchesTab = activeTab === 'active' ? product.isActive !== false : product.isActive === false;

        // Search Filter (Case insensitive)
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (product.title || '').toLowerCase().includes(searchLower) ||
            (product.slug || '').toLowerCase().includes(searchLower) ||
            (product.brand?.name || '').toLowerCase().includes(searchLower) ||
            (product.category?.name || '').toLowerCase().includes(searchLower);

        return matchesTab && matchesSearch;
    });

    return (
        <div className="container" style={{ maxWidth: '100%' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Product Manager</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage inventory, pricing, and specifications.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/admin/products/add" className="btn btn-primary">
                        <FiPlus /> Add New Product
                    </Link>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #eee' }}>
                    <button
                        onClick={() => setActiveTab('active')}
                        style={{
                            padding: '0.5rem 0',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'active' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'active' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'active' ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        Active Products
                    </button>
                    <button
                        onClick={() => setActiveTab('inactive')}
                        style={{
                            padding: '0.5rem 0',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'inactive' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'inactive' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'inactive' ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        Inactive Products
                    </button>
                </div>

                <div className="search-box" style={{ position: 'relative', width: '300px' }}>
                    <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input
                        type="text"
                        placeholder="Search by name, sku, brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 10px 8px 35px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '300px' }}>Product</th>
                            <th>Category & Brand</th>
                            <th style={{ textAlign: 'right' }}>Pricing (A/B/C)</th>
                            <th style={{ textAlign: 'center' }}>Stock</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => {
                            // Find lowest price from variations for display if main price is 0
                            const variationPrices = product.variations?.filter(v => v.isActive).map(v => v.price) || [];
                            const minVarPrice = variationPrices.length > 0 ? Math.min(...variationPrices) : null;
                            const variationMRPs = product.variations?.filter(v => v.isActive).map(v => v.mrp).filter(m => m && m > 0) || [];
                            const minVarMRP = variationMRPs.length > 0 ? Math.min(...variationMRPs as number[]) : null;

                            const displayPrice = product.selling_price_a || minVarPrice || 0;
                            const displayMRP = product.mrp || minVarMRP || 0;
                            const isStartingPrice = !product.selling_price_a && minVarPrice;

                            return (
                                <tr key={product._id} style={{ opacity: product.isActive === false ? 0.7 : 1 }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="img-preview">
                                                {product.featured_image ? (
                                                    <Image
                                                        src={product.featured_image.startsWith('http') ? product.featured_image : `http://localhost:5000/${product.featured_image}`}
                                                        alt={product.title}
                                                        fill
                                                        unoptimized
                                                        style={{ objectFit: 'contain' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#ccc' }}>N/A</div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={product.title}>{product.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SKU: {product.slug}</div>
                                                {!product.isActive && <span style={{ fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px', color: '#666' }}>Inactive</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.category?.name || 'Uncategorized'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.brand?.name}</div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                            {isStartingPrice && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '-4px' }}>Starting at</span>}
                                            ₹{displayPrice}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            B: {product.selling_price_b || '-'} / C: {product.selling_price_c || '-'}
                                        </div>
                                        {displayMRP > displayPrice && (
                                            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textDecoration: 'line-through' }}>MRP: ₹{displayMRP}</div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`badge ${product.opening_stock < 10 ? 'badge-warning' : 'badge-success'}`}
                                            style={product.opening_stock < 10 ? { background: '#FEF2F2', color: '#DC2626' } : {}}
                                        >
                                            {product.opening_stock}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <Link href={`/products/${product._id}`} target="_blank" className="btn-icon">
                                                <FiEye />
                                            </Link>
                                            <Link href={`/admin/products/${product._id}/edit`} className="btn-icon" style={{ color: 'var(--info)' }}>
                                                <FiEdit2 />
                                            </Link>
                                            {activeTab === 'active' ? (
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="btn-icon"
                                                    style={{ color: 'var(--danger)' }}
                                                    title="Deactivate Product"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRestore(product._id)}
                                                    className="btn-icon"
                                                    style={{ color: 'var(--success)' }}
                                                    title="Restore Product"
                                                >
                                                    <FiRefreshCw />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {loading && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory...</div>}
                {!loading && filteredProducts.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '2.5rem', opacity: 0.5 }}>{searchTerm ? '🔍' : '📦'}</div>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                            {searchTerm ? 'No Search Results' : (activeTab === 'active' ? 'No Active Products' : 'No Inactive Products')}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                            {searchTerm ? `No products found matching "${searchTerm}"` : 'Your inventory list fits your filtering criteria.'}
                        </p>
                        {activeTab === 'active' && !searchTerm && (
                            <Link href="/admin/products/add" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Add First Product</Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
