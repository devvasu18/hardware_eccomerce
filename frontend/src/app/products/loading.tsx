import React from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import ProductListSkeleton from '@/app/components/skeletons/ProductListSkeleton';

export default function Loading() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <div className="flex-grow">
                <ProductListSkeleton />
            </div>
            <Footer />
        </main>
    );
}
