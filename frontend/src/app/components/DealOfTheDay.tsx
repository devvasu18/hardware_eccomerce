'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './FeaturedProducts.css'; // Reuse CSS
import api from '@/app/utils/api';

export default function DealOfTheDay() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const res = await api.get('/products/daily-offers');
                let data = res.data;
                if (!Array.isArray(data) && data.products) {
                    data = data.products;
                }
                if (Array.isArray(data)) {
                    setProducts(data);
                }
            } catch (e) {
                console.error("Deal fetch failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();
    }, []);

    if (loading || products.length === 0) return null;

    return (
        <section className="featured-section deal-of-day">
            <div className="container">
                <div className="featured-header">
                    <div className="featured-title-group">
                        <h2 className="featured-title">Deal of the Day</h2>
                        <p className="featured-subtitle">Limited time offers!</p>
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
