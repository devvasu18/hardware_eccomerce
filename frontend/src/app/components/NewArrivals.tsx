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
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const displayTitle = (language === 'hi' && config?.showHindi && config?.titleHindi)
        ? config.titleHindi
        : (config?.title || t('new_arrivals'));

    const displaySubtitle = (language === 'hi' && config?.showHindi && config?.subtitleHindi)
        ? config.subtitleHindi
        : (config?.subtitle || t('check_out_latest'));

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
        <section className="new-arrivals-section" style={{ overflow: 'visible' }}>
            <div className="container">
                <div className="new-arrivals-header">
                    <div>
                        <h2 className="new-arrivals-title">{displayTitle}</h2>
                        <p className="new-arrivals-subtitle">{displaySubtitle}</p>
                    </div>
                    <Link href="/new-arrivals" className="view-all-btn">
                        {t('view_all')} &rarr;
                    </Link>
                </div>

                <NewArrivalsSlider products={products} />
            </div>
        </section>
    );
}
