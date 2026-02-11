'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProductFilters from '@/app/components/ProductFilters';
import ProductCard from '@/app/components/ProductCard';
import api from '../utils/api';
import './FilteredProducts.css';

interface Product {
    _id: string;
    name: string;
    title: string;
    basePrice: number;
    discountedPrice: number;
    selling_price_a: number;
    mrp: number;
    stock: number;
    category: any;
    featured_image?: string;
    gallery_images?: string[];
    isOnDemand: boolean;
}

function ProductGridContent() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const keyword = searchParams.get('keyword');
    const subcategory = searchParams.get('subcategory');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch filters
                const [catRes, brandRes] = await Promise.all([
                    api.get('/categories'),
                    api.get('/brands/featured')
                ]);
                setCategories(catRes.data);
                setBrands(brandRes.data);

                // Fetch products
                let url = '/products?';
                if (category) url += `category=${category}&`;
                if (brand) url += `brand=${brand}&`;
                if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
                if (subcategory) url += `subcategory=${subcategory}&`;

                const prodRes = await api.get(url);
                const data = prodRes.data.products || prodRes.data;

                setProducts(data.map((p: any) => ({
                    ...p,
                    name: p.title || p.name,
                    basePrice: p.mrp || p.basePrice,
                    discountedPrice: p.selling_price_a || p.discountedPrice
                })));
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [category, brand, keyword, subcategory]);

    return (
        <div className="container products-content-container py-10">
            <div className="products-page-layout flex gap-8">
                {/* Sidebar Filters */}
                <ProductFilters initialCategories={categories} initialBrands={brands} />

                {/* Product Grid */}
                <section style={{ flex: 1 }}>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-gray-100 h-80 rounded-2xl"></div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="products-empty-state text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-500 mb-6">We couldn't find any products matching your filters.</p>
                            <Link href="/products" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                Clear All Filters
                            </Link>
                        </div>
                    ) : (
                        <div className="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((item) => (
                                <ProductCard key={item._id} product={{
                                    ...item,
                                    category: item.category
                                        ? (typeof item.category === 'object' && item.category !== null ? item.category.name : (String(item.category).length > 10 ? 'Auto Part' : item.category))
                                        : 'Uncategorized'
                                }} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default function FilteredProducts({ config }: { config?: any }) {
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const keyword = searchParams.get('keyword');

    return (
        <section className="filtered-products-section">
            {/* dynamic hero based on filter */}
            <div className="products-hero py-16 bg-slate-50 border-b border-gray-100">
                <div className="container">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
                        {keyword ? `Search Results: "${keyword}"` : (brand ? `Brand: ${brand}` : (category ? `Category: ${category}` : (config?.title || 'Industrial Catalog')))}
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl">
                        {category
                            ? `Explore our premium selection of ${category} components designed for high-performance industrial applications.`
                            : (config?.subtitle || 'Browse our complete catalog of high-performance hardware, tools, and accessories.')}
                    </p>
                </div>
            </div>

            <Suspense fallback={<div className="p-20 text-center">Loading component...</div>}>
                <ProductGridContent />
            </Suspense>
        </section>
    );
}
