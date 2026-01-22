"use client";

import ProductForm from "../../../../components/ProductForm";
import { use, useEffect, useState } from "react";
// In Next.js 15, params is a Promise. Here we assume we might need to await it or handle it. 
// Standard in app directory can be props: { params: { id: string } }
// But params usage depends on exact Next version. Assuming standard correct usage for App Router.

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrapping params if it's a promise (standard in newer Next versions)
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        params.then(p => setId(p.id));
    }, [params]);

    if (!id) return <div>Loading...</div>;

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Edit Product</h1>
            <p className="text-slate-500 mb-8">Update product details.</p>
            <ProductForm productId={id} />
        </div>
    );
}
