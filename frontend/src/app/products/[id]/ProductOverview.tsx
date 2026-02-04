'use client';
import { useState } from 'react';
import Link from 'next/link';
import ProductActionArea from './ProductActionArea';
import ProductImage from '@/app/components/ProductImage';

// Reusing interfaces loosely or defining them
interface Product {
    _id: string;
    title?: string;
    name?: string;
    description: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: any;
    featured_image?: string;
    gallery_images?: string[];
    images?: string[];
    isOnDemand: boolean;
    brand?: any;
    warranty?: string;
    material?: string;
    countryOfOrigin?: string;
    variations?: any[];
}

interface Props {
    product: Product;
    categoryName: string;
    brandName: string;
}

export default function ProductOverview({ product, categoryName, brandName }: Props) {
    const productName = product.title || product.name || 'Product';


    // Images Array
    const productImages = [
        ...(product.featured_image ? [product.featured_image] : []),
        ...(product.gallery_images || [])
    ];

    const [activeImage, setActiveImage] = useState(productImages[0] || '');
    const [selectedVariation, setSelectedVariation] = useState<any>(null);

    const handleVariationSelect = (variation: any) => {
        setSelectedVariation(variation);
        // If variation has a specific image, show it, otherwise fallback to default
        if (variation && variation.image) {
            setActiveImage(variation.image);
        } else {
            setActiveImage(productImages[0] || '');
        }
    };

    // Find Lowest Variation Price for "Starting at" display
    const variationPrices = product.variations?.map(v => v.price) || [];
    const minVariationPrice = variationPrices.length > 0 ? Math.min(...variationPrices) : null;

    const variationMRPs = product.variations?.map(v => v.mrp).filter(m => m) || [];
    const minVariationMRP = variationMRPs.length > 0 ? Math.min(...variationMRPs as number[]) : null;

    // Dynamic Discount Calculation
    const activeMRP = selectedVariation?.mrp || product.basePrice || minVariationMRP;
    const activePrice = selectedVariation
        ? selectedVariation.price
        : (product.discountedPrice || minVariationPrice || product.basePrice);

    const discountPercentage = activeMRP && activePrice && activePrice < activeMRP
        ? Math.round(((activeMRP - activePrice) / activeMRP) * 100)
        : 0;

    return (
        <div className="product-detail-grid">
            {/* Left: Image Gallery */}
            <div className="product-gallery">
                {discountPercentage > 0 && (
                    <div className="discount-badge">
                        {discountPercentage}%
                    </div>
                )}

                <div className="main-image">
                    {activeImage ? (
                        <ProductImage
                            src={activeImage}
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
                            {productImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                                    onClick={() => setActiveImage(img)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <ProductImage
                                        src={img}
                                        alt={`${productName} - thumb ${idx + 1}`}
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
                    {product.description || "Premium quality industrial hardware component designed for professional use."}
                </p>

                {/* Pricing & Action Area */}
                {/* We pass handleVariationSelect to update the image when variant changes */}
                <ProductActionArea product={product} onVariationSelect={handleVariationSelect} />

                <div className="size-guide">
                    <Link href="#" className="size-guide-link">SIZE GUIDE</Link>
                </div>

                <div className="delivery-estimate">
                    <h4>DELIVERY ESTIMATE</h4>
                    <p>Standard delivery: 3-5 business days</p>
                    <p>Express delivery available at checkout</p>
                </div>
            </div>
        </div>
    );
}
