'use client';

import React from 'react';
import ProductCard from '../../components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';

export default function RelatedProducts({ products }: { products: any[] }) {
    const { t } = useLanguage();

    if (products.length === 0) return null;

    return (
        <div className="related-products">
            <h2>{t('related_products')}</h2>
            <div className="related-grid">
                {products.map((relatedProduct) => (
                    <ProductCard key={relatedProduct._id} product={relatedProduct} />
                ))}
            </div>
        </div>
    );
}
