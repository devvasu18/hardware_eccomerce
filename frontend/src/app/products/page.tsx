import React from 'react';
import ProductsClient from './ProductsClient';

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

    return <ProductsClient previewLayout={previewLayout} />;
}
