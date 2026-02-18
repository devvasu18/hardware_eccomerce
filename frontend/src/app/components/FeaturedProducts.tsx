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
    const { t, language } = useLanguage();

    // Determine title and subtitle based on language
    const displayTitle = (language === 'hi' && config?.showHindi && config?.titleHindi)
        ? config.titleHindi
        : (config?.title || t('featured_products'));

    const displaySubtitle = (language === 'hi' && config?.showHindi && config?.subtitleHindi)
        ? config.subtitleHindi
        : (config?.subtitle || t('featured_subtitle'));

    return (
        <section className="featured-section">
            <div className="container">
                <div className="featured-header">
                    <div className="featured-title-group">
                        <h2 className="featured-title">{displayTitle}</h2>
                        <p className="featured-subtitle">{displaySubtitle}</p>
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
