'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '../utils/api';
import ErrorState from './ErrorState';
import Loader from './Loader';
import './AllCategories.css';
import { useLanguage } from '../../context/LanguageContext';

interface Category {
    _id: string;
    name: string;
    slug: string;
    imageUrl: string;
    productCount: number;
    isActive: boolean;
}

import { CategorySkeleton } from './skeletons/HomeSkeleton';

export default function AllCategories({ config }: { config?: any }) {
    const { t, getLocalized } = useLanguage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchCategories = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('Fetching categories from /api/categories...');
                const res = await api.get('/categories');
                console.log('Categories response:', res.data);

                // Backend already filters for isActive: true, so we can use the data directly
                const activeCategories = res.data || [];
                console.log('Active categories count:', activeCategories.length);

                if (mounted) setCategories(activeCategories);
            } catch (error: any) {
                console.error('Error fetching categories:', error);
                if (mounted) setError(error.response?.data?.message || error.message || 'Failed to load categories');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchCategories();
        return () => { mounted = false; };
    }, []);

    if (loading) {
        return <CategorySkeleton />;
    }

    if (error) {
        return (
            <div className="container py-20">
                <ErrorState
                    message={error}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    return (
        <section className="all-categories-section">
            <div className="container">
                {config?.title && (
                    <div className="all-categories-header">
                        <h2 className="all-categories-title">{config.title}</h2>
                        {config.subtitle && <p className="all-categories-subtitle">{config.subtitle}</p>}
                    </div>
                )}

                <div className="all-categories-grid">
                    {categories.map((category) => {
                        // Construct proper image URL
                        let imageUrl = category.imageUrl;
                        if (imageUrl && !imageUrl.startsWith('http')) {
                            // Handle local uploads
                            const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
                            imageUrl = `/${cleanPath}`;
                        }

                        return (
                            <Link
                                key={category._id}
                                href={`/products?category=${category.slug}`}
                                className="category-item-card"
                            >
                                <div className="category-item-image-container">
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={getLocalized(category.name) || t('category_placeholder')}
                                            fill
                                            className="category-item-image"
                                            unoptimized
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            onError={(e) => {
                                                console.error(`Failed to load image for ${category.name}:`, imageUrl);
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="category-item-placeholder">
                                            📦
                                        </div>
                                    )}
                                </div>

                                <div className="category-item-content">
                                    <h3 className="category-item-name">
                                        {getLocalized(category.name)}
                                    </h3>
                                    <p className="category-item-count">
                                        {category.productCount || 0} {t(category.productCount !== 1 ? 'products_suffix' : 'product_suffix')}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {categories.length === 0 && (
                    <div className="all-categories-empty">
                        <p>{t('no_categories_available')}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
