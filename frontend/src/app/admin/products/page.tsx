"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Link from "next/link";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight, FiUpload, FiDownload } from "react-icons/fi";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";

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
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalProducts, setTotalProducts] = useState(0);

    // Filter State
    const [categories, setCategories] = useState<{ _id: string, name: string }[]>([]);
    const [subCategories, setSubCategories] = useState<{ _id: string, name: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Reset page when tab or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, selectedCategory, selectedSubCategory]);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/admin/categories');
                setCategories(res.data);
            } catch (error) { console.error("Failed to fetch categories", error); }
        };
        fetchCategories();
    }, []);

    // Fetch SubCategories when Category changes
    useEffect(() => {
        if (!selectedCategory) {
            setSubCategories([]);
            setSelectedSubCategory('');
            return;
        }
        const fetchSubCategories = async () => {
            try {
                const res = await api.get('/admin/sub-categories', {
                    params: { category_id: selectedCategory }
                });
                setSubCategories(res.data);
            } catch (error) { console.error("Failed to fetch sub-categories", error); }
        };
        fetchSubCategories();
    }, [selectedCategory]);

    useEffect(() => {
        fetchProducts();
    }, [currentPage, activeTab, debouncedSearch, limit, selectedCategory, selectedSubCategory]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/products', {
                params: {
                    page: currentPage,
                    limit: limit,
                    search: debouncedSearch,
                    status: activeTab,
                    category: selectedCategory || undefined,
                    sub_category: selectedSubCategory || undefined
                }
            });

            if (res.data.products) {
                setProducts(res.data.products);
                setTotalPages(res.data.totalPages);
                setTotalProducts(res.data.totalProducts);
                // Ensure current page is valid
                if (res.data.currentPage > res.data.totalPages && res.data.totalPages > 0) {
                    setCurrentPage(res.data.totalPages);
                }
            } else {
                setProducts(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        showModal(
            "Deactivate Product",
            "Are you sure you want to deactivate this product?",
            "warning",
            {
                showCancel: true,
                confirmText: "Yes, Deactivate",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.delete(`/admin/products/${id}`);
                        fetchProducts(); // Refetch to update list and counts
                        showSuccess("Product deactivated successfully");
                    } catch (error) {
                        console.error(error);
                        showError("Failed to deactivate product");
                    }
                }
            }
        );
    };

    const handleRestore = async (id: string) => {
        showModal(
            "Restore Product",
            "Are you sure you want to restore this product?",
            "warning",
            {
                showCancel: true,
                confirmText: "Yes, Restore",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.put(`/admin/products/${id}`, { isActive: true });
                        fetchProducts(); // Refetch
                        showSuccess("Product restored successfully");
                    } catch (error) {
                        console.error(error);
                        showError("Failed to restore product");
                    }
                }
            }
        );
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        showModal(
            "Importing Products",
            "Please wait while we process your file...",
            "info"
        );

        try {
            const res = await api.post('/admin/products/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                showSuccess(res.data.message);
                fetchProducts();
            } else {
                showError(res.data.message);
            }
        } catch (error: any) {
            console.error("Bulk import failed", error);
            showError(error.response?.data?.message || "Failed to import products");
        }
    };

    const downloadSample = () => {
        const csvContent = "title,mrp,selling_price_a,stock,part_number,category_name,brand_name,description\nSample Tool,1000,850,50,T001,Power Tools,Bosch,A high quality power tool";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_products.csv';
        a.click();
    };

    return (
        <div className="container" style={{ maxWidth: '100%' }}>
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Product Manager</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage inventory, pricing, and specifications.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={downloadSample}
                        className="btn btn-outline"
                        title="Download CSV Sample"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FiDownload /> Sample
                    </button>
                    <label className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <FiUpload /> Import CSV
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </label>
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

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setSelectedSubCategory('');
                        }}
                        style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.9rem',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                        disabled={!selectedCategory}
                        style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.9rem',
                            minWidth: '150px',
                            opacity: !selectedCategory ? 0.6 : 1,
                            cursor: !selectedCategory ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <option value="">All Sub-Categories</option>
                        {subCategories.map(sub => (
                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                        ))}
                    </select>

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
                        {products.map(product => {
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
                                    <td style={{ padding: '1rem' }} data-label="Product">
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
                                    <td data-label="Category & Brand">
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.category?.name || 'Uncategorized'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.brand?.name}</div>
                                    </td>
                                    <td style={{ textAlign: 'right' }} data-label="Pricing">
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
                                    <td style={{ textAlign: 'center' }} data-label="Stock">
                                        <span className={`badge ${product.opening_stock < 10 ? 'badge-warning' : 'badge-success'}`}
                                            style={product.opening_stock < 10 ? { background: '#FEF2F2', color: '#DC2626' } : {}}
                                        >
                                            {product.opening_stock}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }} data-label="Actions">
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
                {!loading && products.length === 0 && (
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


                {/* Pagination Controls */}
                {!loading && products.length > 0 && (
                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: '#fff',
                        borderRadius: '0 0 8px 8px',
                        borderTop: '1px solid #eee',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalProducts} items)
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                style={{
                                    padding: '0.3rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    marginRight: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value={10}>10 / page</option>
                                <option value={20}>20 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>

                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #ddd',
                                    background: currentPage === 1 ? '#f5f5f5' : 'white',
                                    color: currentPage === 1 ? '#ccc' : 'var(--text-main)',
                                    borderRadius: '6px',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <FiChevronLeft /> Previous
                            </button>

                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {/* Simple Page Numbers - can be enhanced for many pages */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Logic to show ranges around current page could go here
                                    // For now, let's just show dynamic range or simple previous/next if simple.
                                    // Let's implement a smart-ish range: current-2 to current+2
                                    let p = currentPage - 2 + i;
                                    if (currentPage < 3) p = 1 + i;
                                    if (p > totalPages) return null;
                                    if (p < 1) return null;

                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                border: p === currentPage ? 'none' : '1px solid #ddd',
                                                background: p === currentPage ? 'var(--primary)' : 'white',
                                                color: p === currentPage ? 'white' : 'var(--text-main)',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: p === currentPage ? 600 : 400
                                            }}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #ddd',
                                    background: currentPage === totalPages ? '#f5f5f5' : 'white',
                                    color: currentPage === totalPages ? '#ccc' : 'var(--text-main)',
                                    borderRadius: '6px',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                Next <FiChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
