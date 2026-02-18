'use client';

import React from 'react';
import { useCart } from '../../context/CartContext'; // Adjust path if needed
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './CartSidebar.css';
import { useLanguage } from '../../context/LanguageContext';

const CartSidebar = () => {
    const { t, getLocalized } = useLanguage();
    const pathname = usePathname();
    const {
        isCartOpen,
        closeCart,
        items,
        updateQuantity,
        removeFromCart,
        cartTotal
    } = useCart();

    if (pathname === '/checkout') return null;
    if (!isCartOpen) return null;

    return (
        <div className={`cart-sidebar-overlay ${isCartOpen ? 'open' : ''}`} onClick={(e) => {
            if (e.target === e.currentTarget) closeCart();
        }}>
            <div className="cart-sidebar">
                {/* Header */}
                <div className="cart-sidebar-header">
                    <h2 className="cart-sidebar-title">{t('your_cart')} ({items.length})</h2>
                    <button className="close-cart-btn" onClick={closeCart} aria-label={t('close_cart')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="cart-sidebar-content">
                    {items.length === 0 ? (
                        <div className="empty-cart-message">
                            <svg className="empty-cart-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p>{t('cart_empty')}</p>
                            <button onClick={closeCart} className="start-shopping-btn-link">
                                {t('start_shopping')}
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={`${item.productId}-${item.modelId || 'nm'}-${item.variationId || item.size || 'def'}`} className="sidebar-cart-item">
                                <div className="cart-item-image">
                                    {item.image ? (
                                        <img src={item.image} alt={getLocalized(item.name)} />
                                    ) : (
                                        <div className="cart-item-placeholder" />
                                    )}
                                </div>
                                <div className="cart-item-details">
                                    <div>
                                        <h4 className="cart-item-name">{item.name}</h4>
                                        <div className="cart-item-meta">
                                            {item.size && <span className="cart-item-size">{item.size}</span>}
                                        </div>
                                    </div>
                                    <div className="cart-item-actions">
                                        <div className="quantity-controls">
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variationId || item.size, item.modelId)}
                                            >−</button>
                                            <span className="qty-val">{item.quantity}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variationId || item.size, item.modelId)}
                                            >+</button>
                                        </div>
                                        <span className="item-price">₹{item.price * item.quantity}</span>
                                    </div>
                                    <button
                                        className="remove-item-btn"
                                        onClick={() => removeFromCart(item.productId, item.variationId || item.size, item.modelId)}
                                    >
                                        {t('remove')}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="cart-sidebar-footer">
                        <div className="cart-summary-row">
                            <span>{t('subtotal')}</span>
                            <span>₹{cartTotal}</span>
                        </div>
                        <div className="cart-total-row">
                            <span>{t('total')}</span>
                            <span>₹{Math.round(cartTotal + items.reduce((acc, item) => acc + (item.price * item.quantity * ((item.gst_rate !== undefined ? item.gst_rate : 18) / 100)), 0))}</span>
                        </div>
                        <Link href="/checkout" className="checkout-btn" onClick={closeCart}>
                            {t('proceed_to_checkout')}
                        </Link>
                        <Link href="/cart" className="view-cart-link" onClick={closeCart}>
                            {t('view_full_cart')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartSidebar;
