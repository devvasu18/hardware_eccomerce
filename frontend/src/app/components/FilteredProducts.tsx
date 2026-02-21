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
import { useLanguage } from '../../context/LanguageContext';

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

import { cache } from '@/utils/cache';
import ProductListSkeleton from './skeletons/ProductListSkeleton';

function ProductGridContent({ offerInfo }: ProductGridContentProps) {
    const { t, getLocalized } = useLanguage();
    const searchParams = useSearchParams();

    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const keyword = searchParams.get('keyword');
    const subcategory = searchParams.get('subcategory');
    const offerSlug = searchParams.get('offer');

    const cacheKey = `products_grid_${category || 'all'}_${brand || 'all'}_${keyword || 'none'}_${subcategory || 'all'}_${offerSlug || 'none'}`;
    const filtersCacheKey = 'global_filters';

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setError(null);
        try {
            // Fetch filters (Long TTL 60 mins for masters)
            const [catRes, brandRes] = await Promise.all([
                api.get('/categories'),
                api.get('/brands/featured')
            ]);
            setCategories(catRes.data);
            setBrands(brandRes.data);
            cache.set(`${filtersCacheKey}_categories`, catRes.data, 60);
            cache.set(`${filtersCacheKey}_brands`, brandRes.data, 60);

            // Fetch products
            let url = '/products?';
            if (category) url += `category=${category}&`;
            if (brand) url += `brand=${brand}&`;
            if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
            if (subcategory) url += `subcategory=${subcategory}&`;
            if (offerSlug && offerSlug !== 'undefined' && offerSlug !== 'null') url += `offerSlug=${offerSlug}&`;

            const prodRes = await api.get(url);
            const data = prodRes.data.products || prodRes.data;

            const processed = data.map((p: any) => {
                let finalPrice = p.selling_price_a || p.discountedPrice || p.mrp || 0;

                return {
                    ...p,
                    name: p.title || p.name,
                    basePrice: p.mrp || p.basePrice,
                    discountedPrice: finalPrice,
                    offerApplied: !!offerInfo
                };
            });

            setProducts(processed);
            // Save to cache (TTL 10 mins for product listing)
            cache.set(cacheKey, processed, 10);
        } catch (error: any) {
            console.error("Failed to fetch products", error);
            // Only set error if we don't have any products currently
            setProducts(prev => {
                if (!isBackground || prev.length === 0) {
                    setError(error.message || "Failed to load products");
                }
                return prev;
            });
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        // Hydrate from cache
        const cachedCats = cache.get<any[]>(`${filtersCacheKey}_categories`);
        const cachedBrands = cache.get<any[]>(`${filtersCacheKey}_brands`);
        if (cachedCats) setCategories(cachedCats);
        if (cachedBrands) setBrands(cachedBrands);

        // When filters change, try to get from cache first
        const cachedProducts = cache.get<Product[]>(cacheKey) || [];

        if (cachedProducts.length > 0) {
            setProducts(cachedProducts);
            setLoading(false);
        } else {
            // Unrelated category change means we shouldn't show old products
            setProducts([]);
            setLoading(true);
        }

        const isExpired = cache.isExpired(cacheKey);

        if (isExpired || cachedProducts.length === 0) {
            fetchData(cachedProducts.length > 0);
        }
    }, [cacheKey, category, brand, keyword, subcategory, offerSlug, offerInfo]);

    if (loading) return <ProductListSkeleton />;

    return (
        <div className="container products-content-container py-10">
            <div className="products-page-layout flex gap-8">
                {/* Sidebar Filters */}
                <ProductFilters initialCategories={categories} initialBrands={brands} />

                {/* Product Grid */}
                <section style={{ flex: 1 }}>
                    {error ? (
                        <ErrorState message={error} onRetry={fetchData} />
                    ) : products.length === 0 ? (
                        <div className="products-empty-state text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('no_products_found')}</h3>
                            <p className="text-gray-500 mb-6">{t('no_products_desc')}</p>
                            <Link href="/products" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                {t('clear_filters')}
                            </Link>
                        </div>
                    ) : (
                        <div className="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((item) => (
                                <ProductCard key={item._id} product={{
                                    ...item,
                                    category: item.category
                                        ? (typeof item.category === 'object' && item.category !== null ? getLocalized(item.category.name) : (String(item.category).length > 10 ? t('auto_part') : getLocalized(item.category)))
                                        : t('uncategorized')
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
    const { t, getLocalized } = useLanguage();
    const searchParams = useSearchParams();
    const [offerInfo, setOfferInfo] = useState<any>(null);
    const offerSlug = searchParams.get('offer');

    useEffect(() => {
        const fetchOfferInfo = async () => {
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
            <div className="products-hero">
                <div className="container">
                    {/* ... header content ... */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        {offerInfo ? (
                            <>
                                {getLocalized(offerInfo.title)} <span className="text-orange-600">({offerInfo.percentage}% {t('off')})</span>
                            </>
                        ) : searchParams.get('keyword') ? `${t('search_results')}: "${searchParams.get('keyword')}"` : (searchParams.get('brand') ? `${t('brand_label')}: ${searchParams.get('brand')}` : (searchParams.get('category') ? `${t('category_label')}: ${searchParams.get('category')}` : (getLocalized(config?.title) || t('industrial_catalog'))))}
                    </h3>
                    <p className="text-lg text-slate-500 max-w-2xl">
                        {offerInfo
                            ? t('discover_promotion', { title: getLocalized(offerInfo.title), percentage: offerInfo.percentage })
                            : searchParams.get('category')
                                ? t('explore_category', { category: searchParams.get('category') })
                                : (getLocalized(config?.subtitle) || t('browse_catalog'))}
                    </p>
                </div>
            </div>

            <Suspense fallback={<ProductListSkeleton />}>
                <ProductGridContent offerInfo={offerInfo} />
            </Suspense>
        </section>
    );
}
