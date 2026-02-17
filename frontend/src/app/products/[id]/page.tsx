import Link from 'next/link';
import { Metadata } from 'next';

import ProductOverview from './ProductOverview';
import Header from '@/app/components/Header';
import ProductImage from '../../components/ProductImage';
import ProductCard from '../../components/ProductCard';
import ProductBreadcrumb from './ProductBreadcrumb';
import ProductDetailsTabs from './ProductDetailsTabs';
import RelatedProducts from './RelatedProducts';
import './product-detail.css';

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
        // Map backend fields to frontend interface
        return {
            ...data,
            basePrice: data.mrp || data.basePrice,
            discountedPrice: data.selling_price_a || data.discountedPrice,
            title: data.title || data.name,
            name: data.title || data.name
        };
    } catch (e) {
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
    } catch (e) {
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
    const description = getEn(product.meta_description) || (getEn(product.description) ? getEn(product.description).replace(/<[^>]*>/g, '').slice(0, 160) : '');

    let keywords = '';
    if (product.keywords) {
        if (Array.isArray(product.keywords)) keywords = product.keywords.join(', ');
        else if (typeof product.keywords === 'object') keywords = (product.keywords as any).en?.join(', ') || '';
    }

    return {
        title,
        description,
        keywords
    };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1>Product Not Found</h1>
                <Link href="/products" className="btn btn-primary">Back to Catalog</Link>
            </div>
        )
    }

    const categoryName = typeof product.category === 'object' && product.category !== null ? product.category.name : product.category;
    const brandName = typeof product.brand === 'object' && product.brand !== null ? product.brand.name : product.brand;

    const relatedProducts = await getRelatedProducts(product._id);
    const discountPercentage = product.discountedPrice && product.discountedPrice < product.basePrice
        ? Math.round(((product.basePrice - product.discountedPrice) / product.basePrice) * 100)
        : 0;

    // Combine featured_image and gallery_images into a single array for easier handling
    const productImages = [
        ...(product.featured_image ? [product.featured_image] : []),
        ...(product.gallery_images || [])
    ];
    const productName = product.title || product.name || 'Product';

    return (
        <main>
            <Header />

            <div className="product-detail-container">
                {/* Breadcrumb */}
                <ProductBreadcrumb categoryName={categoryName} />

                <ProductOverview
                    product={product}
                    categoryName={categoryName}
                    brandName={brandName}
                />

                {/* Product Details Tabs */}
                <ProductDetailsTabs product={product} brandName={brandName} />

                {/* Related Products */}
                <RelatedProducts products={relatedProducts} />
            </div>
        </main >
    );
}
