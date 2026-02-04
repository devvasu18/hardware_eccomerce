'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartPage() {
    const { items, loading, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p>Loading your cart...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1>Your Cart is Empty</h1>
                <p style={{ marginBottom: '2rem', color: '#64748B' }}>Looks like you haven't added any industrial parts yet.</p>
                <Link href="/products" className="btn btn-primary">Browse Catalog</Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1>Shopping Cart</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                {/* Cart Items */}
                <div className="card">
                    {items.map((item) => (
                        <div key={`${item.productId}-${item.size || 'default'}`} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ marginBottom: '0.25rem' }}>{item.name}</h4>
                                {item.size && <p style={{ color: '#F37021', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Size: {item.size}</p>}
                                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Unit Price: ₹{item.price}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variationId || item.size)} style={{ padding: '0 0.5rem', cursor: 'pointer' }}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variationId || item.size)} style={{ padding: '0 0.5rem', cursor: 'pointer' }}>+</button>
                                </div>
                                <span style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</span>
                                <button onClick={() => removeFromCart(item.productId, item.variationId || item.size)} style={{ color: '#ef4444', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
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
        </div>
    );
}
