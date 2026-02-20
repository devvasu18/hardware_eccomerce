'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './FeaturedProducts.css'; // Reuse CSS
import api from '@/app/utils/api';
import { useLanguage } from '../../context/LanguageContext';

import { ProductGridSkeleton } from './skeletons/HomeSkeleton';

export default function RecommendedProducts({ config }: { config?: any }) {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const displayTitle = (language === 'hi' && config?.showHindi && config?.titleHindi)
        ? config.titleHindi
        : (config?.title || t('recommended_title'));

    const displaySubtitle = (language === 'hi' && config?.showHindi && config?.subtitleHindi)
        ? config.subtitleHindi
        : (config?.subtitle || t('recommended_subtitle'));

    useEffect(() => {
        let mounted = true;
        const fetchRecommendations = async () => {
            try {
                // 1. Get user history
                const viewedRaw = localStorage.getItem('recently_viewed');
                let targetId = null;
                if (viewedRaw) {
                    const viewedIds = JSON.parse(viewedRaw);
                    if (Array.isArray(viewedIds) && viewedIds.length > 0) {
                        targetId = viewedIds[0]; // Most recent
                    }
                }

                if (!targetId) {
                    if (mounted) setLoading(false);
                    return;
                }

                const res = await api.get(`/products/${targetId}/recommendations?limit=4`);

                // Ensure we get an array
                let fetched = res.data;
                if (!Array.isArray(fetched) && fetched.products) {
                    fetched = fetched.products;
                }

                if (Array.isArray(fetched) && mounted) {
                    setProducts(fetched);
                }
            } catch (err) {
                console.error('Error fetching recommendations:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchRecommendations();
        return () => { mounted = false; };
    }, []);

    if (loading) return <ProductGridSkeleton />;
    if (products.length === 0) return null;

    return (
        <section className="featured-section">
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
