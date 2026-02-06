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
    models?: any[];
}

interface Props {
    product: Product;
    categoryName: string;
    brandName: string;
}

export default function ProductOverview({ product, categoryName, brandName }: Props) {
    const productName = product.title || product.name || 'Product';

    // Default Image Sequence: Main -> Gallery -> Model Images -> Main (Repeated)
    const defaultImages = [
        ...(product.featured_image ? [product.featured_image] : []),
        ...(product.gallery_images || []),
        ...(product.models?.map((m: any) => m.featured_image).filter(Boolean) || []),
        ...(product.featured_image ? [product.featured_image] : [])
    ].filter((img, index, self) => img && self.indexOf(img) === index); // Unique filter, or keep duplicates? Requirement says "Repeat...". 
    // "Repeat the main product image AFTER model images" implies allowing duplicates. 
    // Let's strictly follow the sequence: Main -> Gallery -> Models -> Main.
    // However, React keys in map might complain if strings are identical. 
    // I will construct it carefully.

    const buildDefaultImages = () => {
        const list: string[] = [];
        if (product.featured_image) list.push(product.featured_image);
        if (product.gallery_images) list.push(...product.gallery_images);
        if (product.models) list.push(...product.models.map((m: any) => m.featured_image).filter((s: any) => s));
        if (product.featured_image) list.push(product.featured_image);
        return list.length > 0 ? list : [''];
    };

    const initialImages = buildDefaultImages();

    const [sliderImages, setSliderImages] = useState<string[]>(initialImages);
    const [activeImage, setActiveImage] = useState(initialImages[0] || '');
    const [selectedVariation, setSelectedVariation] = useState<any>(null);

    const handleVariationSelect = (variation: any, model: any, isAutoSelect: boolean = false) => {
        setSelectedVariation(variation);

        // Requirement 4: "This auto-selection ... Must not affect the default image slider behavior."
        if (isAutoSelect) return;

        // Requirement 3: Model Selection Image Logic
        if (model) {
            const modelImages = [
                model.featured_image,
                ...(model.variations?.map((v: any) => v.image).filter((s: any) => s) || [])
            ].filter(Boolean);

            if (modelImages.length > 0) {
                setSliderImages(modelImages);
                if (variation && variation.image) {
                    setActiveImage(variation.image);
                } else {
                    setActiveImage(modelImages[0]);
                }
            } else {
                // If model has no specific images, maybe fallback to default or keep current?
                // Logic implies we should focus on the model. If no images, maybe just keep default but select something?
                // For now, if no model images, we don't change the slider, just the active image if variant has one.
                if (variation && variation.image) {
                    setActiveImage(variation.image);
                }
            }
        } else {
            // Standalone or Model Deselection (if possible)
            if (variation && variation.image) {
                setActiveImage(variation.image);
            }
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
                {sliderImages.length > 1 && (
                    <div className="thumbnail-gallery">
                        {/* <h4>IMAGES</h4> */}
                        <div className="thumbnails">
                            {sliderImages.map((img, idx) => (
                                <div
                                    key={idx + '-' + img} // simple key to avoid dupes
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
