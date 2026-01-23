"use client";

import ProductForm from "../../../components/ProductForm";
import { useEffect, useState } from "react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        params.then(p => setId(p.id));
    }, [params]);

    if (!id) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container">
            <h1 className="page-title">Edit Product</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Update product details.</p>
            <ProductForm productId={id} />
        </div>
    );
}
