import React from 'react';
import Header from '@/app/components/Header';
import ProductDetailsSkeleton from '@/app/components/skeletons/ProductDetailsSkeleton';

export default function Loading() {
    return (
        <main>
            <Header />
            <ProductDetailsSkeleton />
        </main>
    );
}
