import Link from 'next/link';

import ProductOverview from './ProductOverview';
import Header from '@/app/components/Header';
import ProductImage from '../../components/ProductImage';
import ProductCard from '../../components/ProductCard';
import './product-detail.css';

interface Product {
    _id: string;
    title?: string;
    name?: string;
    description: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string | { _id: string; name: string };
    featured_image?: string;
    gallery_images?: string[];
    images?: string[];
    isOnDemand: boolean;
    brand?: string | { _id: string; name: string };
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
        const res = await fetch(`http://localhost:5000/api/products/${id}`, { cache: 'no-store' });
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
        const res = await fetch(`http://localhost:5000/api/products/${productId}/recommendations?limit=4`, { cache: 'no-store' });
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

    const categoryName = typeof product.category === 'object' && product.category !== null ? product.category.name : String(product.category);
    const brandName = typeof product.brand === 'object' && product.brand !== null ? product.brand.name : String(product.brand || '');

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
                <div className="breadcrumb">
                    <Link href="/">HOME</Link>
                    <span>/</span>
                    <Link href="/products">PRODUCTS</Link>
                    <span>/</span>
                    <span className="current">{categoryName.toUpperCase()}</span>
                </div>

                <ProductOverview
                    product={product}
                    categoryName={categoryName}
                    brandName={brandName}
                />

                {/* Product Details Tabs */}
                <div className="product-tabs">
                    <div className="tabs-header">
                        <button className="tab-btn active">DETAIL</button>
                        <button className="tab-btn">SIZE DETAIL</button>
                        <button className="tab-btn">RETURN POLICY</button>
                        <button className="tab-btn">DELIVERY INFO</button>
                    </div>

                    <div className="tab-content">
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">SKU</span>
                                <span className="detail-value">IND-{product._id.slice(-6).toUpperCase()}</span>
                            </div>
                            {product.brand && (
                                <div className="detail-item">
                                    <span className="detail-label">Brand</span>
                                    <span className="detail-value">{brandName}</span>
                                </div>
                            )}
                            <div className="detail-item">
                                <span className="detail-label">Country of Origin</span>
                                <span className="detail-value">{product.countryOfOrigin || 'India'}</span>
                            </div>
                            {product.material && (
                                <div className="detail-item">
                                    <span className="detail-label">Material</span>
                                    <span className="detail-value">{product.material}</span>
                                </div>
                            )}
                            {product.warranty && (
                                <div className="detail-item">
                                    <span className="detail-label">Warranty</span>
                                    <span className="detail-value">{product.warranty}</span>
                                </div>
                            )}
                            {product.description && (
                                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="detail-label">Description</span>
                                    <div
                                        className="detail-value ck-content"
                                        dangerouslySetInnerHTML={{ __html: product.description }}
                                        style={{ lineHeight: '1.6' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="related-products">
                        <h2>RELATED PRODUCTS</h2>
                        <div className="related-grid">
                            {relatedProducts.map((relatedProduct) => (
                                <ProductCard key={relatedProduct._id} product={relatedProduct} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main >
    );
}
