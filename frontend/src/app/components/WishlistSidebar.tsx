'use client';

import React from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import './WishlistSidebar.css';

const WishlistSidebar = () => {
    const {
        isWishlistOpen,
        closeWishlist,
        wishlistItems,
        removeFromWishlist,
    } = useWishlist();

    const { addToCart } = useCart();

    if (!isWishlistOpen) return null;

    const handleMoveToCart = async (item: any) => {
        try {
            // Add to cart
            await addToCart({
                productId: item.product._id,
                name: item.product.title,
                price: item.product.discountedPrice || item.product.basePrice,
                quantity: 1,
                image: item.product.featured_image || item.product.gallery_images?.[0] || '',
            });

            // Remove from wishlist
            await removeFromWishlist(item.product._id);
        } catch (error) {
            console.error('Error moving to cart:', error);
        }
    };

    return (
        <div className={`wishlist-sidebar-overlay ${isWishlistOpen ? 'open' : ''}`} onClick={(e) => {
            if (e.target === e.currentTarget) closeWishlist();
        }}>
            <div className="wishlist-sidebar">
                {/* Header */}
                <div className="wishlist-sidebar-header">
                    <h2 className="wishlist-sidebar-title">
                        <svg className="wishlist-title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        My Wishlist ({wishlistItems.length})
                    </h2>
                    <button className="close-wishlist-btn" onClick={closeWishlist} aria-label="Close wishlist">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="wishlist-sidebar-content">
                    {wishlistItems.length === 0 ? (
                        <div className="empty-wishlist-message">
                            <svg className="empty-wishlist-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <p>Your wishlist is empty.</p>
                            <p className="empty-wishlist-subtext">Save your favorite items here!</p>
                            <button onClick={closeWishlist} className="start-shopping-btn">
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        wishlistItems.map((item) => (
                            <div key={item._id} className="sidebar-wishlist-item">
                                <div className="wishlist-item-image">
                                    {(item.product.featured_image || item.product.gallery_images?.[0]) ? (
                                        <img src={item.product.featured_image || item.product.gallery_images[0]} alt={item.product.title} />
                                    ) : (
                                        <div className="no-image-placeholder">No Image</div>
                                    )}
                                </div>
                                <div className="wishlist-item-details">
                                    <div>
                                        <h4 className="wishlist-item-name">{item.product.title}</h4>
                                        <div className="wishlist-item-meta">
                                            <span className="wishlist-item-category">{item.product.category}</span>
                                        </div>
                                        <div className="wishlist-item-price">
                                            {item.product.discountedPrice > 0 && item.product.discountedPrice < item.product.basePrice ? (
                                                <>
                                                    <span className="price-original">₹{item.product.basePrice}</span>
                                                    <span className="price-current">₹{item.product.discountedPrice}</span>
                                                </>
                                            ) : (
                                                <span className="price-current">₹{item.product.basePrice}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="wishlist-item-actions">
                                        <button
                                            className="move-to-cart-btn"
                                            onClick={() => handleMoveToCart(item)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="9" cy="21" r="1" />
                                                <circle cx="20" cy="21" r="1" />
                                                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                            </svg>
                                            Add to Cart
                                        </button>
                                        <button
                                            className="remove-wishlist-item-btn"
                                            onClick={() => removeFromWishlist(item.product._id)}
                                            aria-label="Remove from wishlist"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {wishlistItems.length > 0 && (
                    <div className="wishlist-sidebar-footer">
                        <p className="wishlist-footer-text">
                            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
                        </p>
                        <button onClick={closeWishlist} className="continue-shopping-btn">
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistSidebar;
