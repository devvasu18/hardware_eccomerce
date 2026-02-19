'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import './cart.css';

export default function CartPage() {
    const { items, loading, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { getLocalized, t } = useLanguage();
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const TrashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
    );

    if (loading) {
        return (
            <>
                <Header />
                <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center', minHeight: '60vh' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <p>Loading your cart...</p>
                </div>
                <Footer />
            </>
        );
    }

    if (items.length === 0) {
        return (
            <>
                <Header />
                <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center', minHeight: '60vh' }}>
                    <h1 style={{ color: 'var(--text-primary)' }}>Your Cart is Empty</h1>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Looks like you haven't added any industrial parts yet.</p>
                    <Link href="/products" className="btn btn-primary">Browse Catalog</Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="container cart-container">
                <h1 className="cart-title">Shopping Cart</h1>

                <div className="cart-layout">
                    {/* Cart Items */}
                    <div className="card cart-items-card">
                        {items.map((item) => (
                            <div key={`${item.productId}-${item.modelId || 'nm'}-${item.variationId || item.size || 'default'}`} className="cart-item">
                                <div
                                    className="cart-item-image-wrapper"
                                    onClick={() => setZoomedImage(item.image)}
                                >
                                    {item.image ? <img src={item.image} alt={getLocalized(item.name)} /> : null}
                                </div>

                                <div className="cart-item-details">
                                    <div className="cart-item-info-top">
                                        <h4 className="cart-item-name">{getLocalized(item.name)}</h4>
                                        <div className="cart-item-meta">
                                            {item.size && <span className="cart-item-size">Size: {item.size}</span>}
                                            <span className="cart-item-price-unit">Unit Price: ₹{item.price}</span>
                                        </div>
                                    </div>

                                    <button
                                        className="remove-item-btn show-mobile"
                                        onClick={() => removeFromCart(item.productId, item.variationId || item.size, item.modelId)}
                                    >
                                        <TrashIcon /> Remove
                                    </button>
                                </div>

                                <div className="cart-item-right">
                                    <div className="quantity-selector">
                                        <button
                                            className="q-btn"
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variationId || item.size, item.modelId)}
                                        >-</button>

                                        <span className="q-count">{item.quantity}</span>

                                        <button
                                            className="q-btn"
                                            onClick={() => {
                                                if (item.approvedLimit && item.quantity >= item.approvedLimit) {
                                                    alert(`Limit Reached! Your request was approved for only ${item.approvedLimit} units.`);
                                                    return;
                                                }
                                                updateQuantity(item.productId, item.quantity + 1, item.variationId || item.size, item.modelId)
                                            }}
                                            disabled={!!item.approvedLimit && item.quantity >= item.approvedLimit}
                                        >+</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        {item.approvedLimit && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Max: {item.approvedLimit} (Approved)</span>
                                        )}
                                        <span className="cart-item-total-price">₹{item.price * item.quantity}</span>
                                        <button
                                            className="remove-item-btn hide-mobile"
                                            onClick={() => removeFromCart(item.productId, item.variationId || item.size, item.modelId)}
                                        >
                                            <TrashIcon /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="card summary-card">
                        <h3 className="summary-title">Order Summary</h3>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{cartTotal}</span>
                        </div>
                        <div className="summary-row" style={{ fontSize: '0.9rem' }}>
                            <span>Tax (GST)</span>
                            <span>₹{Math.round(items.reduce((acc, item) => acc + (item.price * item.quantity * ((item.gst_rate !== undefined ? item.gst_rate : 18) / 100)), 0))}</span>
                        </div>
                        <div className="summary-row total">
                            <span>Total</span>
                            <span>₹{Math.round(cartTotal + items.reduce((acc, item) => acc + (item.price * item.quantity * ((item.gst_rate !== undefined ? item.gst_rate : 18) / 100)), 0))}</span>
                        </div>
                        <Link href="/checkout" className="btn btn-primary checkout-btn">Proceed to Checkout</Link>
                    </div>
                </div>

                {/* IMAGE ZOOM MODAL */}
                {zoomedImage && (
                    <div
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'zoom-out'
                        }}
                        onClick={() => setZoomedImage(null)}
                    >
                        <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                            <img
                                src={zoomedImage}
                                alt="Zoomed Product"
                                style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                                style={{
                                    position: 'absolute', top: '-40px', right: '-40px',
                                    background: 'none', border: 'none', color: 'white',
                                    fontSize: '2rem', cursor: 'pointer'
                                }}
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
