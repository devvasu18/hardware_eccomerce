'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import ProductImage from './ProductImage';

interface Product {
    _id: string;
    title?: string;
    name?: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: any;
    featured_image?: string;
    gallery_images?: string[];
    images?: string[];
    isOnDemand: boolean;
    variations?: { price: number; mrp?: number; isActive: boolean }[];
    models?: {
        isActive: boolean;
        selling_price_a?: number;
        mrp?: number;
        variations?: { price: number; mrp?: number; isActive: boolean }[];
    }[];
    // Add optional raw fields from API if they exist
    selling_price_a?: number;
    mrp?: number;
    offers?: { percentage: number;[key: string]: any }[];
}

export default function ProductCard({ product }: { product: Product }) {
    const { user } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

    // --- Improved Pricing Logic ---
    const allPrices: number[] = [];

    // 1. Standalone Variations
    if (product.variations) {
        product.variations.forEach(v => {
            if (v.isActive !== false && v.price > 0) allPrices.push(v.price);
        });
    }

    // 2. Models (Base & Variations)
    if (product.models) {
        product.models.forEach(m => {
            if (m.isActive !== false) {
                if (m.selling_price_a && m.selling_price_a > 0) allPrices.push(m.selling_price_a);
                if (m.variations) {
                    m.variations.forEach(v => {
                        if (v.isActive !== false && v.price > 0) allPrices.push(v.price);
                    });
                }
            }
        });
    }

    const minCalculatedPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

    // Determine the effective main price from various potential fields
    const directPrice = product.discountedPrice || product.selling_price_a || product.basePrice || 0;

    // If direct price is present, use it. Otherwise fallback to min calculated variation/model price.
    const effectivePrice = directPrice > 0 ? directPrice : (minCalculatedPrice || 0);

    const showStartingAt = directPrice === 0 && minCalculatedPrice !== null;

    // MRP Display
    let displayMRP = product.basePrice || product.mrp;

    // If we are showing "Starting From" logic, try to find the MRP of the specific variation/model that has the min price
    if (showStartingAt && minCalculatedPrice) {
        // Try to find in variations
        const matchingVar = product.variations?.find(v => v.price === minCalculatedPrice && v.isActive !== false);
        if (matchingVar && matchingVar.mrp) {
            displayMRP = matchingVar.mrp;
        } else {
            // Try to find in models
            const matchingModel = product.models?.find(m => {
                if (m.isActive === false) return false;
                // check model base price
                if (m.selling_price_a === minCalculatedPrice) return true;
                // check model variations
                return m.variations?.some(v => v.isActive !== false && v.price === minCalculatedPrice);
            });

            if (matchingModel) {
                // If it matched a variation inside the model
                const matchingModelVar = matchingModel.variations?.find(v => v.isActive !== false && v.price === minCalculatedPrice);
                if (matchingModelVar && matchingModelVar.mrp) {
                    displayMRP = matchingModelVar.mrp;
                } else if (matchingModel.mrp) {
                    // Fallback to model base mrp if no variation mrp or if model base price was the match
                    displayMRP = matchingModel.mrp;
                }
            }
        }
    }

    // 3. Offers Logic
    const offers = product.offers || [];
    const bestOfferPercentage = offers.reduce((max, offer) => Math.max(max, offer.percentage), 0);

    // Apply Offer to Effective Price (for retail customers)
    let finalPrice = effectivePrice;
    if (bestOfferPercentage > 0) {
        finalPrice = Math.round(effectivePrice * (1 - bestOfferPercentage / 100));
    }

    if (user?.customerType === 'wholesale' && user.wholesaleDiscount) {
        // Wholesale discount applies on the original effective price (usually) or the already discounted price?
        // Let's assume on the original effective price for now to be safe, or ask user.
        // But usually wholesale doesn't stack with retail offers.
        // Let's stick to existing wholesale logic which overrides everything.
        finalPrice = Math.round(effectivePrice * (1 - user.wholesaleDiscount / 100));
    }

    const inWishlist = isInWishlist(product._id);

    const handleWishlistClick = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation to product page
        e.stopPropagation();

        if (isAddingToWishlist) return;

        setIsAddingToWishlist(true);
        try {
            if (inWishlist) {
                await removeFromWishlist(product._id);
            } else {
                await addToWishlist(product._id);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        } finally {
            setIsAddingToWishlist(false);
        }
    };

    return (
        <Link href={`/products/${product._id}`} className="product-card">
            <div className="product-card-image-container">
                {(product.featured_image || (product.gallery_images && product.gallery_images.length > 0) || (product.images && product.images.length > 0)) ? (
                    <ProductImage
                        src={product.featured_image || product.gallery_images?.[0] || product.images?.[0] || ''}
                        alt={product.title || product.name || 'Product'}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                ) : (
                    <div className="no-image-placeholder">
                        No Image
                    </div>
                )}

                {/* Wishlist Button */}
                <button
                    className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
                    onClick={handleWishlistClick}
                    disabled={isAddingToWishlist}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={inWishlist ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>

                {/* Discount Badge */}
                {displayMRP && (displayMRP > finalPrice) && (
                    <div className="product-badge badge-sale">
                        {Math.round(((displayMRP - finalPrice) / displayMRP) * 100)}% OFF
                    </div>
                )}
            </div>

            <div className="product-card-content">
                <p className="product-category">
                    {typeof product.category === 'object' && product.category?.name
                        ? product.category.name
                        : typeof product.category === 'string' && product.category.length > 10
                            ? 'Auto Part'
                            : product.category}
                </p>
                <h3 className="product-title" title={product.title || product.name}>{product.title || product.name}</h3>

                <div className="product-card-footer">
                    <div className="product-price">
                        <>
                            {showStartingAt && <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>From</span>}
                            {(displayMRP && displayMRP > 0 && displayMRP > finalPrice) && (
                                <span className="price-original">₹{displayMRP}</span>
                            )}
                            <span className="price-current">₹{finalPrice}</span>
                        </>
                    </div>

                    <div className="product-action">
                        <span className="btn-card-action">View</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
