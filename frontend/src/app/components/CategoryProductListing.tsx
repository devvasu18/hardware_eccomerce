'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import './CategoryProductListing.css';

interface CategoryProductListingProps {
    config?: {
        categoryId?: string;
        categoryName?: string;
        sortBy?: 'most_viewed' | 'most_purchased' | 'newest';
        limit?: number;
        showViewAll?: boolean;
    };
}

const CategoryProductListing: React.FC<CategoryProductListingProps> = ({ config }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categoryId = config?.categoryId;
    const sortBy = config?.sortBy || 'newest';
    const limit = config?.limit || 4;
    const showViewAll = config?.showViewAll !== false;
    const categoryName = config?.categoryName || 'Featured Category';

    useEffect(() => {
        const fetchProducts = async () => {
            if (!categoryId) {
                setLoading(false);
                return;
            }

            try {
                // We'll use the existing products API with filters
                const response = await fetch(`http://localhost:5000/api/products?category=${categoryId}&sort=${sortBy}&limit=${limit}`);
                const data = await response.json();

                if (data.products) {
                    setProducts(data.products.map((p: any) => ({
                        ...p,
                        basePrice: p.mrp || p.basePrice,
                        discountedPrice: p.selling_price_a || p.discountedPrice,
                        title: p.title || p.name,
                        name: p.title || p.name
                    })));
                }
            } catch (error) {
                console.error('Error fetching category products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categoryId, sortBy, limit]);

    if (!categoryId) return null;

    return (
        <section className="category-products-section">
            <div className="category-products-container">
                <div className="section-header">
                    <h2 className="section-title">{categoryName}</h2>
                    {showViewAll && (
                        <Link href={`/categories/${categoryId}`} className="view-all-btn">
                            View All Products
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="loading-placeholder">
                        {[...Array(limit)].map((_, i) => (
                            <div key={i} className="skeleton-card"></div>
                        ))}
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default CategoryProductListing;
