import Link from 'next/link';
import ProductActionArea from './ProductActionArea';
import Header from '@/app/components/Header';
import ProductImage from '@/app/components/ProductImage';
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

async function getRelatedProducts(category: string, currentId: string): Promise<Product[]> {
    try {
        const res = await fetch(`http://localhost:5000/api/products?category=${encodeURIComponent(category)}`, { cache: 'no-store' });
        if (!res.ok) return [];
        const productsRaw = await res.json();
        const productsArray = Array.isArray(productsRaw) ? productsRaw : (productsRaw.products || []);

        return productsArray
            .filter((p: any) => p._id !== currentId)
            .map((p: any) => ({
                ...p,
                basePrice: p.mrp || p.basePrice,
                discountedPrice: p.selling_price_a || p.discountedPrice,
                title: p.title || p.name,
                name: p.title || p.name
            }))
            .slice(0, 3);
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

    const relatedProducts = await getRelatedProducts(categoryName, product._id);
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

                <div className="product-detail-grid">
                    {/* Left: Image Gallery */}
                    <div className="product-gallery">
                        {discountPercentage > 0 && (
                            <div className="discount-badge">
                                {discountPercentage}%
                            </div>
                        )}

                        <div className="main-image">
                            {productImages.length > 0 ? (
                                <ProductImage
                                    src={productImages[0]}
                                    alt={productName}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <div className="no-image">No Image</div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {productImages.length > 1 && (
                            <div className="thumbnail-gallery">
                                <h4>OTHER VARIATIONS</h4>
                                <div className="thumbnails">
                                    {productImages.slice(0, 3).map((img, idx) => (
                                        <div key={idx} className="thumbnail">
                                            <ProductImage
                                                src={img}
                                                alt={`${productName} - view ${idx + 1}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info */}
                    <div className="product-info">
                        <div className="product-meta">
                            <span className="product-code">PRODUCT CODE: IND-{product._id.slice(-6).toUpperCase()}</span>
                            <span className="separator">|</span>
                            <span className="product-category-tag">{categoryName}</span>

                        </div>

                        <h1 className="product-name">{productName}</h1>

                        <div className="product-rating">
                            <div className="stars">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < 4 ? 'star filled' : 'star'}>★</span>
                                ))}
                            </div>
                            <span className="review-count">17 reviews</span>
                        </div>

                        <p className="product-description">
                            {product.description || "Premium quality industrial hardware component designed for professional use. Built to last with superior materials and precision engineering."}
                        </p>

                        {/* Pricing & Action Area */}
                        <ProductActionArea product={product} />

                        {/* Size Guide */}
                        <div className="size-guide">
                            <Link href="#" className="size-guide-link">SIZE GUIDE</Link>
                        </div>

                        {/* Delivery Estimate */}
                        <div className="delivery-estimate">
                            <h4>DELIVERY ESTIMATE</h4>
                            <p>Standard delivery: 3-5 business days</p>
                            <p>Express delivery available at checkout</p>
                        </div>
                    </div>
                </div>

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
                                    <span className="detail-value">{product.description}</span>
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
                            {relatedProducts.map((relatedProduct) => {
                                const relatedCategoryName = typeof relatedProduct.category === 'object' && relatedProduct.category !== null ? relatedProduct.category.name : String(relatedProduct.category);
                                return (
                                    <Link
                                        key={relatedProduct._id}
                                        href={`/products/${relatedProduct._id}`}
                                        className="related-product-card"
                                    >
                                        <div className="related-product-image">
                                            {(relatedProduct.featured_image || (relatedProduct.gallery_images && relatedProduct.gallery_images.length > 0)) ? (
                                                <ProductImage
                                                    src={relatedProduct.featured_image || relatedProduct.gallery_images![0]}
                                                    alt={relatedProduct.title || relatedProduct.name || 'Product'}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <div className="no-image">No Image</div>
                                            )}
                                        </div>
                                        <div className="related-product-info">
                                            <p className="related-category">{relatedCategoryName}</p>
                                            <h3 className="related-name">{relatedProduct.title || relatedProduct.name}</h3>
                                            <div className="related-price">
                                                {relatedProduct.discountedPrice && relatedProduct.discountedPrice < relatedProduct.basePrice ? (
                                                    <>
                                                        <span className="price-original">₹{relatedProduct.basePrice}</span>
                                                        <span className="price-current">₹{relatedProduct.discountedPrice}</span>
                                                    </>
                                                ) : (
                                                    <span className="price-current">₹{relatedProduct.basePrice}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </main >
    );
}
