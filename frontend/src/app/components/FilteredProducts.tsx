'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProductFilters from '@/app/components/ProductFilters';
import ProductCard from '@/app/components/ProductCard';
import ErrorState from './ErrorState';
import Loader from './Loader';
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

interface ProductGridContentProps {
    offerInfo?: any;
}

function ProductGridContent({ offerInfo }: ProductGridContentProps) {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const keyword = searchParams.get('keyword');
    const subcategory = searchParams.get('subcategory');
    const offerSlug = searchParams.get('offer');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
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
            if (offerSlug && offerSlug !== 'undefined' && offerSlug !== 'null') url += `offerSlug=${offerSlug}&`;

            const prodRes = await api.get(url);
            const data = prodRes.data.products || prodRes.data;

            setProducts(data.map((p: any) => {
                let finalPrice = p.selling_price_a || p.discountedPrice || p.mrp || 0;

                // Apply offer discount if available
                return {
                    ...p,
                    name: p.title || p.name,
                    basePrice: p.mrp || p.basePrice,
                    discountedPrice: finalPrice, // Just the base price, ProductCard handles discount
                    offerApplied: !!offerInfo
                };
            }));
        } catch (error: any) {
            console.error("Failed to fetch products", error);
            setError(error.message || "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [category, brand, keyword, subcategory, offerSlug, offerInfo]); // Re-run when offerInfo changes

    return (
        <div className="container products-content-container py-10">
            <div className="products-page-layout flex gap-8">
                {/* Sidebar Filters */}
                <ProductFilters initialCategories={categories} initialBrands={brands} />

                {/* Product Grid */}
                <section style={{ flex: 1 }}>
                    {loading ? (
                        <div className="py-20 flex justify-center"><Loader /></div>
                    ) : error ? (
                        <ErrorState message={error} onRetry={fetchData} />
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
    const [offerInfo, setOfferInfo] = useState<any>(null);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const keyword = searchParams.get('keyword');
    const offerSlug = searchParams.get('offer');

    useEffect(() => {
        const fetchOfferInfo = async () => {
            // Only fetch if offerSlug exists and is not 'undefined' or 'null' string
            if (offerSlug && offerSlug !== 'undefined' && offerSlug !== 'null') {
                try {
                    const res = await api.get(`/offers?slug=${offerSlug}`);
                    if (res.data && res.data.length > 0) {
                        setOfferInfo(res.data[0]);
                    }
                } catch (error) {
                    console.error('Failed to fetch offer info', error);
                }
            } else {
                setOfferInfo(null);
            }
        };
        fetchOfferInfo();
    }, [offerSlug]);

    return (
        <section className="filtered-products-section">
            {/* dynamic hero based on filter */}
            <div className="products-hero py-16 bg-slate-50 border-b border-gray-100">
                <div className="container">
                    <h3 className="text-4xl font-extrabold text-slate-900 mb-4">
                        {offerInfo ? (
                            <>
                                {offerInfo.title} <span className="text-orange-600">({offerInfo.percentage}% OFF)</span>
                            </>
                        ) : keyword ? `Search Results: "${keyword}"` : (brand ? `Brand: ${brand}` : (category ? `Category: ${category}` : (config?.title || 'Industrial Catalog')))}
                    </h3>
                    <p className="text-lg text-slate-500 max-w-2xl">
                        {offerInfo
                            ? `Discover all products eligible for our exclusive ${offerInfo.title} promotion. Save ${offerInfo.percentage}% on these premium items!`
                            : category
                                ? `Explore our premium selection of ${category} components designed for high-performance industrial applications.`
                                : (config?.subtitle || 'Browse our complete catalog of high-performance hardware, tools, and accessories.')}
                    </p>
                </div>
            </div>

            <Suspense fallback={<div className="p-20 text-center">Loading component...</div>}>
                <ProductGridContent offerInfo={offerInfo} />
            </Suspense>
        </section>
    );
}
