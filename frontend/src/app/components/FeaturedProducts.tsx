"use client";

import Link from 'next/link';
import ProductCard from './ProductCard';
import './FeaturedProducts.css';
import { useLanguage } from '../../context/LanguageContext';

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
    const { t } = useLanguage();
    return (
        <section className="featured-section">
            <div className="container">
                <div className="featured-header">
                    <div className="featured-title-group">
                        <h2 className="featured-title">{config?.title || t('featured_products')}</h2>
                        <p className="featured-subtitle">{config?.subtitle || t('featured_subtitle')}</p>
                    </div>
                    <Link href="/products" className="featured-view-all">
                        {t('view_all_products')}
                        <span>→</span>
                    </Link>
                </div>

                {products.length === 0 ? (
                    <div className="featured-empty">
                        <p>{t('no_products_available')}</p>
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
