'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import api from '../utils/api';
import './CategoryProductListing.css';
import { useLanguage } from '../../context/LanguageContext';

interface CategoryProductListingProps {
    config?: {
        categoryId?: string;
        categoryName?: string;
        categorySlug?: string;
        title?: string;
        subtitle?: string;
        sortBy?: 'most_viewed' | 'most_purchased' | 'newest';
        limit?: number;
        showViewAll?: boolean;
    };
}

const CategoryProductListing: React.FC<CategoryProductListingProps> = ({ config }) => {
    const { t } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categoryId = config?.categoryId;
    const categorySlug = config?.categorySlug;
    const sortBy = config?.sortBy || 'newest';
    const limit = config?.limit || 4;
    const showViewAll = config?.showViewAll !== false;
    const displayTitle = config?.title || config?.categoryName || t('featured_category');
    const displaySubtitle = config?.subtitle || '';

    useEffect(() => {
        const fetchProducts = async () => {
            if (!categoryId && !categorySlug) {
                setLoading(false);
                return;
            }

            try {
                // Determine filter - prefer categoryId but work with slug
                const filter = categoryId ? `category=${categoryId}` : `categorySlug=${categorySlug}`;
                const response = await api.get(`/products?${filter}&sort=${sortBy}&limit=${limit}`);

                const data = response.data.products || response.data;

                if (Array.isArray(data)) {
                    setProducts(data.map((p: any) => ({
                        ...p,
                        basePrice: p.mrp || p.basePrice,
                        discountedPrice: p.selling_price_a || p.discountedPrice,
                        title: p.title || p.name,
                        name: p.title || p.name
                    })));
                }
            } catch (error) {
                console.error('Error fetching category products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categoryId, categorySlug, sortBy, limit]);

    if (!categoryId && !categorySlug && !loading) return null;

    return (
        <section className="category-products-section">
            <div className="category-products-container">
                <div className="section-header-premium">
                    <div className="header-text-group">
                        <h2 className="premium-title">{displayTitle}</h2>
                        {displaySubtitle && <p className="premium-subtitle">{displaySubtitle}</p>}
                    </div>
                    {showViewAll && (
                        <Link
                            href={`/products?category=${categorySlug || categoryId}`}
                            className="premium-view-all-btn"
                        >
                            <span>{t('explore_all')}</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="products-grid loading-state">
                        {[...Array(limit)].map((_, i) => (
                            <div key={i} className="skeleton-card-premium"></div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="empty-category-message">
                        <p>{t('no_products_found')}</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default CategoryProductListing;
