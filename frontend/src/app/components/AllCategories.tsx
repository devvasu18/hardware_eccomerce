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

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data.filter((c: Category) => c.isActive !== false));
            } catch (error) {
                console.error('Error fetching categories:', error);
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

    return (
        <section className="all-categories-section py-12">
            <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
                {config?.title && (
                    <div className="mb-10">
                        <h2 className="text-3xl font-extrabold text-gray-900">{config.title}</h2>
                        {config.subtitle && <p className="mt-2 text-gray-600">{config.subtitle}</p>}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {categories.map((category) => (
                        <Link
                            key={category._id}
                            href={`/products?category=${category.slug}`}
                            className="group block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                        >
                            <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 mb-4">
                                {category.imageUrl ? (
                                    <Image
                                        src={category.imageUrl.startsWith('http')
                                            ? category.imageUrl
                                            : `http://localhost:5000/${category.imageUrl.startsWith('/') ? category.imageUrl.slice(1) : category.imageUrl}`}
                                        alt={category.name}
                                        fill
                                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                        unoptimized
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
                                    {category.productCount || 0} Products
                                </p>
                            </div>
                        </Link>
                    ))}
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
