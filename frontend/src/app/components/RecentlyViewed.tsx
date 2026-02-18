'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './FeaturedProducts.css'; // Reuse CSS
import api from '@/app/utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function RecentlyViewed({ config }: { config?: any }) {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const displayTitle = (language === 'hi' && config?.showHindi && config?.titleHindi)
        ? config.titleHindi
        : (config?.title || t('recently_viewed'));

    const displaySubtitle = (language === 'hi' && config?.showHindi && config?.subtitleHindi)
        ? config.subtitleHindi
        : (config?.subtitle || t('recently_viewed_subtitle'));

    useEffect(() => {
        const fetchRecentlyViewed = async () => {
            try {
                const viewedRaw = localStorage.getItem('recently_viewed');
                if (!viewedRaw) {
                    setLoading(false);
                    return;
                }
                const viewedIds = JSON.parse(viewedRaw);
                if (!Array.isArray(viewedIds) || viewedIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch products by IDs
                const idsParam = viewedIds.join(',');
                const res = await api.get(`/products?ids=${idsParam}`);

                let productList = [];
                // Handle different response structures
                if (Array.isArray(res.data)) {
                    productList = res.data;
                } else if (res.data && Array.isArray(res.data.products)) {
                    productList = res.data.products;
                }

                // Sort by index in viewedIds to maintain "most recent" order?
                // actually localStorage usually pushes to front.
                // So index 0 is most recent.
                // We want to show most recent first? Yes.
                productList.sort((a: any, b: any) => {
                    return viewedIds.indexOf(a._id) - viewedIds.indexOf(b._id);
                });

                setProducts(productList);
            } catch (err) {
                console.error('Error fetching recently viewed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentlyViewed();
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
