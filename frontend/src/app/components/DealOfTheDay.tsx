'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './FeaturedProducts.css'; // Reuse CSS
import api from '@/app/utils/api';
import { useLanguage } from '../../context/LanguageContext';

import { ProductGridSkeleton } from './skeletons/HomeSkeleton';

export default function DealOfTheDay({ config }: { config?: any }) {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const displayTitle = (language === 'hi' && config?.showHindi && config?.titleHindi)
        ? config.titleHindi
        : (config?.title || t('deal_of_the_day'));

    const displaySubtitle = (language === 'hi' && config?.showHindi && config?.subtitleHindi)
        ? config.subtitleHindi
        : (config?.subtitle || t('limited_time_offers'));

    useEffect(() => {
        let mounted = true;
        const fetchDeals = async () => {
            try {
                const res = await api.get('/products/daily-offers');
                let data = res.data;
                if (!Array.isArray(data) && data.products) {
                    data = data.products;
                }
                if (Array.isArray(data) && mounted) {
                    setProducts(data);
                }
            } catch (e) {
                console.error("Deal fetch failed", e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchDeals();
        return () => { mounted = false; };
    }, []);

    if (loading) return <ProductGridSkeleton />;
    if (products.length === 0) return null;

    return (
        <section className="featured-section deal-of-day">
            <div className="container">
                <div className="featured-header">
                    <div className="featured-title-group">
                        <h2 className="featured-title">{displayTitle}</h2>
                        <p className="featured-subtitle">{displaySubtitle}</p>
                    </div>
                </div>
                <div className="featured-grid">
                    {products.map((item) => (
                        <ProductCard key={item._id} product={item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
