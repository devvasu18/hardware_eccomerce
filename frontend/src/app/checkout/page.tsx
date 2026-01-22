'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/Modal';
import { useModal } from '@/app/hooks/useModal';

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    // Guest customer details
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestEmail, setGuestEmail] = useState('');

    const [shippingAddress, setShippingAddress] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [useSameAddress, setUseSameAddress] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
    const [loading, setLoading] = useState(false);

    const { modalState, hideModal, showError, showWarning, showSuccess } = useModal();

    if (items.length === 0) {
        router.push('/cart');
        return null;
    }

    const taxAmount = Math.round(cartTotal * 0.18);
    const grandTotal = cartTotal + taxAmount;

    const handlePlaceOrder = async () => {
        // Validation
        if (!shippingAddress.trim()) {
            showWarning('Please enter your shipping address.', 'Address Required');
            return;
        }

        if (!user) {
            // Guest checkout validation
            if (!guestName.trim() || !guestPhone.trim()) {
                showWarning('Please provide your name and phone number for order confirmation.', 'Contact Details Required');
                return;
            }
        }

        setLoading(true);
        try {
            const orderData: any = {
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    price: i.price,
                    size: i.size
                })),
                shippingAddress,
                billingAddress: useSameAddress ? shippingAddress : billingAddress,
                paymentMethod
            };

            // Add guest customer details if not logged in
            if (!user) {
                orderData.guestCustomer = {
                    name: guestName,
                    phone: guestPhone,
                    email: guestEmail,
                    address: shippingAddress
                };
            }

            const token = localStorage.getItem('token');
            const headers: any = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('http://localhost:5000/api/orders/create', {
                method: 'POST',
                headers,
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                clearCart();
                showSuccess(
                    `Order #${data.invoiceNumber} placed successfully! ${!user ? 'We will contact you at ' + guestPhone : ''}`,
                    'Order Confirmed',
                    () => {
                        router.push(`/orders/${data.orderId}`);
                    }
                );
            } else {
                showError(data.message || 'Failed to place order. Please try again.');
            }

        } catch (err) {
            console.error('Order error:', err);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '2rem' }}>Secure Checkout</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>

                {/* Left: Details */}
                <div>
                    {/* Guest Customer Details */}
                    {!user && (
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Contact Information</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="Enter your full name"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Phone Number <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                    placeholder="Enter your phone number"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Shipping Information */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Shipping Address</h3>
                        <textarea
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Enter full delivery address with pincode..."
                            style={{ width: '100%', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '100px' }}
                        />

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={useSameAddress}
                                    onChange={(e) => setUseSameAddress(e.target.checked)}
                                />
                                <span>Billing address same as shipping</span>
                            </label>
                        </div>

                        {!useSameAddress && (
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Billing Address
                                </label>
                                <textarea
                                    value={billingAddress}
                                    onChange={(e) => setBillingAddress(e.target.value)}
                                    placeholder="Enter billing address..."
                                    style={{ width: '100%', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '80px' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Payment Method</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                border: `2px solid ${paymentMethod === 'COD' ? '#F37021' : '#e2e8f0'}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: paymentMethod === 'COD' ? '#fff7ed' : 'white'
                            }}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={() => setPaymentMethod('COD')}
                                />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Cash on Delivery</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Pay when you receive the order</div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                border: `2px solid ${paymentMethod === 'Online' ? '#F37021' : '#e2e8f0'}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: paymentMethod === 'Online' ? '#fff7ed' : 'white'
                            }}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="Online"
                                    checked={paymentMethod === 'Online'}
                                    onChange={() => setPaymentMethod('Online')}
                                />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Online Payment</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>UPI / Card / Net Banking</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right: Summary */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>

                        {items.map(item => (
                            <div key={`${item.productId}-${item.size || 'default'}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748B' }}>
                                <span>{item.name} {item.size ? `(${item.size})` : ''} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                            </div>
                        ))}

                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Subtotal</span>
                            <span>₹{cartTotal}</span>
                        </div>

                        {/* Dynamic Tax Display */}
                        {shippingAddress.toLowerCase().includes('gujarat') ? (
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
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        >
                            {loading ? 'Processing...' : `Place Order (${paymentMethod})`}
                        </button>

                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748B', textAlign: 'center' }}>
                            By placing this order, you agree to our terms and conditions
                        </p>
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
        </div>
    );
}
