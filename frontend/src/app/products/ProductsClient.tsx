'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import ProductListSkeleton from '@/app/components/skeletons/ProductListSkeleton';

const HomeRenderer = dynamic(() => import('@/app/components/HomeRenderer'), {
    loading: () => (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <div className="flex-grow">
                <ProductListSkeleton />
            </div>
            <Footer />
        </main>
    ),
    ssr: false
});

export default function ProductsClient({ previewLayout }: { previewLayout?: any }) {
    return (
        <div className="specific-products-page">
            <HomeRenderer pageSlug="products" previewLayout={previewLayout} />
        </div>
    );
}
