'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import ProductImage from './ProductImage';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string;
    images: string[];
    isOnDemand: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
    const { user } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

    // Pricing Logic
    const originalPrice = product.basePrice;
    const sellingPrice = product.discountedPrice || product.basePrice; // Fallback if no discounted price

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
                {product.images && product.images.length > 0 ? (
                    <ProductImage
                        src={product.images[0]}
                        alt={product.name}
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

            </div>

            <div className="product-card-content">
                <p className="product-category">{product.category}</p>
                <h3 className="product-title" title={product.name}>{product.name}</h3>

                <div className="product-card-footer">
                    <div className="product-price">
                        <>
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
