'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Modal from '@/app/components/Modal';
import { useModal } from '@/app/hooks/useModal';

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    const [address, setAddress] = useState(user ? 'Registered Address' : ''); // Ideal world: fetch from user profile
    const [loading, setLoading] = useState(false);
    const [utr, setUtr] = useState('');
    const { modalState, hideModal, showError, showWarning } = useModal();

    if (items.length === 0) {
        router.push('/cart');
        return null;
    }

    const taxAmount = Math.round(cartTotal * 0.18);
    const grandTotal = cartTotal + taxAmount;

    const handlePlaceOrder = async () => {
        if (!utr) {
            showWarning('Please enter UTR Number for payment verification.', 'UTR Required');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                user: user?.id, // If null, backend should reject or handle guest
                items: items.map(i => ({
                    product: i.productId,
                    quantity: i.quantity,
                    priceAtBooking: i.price
                })),
                totalAmount: grandTotal,
                status: 'Order Placed',
                paymentDetails: {
                    utrNumber: utr,
                    method: 'Bank Transfer'
                },
                shippingAddress: address
            };

            const res = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                clearCart();
                const data = await res.json();
                router.push(`/orders/${data._id}`);
            } else {
                showError('Failed to place order. Please try again.');
            }

        } catch (err) {
            console.error(err);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <Header />
            <div className="container" style={{ padding: '4rem 0' }}>
                <h1 style={{ marginBottom: '2rem' }}>Secure Checkout</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>

                    {/* Left: Details */}
                    <div>
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Shipping Information</h3>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter full delivery address..."
                                style={{ width: '100%', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '100px' }}
                            />
                        </div>

                        <div className="card">
                            <h3 style={{ marginBottom: '1rem' }}>Payment (Pre-Paid Only)</h3>
                            <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', border: '1px solid #fcd34d', color: '#92400e' }}>
                                <strong>Bank Transfer Required:</strong><br />
                                Account: Selfmade Industrial Systems<br />
                                IFSC: HDFC0001234<br />
                                Acc No: 50200012345678
                            </div>

                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Enter UTR / Transaction Reference Number</label>
                            <input
                                type="text"
                                value={utr}
                                onChange={(e) => setUtr(e.target.value)}
                                placeholder="e.g. UTR82736481"
                                style={{ width: '100%', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1.1rem' }}
                            />
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div>
                        <div className="card" style={{ position: 'sticky', top: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
                            {items.map(item => (
                                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748B' }}>
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                            <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Taxable Value</span>
                                <span>₹{cartTotal}</span>
                            </div>

                            {/* Dynamic Tax Display */}
                            {address.toLowerCase().includes('gujarat') ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#64748B', fontSize: '0.9rem' }}>
                                        <span>CGST (9%)</span>
                                        <span>₹{Math.round(cartTotal * 0.09)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#64748B', fontSize: '0.9rem' }}>
                                        <span>SGST (9%)</span>
                                        <span>₹{Math.round(cartTotal * 0.09)}</span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#64748B', fontSize: '0.9rem' }}>
                                    <span>IGST (18%)</span>
                                    <span>₹{Math.round(cartTotal * 0.18)}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                <span>Grand Total</span>
                                <span>₹{grandTotal}</span>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading || !utr}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                            >
                                {loading ? 'Processing...' : 'Confirm & Place Order'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <Modal
                isOpen={modalState.isOpen}
                onClose={hideModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
                showCancel={modalState.showCancel}
            />
        </main>
    );
}
