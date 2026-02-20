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
export default async function ProductsPage() {
    let previewLayout = undefined;

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/home-layout?page=products`, {
            next: { revalidate: 60 }
        });

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                previewLayout = data;
            }
        }
    } catch (e) {
        // Silently fallback to client-side fetch if server fetch fails
    }

    return (
        <div className="specific-products-page">
            <HomeRenderer pageSlug="products" previewLayout={previewLayout} />
        </div>
    );
}
