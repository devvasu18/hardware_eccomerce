"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Link from "next/link";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiPlus, FiEye } from "react-icons/fi";

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
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.delete(`/admin/products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
            alert("Product deleted successfully");
        } catch (error) {
            console.error(error);
            alert("Failed to delete product");
        }
    };

    return (
        <div className="container" style={{ maxWidth: '100%' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Product Manager</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage inventory, pricing and specifications from here.</p>
                </div>
                <Link href="/admin/products/add" className="btn btn-primary">
                    <FiPlus /> Add New Product
                </Link>
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
                        {products.map(product => (
                            <tr key={product._id}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="img-preview">
                                            {product.featured_image ? (
                                                <Image
                                                    src={product.featured_image.startsWith('http') ? product.featured_image : `/${product.featured_image}`}
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
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.category?.name || 'Uncategorized'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.brand?.name}</div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{product.selling_price_a}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        B: {product.selling_price_b || '-'} / C: {product.selling_price_c || '-'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textDecoration: 'line-through' }}>MRP: ₹{product.mrp}</div>
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
                                        <button onClick={() => handleDelete(product._id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory...</div>}
                {!loading && products.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '2.5rem' }}>📦</div>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>No Products Found</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Start by adding your first product to the inventory.</p>
                        <Link href="/admin/products/add" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Add First Product</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
