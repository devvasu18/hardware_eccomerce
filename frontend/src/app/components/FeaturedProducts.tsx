"use client";

import Link from 'next/link';
import ProductCard from './ProductCard';
import './FeaturedProducts.css';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string | { _id: string; name: string };
    imageUrl?: string;
    images: string[];
    isOnDemand: boolean;
}

interface FeaturedProductsProps {
    products: Product[];
    config?: any;
}

export default function FeaturedProducts({ products, config }: FeaturedProductsProps) {
    return (
        <section className="featured-section">
            <div className="container">
                <div className="featured-header">
                    <div className="featured-title-group">
                        <h2 className="featured-title">{config?.title || 'Featured Products'}</h2>
                        <p className="featured-subtitle">{config?.subtitle || 'Handpicked selections from our premium collection'}</p>
                    </div>
                    <Link href="/products" className="featured-view-all">
                        View All Products
                        <span>→</span>
                    </Link>
                </div>

                {products.length === 0 ? (
                    <div className="featured-empty">
                        <p>No products available at the moment. Please check back later.</p>
                    </div>
                ) : (
                    <div className="featured-grid">
                        {products.map((item) => (
                            <ProductCard key={item._id} product={item} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
