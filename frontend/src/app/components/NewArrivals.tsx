'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import NewArrivalsSlider from './NewArrivalsSlider';
import './NewArrivals.css';
import { useLanguage } from '../../context/LanguageContext';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string;
    imageUrl?: string;
    images: string[];
    isOnDemand: boolean;
}

export default function NewArrivals({ config }: { config?: any }) {
    const { t } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                const res = await fetch('/api/products/new-arrivals?limit=10');
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.map((p: any) => ({
                        ...p,
                        basePrice: p.mrp || p.basePrice,
                        discountedPrice: p.selling_price_a || p.discountedPrice,
                        title: p.title || p.name,
                        name: p.title || p.name
                    })));
                }
            } catch (error) {
                console.error('Error fetching new arrivals:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNewArrivals();
    }, []);

    if (loading) return null;
    if (products.length === 0) return null;

    return (
        <section className="container new-arrivals-section" style={{ overflow: 'visible' }}>
            <div className="new-arrivals-header">
                <div>
                    <h2 className="new-arrivals-title">{config?.title || t('new_arrivals')}</h2>
                    <p className="new-arrivals-subtitle">{config?.subtitle || t('check_out_latest')}</p>
                </div>
                <Link href="/new-arrivals" className="view-all-btn">
                    {t('view_all')} &rarr;
                </Link>
            </div>

            <NewArrivalsSlider products={products} />
        </section>
    );
}
