'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '../utils/api';
import './AllCategories.css';

interface Category {
    _id: string;
    name: string;
    slug: string;
    imageUrl: string;
    productCount: number;
    isActive: boolean;
}

export default function AllCategories({ config }: { config?: any }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                console.log('Fetching categories from /api/categories...');
                const res = await api.get('/categories');
                console.log('Categories response:', res.data);

                // Backend already filters for isActive: true, so we can use the data directly
                const activeCategories = res.data || [];
                console.log('Active categories count:', activeCategories.length);

                setCategories(activeCategories);
                setError(null);
            } catch (error: any) {
                console.error('Error fetching categories:', error);
                console.error('Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                setError(error.response?.data?.message || error.message || 'Failed to load categories');
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="container py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                <p className="mt-4 text-gray-500">Loading categories...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-20 text-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                    <div className="text-red-600 text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Categories</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section className="all-categories-section py-12" style={{ width: '100%', maxWidth: '100vw' }}>
            <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
                {config?.title && (
                    <div className="mb-10">
                        <h2 className="text-3xl font-extrabold text-gray-900">{config.title}</h2>
                        {config.subtitle && <p className="mt-2 text-gray-600">{config.subtitle}</p>}
                    </div>
                )}

                <div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    style={{
                        display: 'grid',
                        width: '100%',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '1.5rem'
                    }}
                >
                    {categories.map((category) => {
                        // Construct proper image URL
                        let imageUrl = category.imageUrl;
                        if (imageUrl && !imageUrl.startsWith('http')) {
                            // Handle local uploads
                            const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
                            imageUrl = `http://localhost:5000/${cleanPath}`;
                        }

                        return (
                            <Link
                                key={category._id}
                                href={`/products?category=${category.slug}`}
                                className="group block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                                style={{
                                    maxWidth: '100%',
                                    width: '100%'
                                }}
                            >
                                <div
                                    className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 mb-4"
                                    style={{
                                        aspectRatio: '1 / 1',
                                        width: '100%',
                                        maxWidth: '100%',
                                        position: 'relative'
                                    }}
                                >
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={category.name || 'Category'}
                                            fill
                                            className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                            unoptimized
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            style={{
                                                objectFit: 'contain',
                                                padding: '1rem'
                                            }}
                                            onError={(e) => {
                                                console.error(`Failed to load image for ${category.name}:`, imageUrl);
                                                // Hide broken image
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-4xl opacity-20">
                                            📦
                                        </div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {category.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {category.productCount || 0} Product{category.productCount !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {categories.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl">
                        <p className="text-gray-500 text-lg">No categories available at the moment.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
