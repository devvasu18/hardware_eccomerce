'use client';
import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './FeaturedProducts.css'; // Reuse CSS
import api from '@/app/utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { cache } from '@/utils/cache';

export default function RecentlyViewed({ config }: { config?: any }) {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<any[]>(() => cache.get<any[]>('recently_viewed_products') || []);
    const [loading, setLoading] = useState(() => !cache.get('recently_viewed_products'));

    const displayTitle = (language === 'hi' && config?.showHindi && config?.titleHindi)
        ? config.titleHindi
        : (config?.title || t('recently_viewed'));

    const displaySubtitle = (language === 'hi' && config?.showHindi && config?.subtitleHindi)
        ? config.subtitleHindi
        : (config?.subtitle || t('recently_viewed_subtitle'));

    useEffect(() => {
        const fetchRecentlyViewed = async (isBackground = false) => {
            if (!isBackground) setLoading(true);
            try {
                const viewedRaw = localStorage.getItem('recently_viewed');
                if (!viewedRaw) {
                    setLoading(false);
                    setProducts([]);
                    return;
                }
                const viewedIds = JSON.parse(viewedRaw);
                if (!Array.isArray(viewedIds) || viewedIds.length === 0) {
                    setLoading(false);
                    setProducts([]);
                    return;
                }

                // Fetch products by IDs
                const idsParam = viewedIds.join(',');
                const res = await api.get(`/products?ids=${idsParam}`);

                let productList = [];
                if (Array.isArray(res.data)) {
                    productList = res.data;
                } else if (res.data && Array.isArray(res.data.products)) {
                    productList = res.data.products;
                }

                productList.sort((a: any, b: any) => {
                    return viewedIds.indexOf(a._id) - viewedIds.indexOf(b._id);
                });

                setProducts(productList);
                cache.set('recently_viewed_products', productList, 15); // 15 mins
            } catch (err) {
                console.error('Error fetching recently viewed:', err);
            } finally {
                if (!isBackground) setLoading(false);
            }
        };

        const isExpired = cache.isExpired('recently_viewed_products');
        if (isExpired || products.length === 0) {
            fetchRecentlyViewed(products.length > 0);
        }
    }, []);

    if (loading || products.length === 0) return null;

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
