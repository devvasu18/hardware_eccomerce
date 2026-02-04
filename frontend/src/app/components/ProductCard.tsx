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
}

export default function ProductCard({ product }: { product: Product }) {
    const { user } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

    // Variation Pricing Fallback (including Models)
    const allVariations = [
        ...(product.variations || []),
        ...(product.models?.flatMap(m => m.variations || []) || [])
    ];

    const variationPrices = allVariations.filter(v => v.isActive).map(v => v.price) || [];

    // Also consider model base prices if they don't have variations
    const modelPrices = product.models?.filter(m => m.isActive && (!m.variations || m.variations.length === 0))
        .map(m => m.selling_price_a || m.mrp || 0) || [];

    const combinedPrices = [...variationPrices, ...modelPrices];
    const minVarPrice = combinedPrices.length > 0 ? Math.min(...combinedPrices) : null;
    const showStartingAt = !product.discountedPrice && !product.basePrice && minVarPrice;

    // Pricing Logic
    const originalPrice = product.basePrice || (showStartingAt ? (product.variations?.find(v => v.price === minVarPrice)?.mrp || minVarPrice) : 0);
    const sellingPrice = product.discountedPrice || product.basePrice || minVarPrice || 0;

    let finalPrice = sellingPrice;
    if (user?.customerType === 'wholesale' && user.wholesaleDiscount) {
        finalPrice = Math.round(sellingPrice * (1 - user.wholesaleDiscount / 100));
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
                {originalPrice > finalPrice && (
                    <div className="product-badge badge-sale">
                        {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}% OFF
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
                            {(product.discountedPrice > 0 && product.discountedPrice < product.basePrice) && (
                                <span className="price-original">₹{originalPrice}</span>
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
