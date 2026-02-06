'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useState } from 'react';

export default function CartPage() {
    const { items, loading, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    if (loading) {
        return (
            <>
                <Header />
                <div className="container" style={{ padding: '4rem 0', textAlign: 'center', minHeight: '60vh' }}>
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
                <div className="container" style={{ padding: '4rem 0', textAlign: 'center', minHeight: '60vh' }}>
                    <h1>Your Cart is Empty</h1>
                    <p style={{ marginBottom: '2rem', color: '#64748B' }}>Looks like you haven't added any industrial parts yet.</p>
                    <Link href="/products" className="btn btn-primary">Browse Catalog</Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="container" style={{ padding: '4rem 0', minHeight: '80vh' }}>
                <h1>Shopping Cart</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                    {/* Cart Items */}
                    <div className="card">
                        {items.map((item) => (
                            <div key={`${item.productId}-${item.size || 'default'}`} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div
                                    style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer' }}
                                    onClick={() => setZoomedImage(item.image)}
                                >
                                    {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ marginBottom: '0.25rem' }}>{item.name}</h4>
                                    {item.size && <p style={{ color: '#F37021', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Size: {item.size}</p>}
                                    <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Unit Price: ₹{item.price}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variationId || item.size, item.modelId)}
                                            style={{ padding: '0 0.5rem', cursor: 'pointer' }}
                                        >-</button>

                                        <span>{item.quantity}</span>

                                        <button
                                            onClick={() => {
                                                if (item.approvedLimit && item.quantity >= item.approvedLimit) {
                                                    alert(`Limit Reached! Your request was approved for only ${item.approvedLimit} units.`);
                                                    return;
                                                }
                                                updateQuantity(item.productId, item.quantity + 1, item.variationId || item.size, item.modelId)
                                            }}
                                            style={{ padding: '0 0.5rem', cursor: 'pointer', opacity: (item.approvedLimit && item.quantity >= item.approvedLimit) ? 0.5 : 1 }}
                                            disabled={!!item.approvedLimit && item.quantity >= item.approvedLimit}
                                        >+</button>
                                    </div>
                                    {item.approvedLimit && (
                                        <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Max: {item.approvedLimit} (Approved)</span>
                                    )}
                                    <span style={{ fontWeight: 700, marginTop: '0.25rem' }}>₹{item.price * item.quantity}</span>
                                    <button onClick={() => removeFromCart(item.productId, item.variationId || item.size, item.modelId)} style={{ color: '#ef4444', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                                </div>
                            </div>
                        ))}

                    </div>

                    {/* Summary */}
                    <div className="card" style={{ height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Subtotal</span>
                            <span>₹{cartTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#64748B', fontSize: '0.9rem' }}>
                            <span>Tax (GST)</span>
                            <span>₹{Math.round(items.reduce((acc, item) => acc + (item.price * item.quantity * ((item.gst_rate !== undefined ? item.gst_rate : 18) / 100)), 0))}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700, fontSize: '1.2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                            <span>Total</span>
                            <span>₹{Math.round(cartTotal + items.reduce((acc, item) => acc + (item.price * item.quantity * ((item.gst_rate !== undefined ? item.gst_rate : 18) / 100)), 0))}</span>
                        </div>
                        <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>Proceed to Checkout</Link>
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
