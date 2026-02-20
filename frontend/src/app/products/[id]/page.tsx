import Link from 'next/link';
import { Metadata } from 'next';

import ProductOverview from './ProductOverview';
import Header from '@/app/components/Header';
import ProductBreadcrumb from './ProductBreadcrumb';
import ProductDetailsTabs from './ProductDetailsTabs';
import RelatedProducts from './RelatedProducts';
import './product-detail.css';
import AppReadySignaler from '@/components/AppReadySignaler';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '') + '/api';

interface Product {
    _id: string;
    title?: any;
    name?: any;
    meta_title?: any;
    meta_description?: any;
    keywords?: any;
    description: any;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string | { _id: string; name: any };
    featured_image?: string;
    gallery_images?: string[];
    images?: string[];
    isOnDemand: boolean;
    brand?: string | { _id: string; name: any };
    warranty?: string;
    material?: string;
    countryOfOrigin?: string;
    variations?: {
        type: string;
        value: string;
        price: number;
        stock: number;
        sku?: string;
        image?: string;
        isActive: boolean;
        _id: string;
    }[];
}

async function getProduct(id: string): Promise<Product | null> {
    try {
        const res = await fetch(`${API_URL}/products/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            ...data,
            basePrice: data.mrp || data.basePrice,
            discountedPrice: data.selling_price_a || data.discountedPrice,
            title: data.title || data.name,
            name: data.title || data.name
        };
    } catch {
        return null;
    }
}

async function getRelatedProducts(productId: string): Promise<Product[]> {
    try {
        const res = await fetch(`${API_URL}/products/${productId}/recommendations?limit=4`, { cache: 'no-store' });
        if (!res.ok) return [];
        const productsRaw = await res.json();
        return productsRaw.map((p: any) => ({
            ...p,
            basePrice: p.mrp || p.basePrice,
            discountedPrice: p.selling_price_a || p.discountedPrice,
            title: p.title || p.name,
            name: p.title || p.name
        }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);
    if (!product) return { title: 'Product Not Found' };

    const getEn = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.en || '';
    };

    const title = getEn(product.meta_title) || getEn(product.title) || getEn(product.name) || 'Product';
    return { title };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        return (
            <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
                <Header />
                <h1>Product Not Found</h1>
                <Link href="/products" className="btn btn-primary">Back to Catalog</Link>
                <AppReadySignaler />
            </div>
        )
    }

    const categoryName = typeof product.category === 'object' && product.category !== null ? (product.category as any).name : product.category;
    const brandName = typeof product.brand === 'object' && product.brand !== null ? (product.brand as any).name : product.brand;
    const relatedProducts = await getRelatedProducts(product._id);

    return (
        <main>
            <Header />
            {/* Signal Android that app is ready once meaningful content is rendered */}
            <AppReadySignaler />

            <div className="product-detail-container">
                <ProductBreadcrumb categoryName={categoryName} />
                <ProductOverview
                    product={product}
                    categoryName={categoryName}
                    brandName={brandName}
                />
                <ProductDetailsTabs product={product} brandName={brandName} />
                <RelatedProducts products={relatedProducts} />
            </div>
        </main >
    );
}
