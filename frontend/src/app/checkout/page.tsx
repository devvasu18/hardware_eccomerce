'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/Modal';
import { useModal } from '@/app/hooks/useModal';

export default function CheckoutPage() {
    const { items, clearCart, loading: cartLoading } = useCart();
    const { user, login } = useAuth();
    const router = useRouter();

    // Split items into Available and On-Demand
    const availableItems = useMemo(() => items.filter(i => !i.isOnDemand), [items]);
    const requestItems = useMemo(() => items.filter(i => i.isOnDemand), [items]);

    // Calculate totals only for Available items
    const cartTotal = useMemo(() => availableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0), [availableItems]);

    // Guest customer details
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [orderPlaced, setOrderPlaced] = useState(false);

    const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
    const [newAddress, setNewAddress] = useState({
        street: '',
        landmark: '',
        city: '',
        state: 'Rajasthan',
        pincode: ''
    });

    // Derived state for existing addresses
    const savedAddresses = (user as any)?.savedAddresses || [];

    // Auto-select first address if available
    useEffect(() => {
        if (savedAddresses.length > 0 && selectedAddressId === 'new') {
            // Find default or use first
            const defaultAddr = savedAddresses.find((a: any) => a.isDefault);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr._id);
            } else {
                setSelectedAddressId(savedAddresses[0]._id);
            }
        }
    }, [savedAddresses.length]); // Only run when addresses length changess

    const isNewAddress = selectedAddressId === 'new';

    // Helper to format address
    const formatAddress = (addr: any) => {
        return `${addr.street}, ${addr.landmark}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
    };

    const finalShippingAddress = useMemo(() => {
        if (!isNewAddress) {
            const addr = savedAddresses.find((a: any) => a._id === selectedAddressId);
            return addr ? formatAddress(addr) : '';
        }
        return formatAddress(newAddress);
    }, [selectedAddressId, savedAddresses, newAddress, isNewAddress]);

    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('Online');
    const [loading, setLoading] = useState(false);

    const { modalState, hideModal, showError, showWarning, showSuccess } = useModal();

    // Move duplicate Logic up to respect Hook Rules
    const submitButtonText = useMemo(() => {
        if (loading) return 'Processing...';
        if (availableItems.length > 0 && requestItems.length > 0) return `Place Order & Submit Request`;
        if (availableItems.length > 0) return `Place Order (${paymentMethod})`;
        return 'Submit Request (No Payment Required)';
    }, [loading, availableItems.length, requestItems.length, paymentMethod]);

    useEffect(() => {
        if (!cartLoading && items.length === 0 && !orderPlaced) {
            router.push('/cart');
        }
    }, [items, router, orderPlaced, cartLoading]);

    if (items.length === 0) {
        return null;
    }

    const taxAmount = Math.round(cartTotal * 0.18);
    const grandTotal = cartTotal + taxAmount;

    const handleSaveAddress = async () => {
        if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
            showWarning('Please fill in all required address fields.', 'Address Incomplete');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // We use a separate loading state or just reuse loading? 
            // Better to avoid blocking the whole form, but reuse loading for simplicity or local
            // Let's use a local lock effectively by checking loading
            if (loading) return;

            // Or just allow it.

            const res = await fetch('http://localhost:5000/api/auth/address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...newAddress, isDefault: false })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                if (user) {
                    // Update user context with new addresses
                    const updatedUser = { ...user, savedAddresses: data.savedAddresses };
                    login(token, updatedUser);
                }

                // Select the new address
                const newAddr = data.savedAddresses[data.savedAddresses.length - 1];
                if (newAddr && newAddr._id) {
                    setSelectedAddressId(newAddr._id);
                }

                // Reset form
                setNewAddress({
                    street: '',
                    landmark: '',
                    city: '',
                    state: 'Rajasthan',
                    pincode: ''
                });

                showSuccess('Address saved to your account!');
            } else {
                showError(data.message || 'Failed to save address.');
            }
        } catch (e) {
            console.error(e);
            showError('Failed to save address. Please try again.');
        }
    };

    const handlePlaceOrder = async () => {
        // Validation helpers
        let finalAddressString = '';

        if (isNewAddress) {
            if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
                showWarning('Please fill in all required address fields.', 'Address Incomplete');
                return;
            }
            finalAddressString = formatAddress(newAddress);

            // If user is logged in, save this address
            if (user) {
                try {
                    const token = localStorage.getItem('token');
                    await fetch('http://localhost:5000/api/auth/address', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ ...newAddress, isDefault: savedAddresses.length === 0 })
                    });
                } catch (e) {
                    console.error('Failed to save address', e);
                }
            }
        } else {
            const addr = savedAddresses.find((a: any) => a._id === selectedAddressId);
            if (!addr) {
                showWarning('Please select a valid address.', 'Address Required');
                return;
            }
            finalAddressString = formatAddress(addr);
        }

        if (!user) {
            // Guest checkout validation
            if (!guestName.trim() || !guestPhone.trim()) {
                showWarning('Please provide your name and phone number for order confirmation.', 'Contact Details Required');
                return;
            }
        }

        setLoading(true);
        const results = { orderSuccess: false, requestSuccess: false, orderId: null };

        try {
            const token = localStorage.getItem('token');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const customerContact = user ? undefined : {
                name: guestName,
                phone: guestPhone,
                email: guestEmail,
                address: finalAddressString
            };

            // 1. Process Order (if available items exist)
            if (availableItems.length > 0) {
                const orderData: any = {
                    items: availableItems.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        price: i.price,
                        size: i.size
                    })),
                    shippingAddress: finalAddressString,
                    billingAddress: finalAddressString,
                    paymentMethod,
                    guestCustomer: customerContact
                };

                const resOrder = await fetch('http://localhost:5000/api/orders/create', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(orderData)
                });

                const dataOrder = await resOrder.json();
                if (resOrder.ok && dataOrder.success) {
                    results.orderSuccess = true;
                    results.orderId = dataOrder.orderId;
                } else {
                    throw new Error(dataOrder.message || 'Failed to place order.');
                }
            } else {
                results.orderSuccess = true; // No order to place, so technically "success" for flow
            }

            // 2. Process Requests (if on-demand items exist)
            if (requestItems.length > 0) {
                const requestPromises = requestItems.map(item =>
                    fetch('http://localhost:5000/api/requests', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            productId: item.productId,
                            quantity: item.quantity,
                            customerContact: user ? { name: user.username, mobile: user.mobile } : { name: guestName, mobile: guestPhone }
                        })
                    })
                );

                const requestResponses = await Promise.all(requestPromises);
                const allRequestsOk = requestResponses.every(r => r.ok);
                if (allRequestsOk) results.requestSuccess = true;
            } else {
                results.requestSuccess = true;
            }

            // PayU Integration
            if (results.orderSuccess && paymentMethod === 'Online' && results.orderId) {
                // Get PayU payment parameters from backend
                const payuResponse = await fetch('http://localhost:5000/api/payment/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: grandTotal,
                        orderId: results.orderId,
                        customerName: user?.username || guestName,
                        customerEmail: user?.email || guestEmail,
                        customerPhone: user?.mobile || guestPhone
                    })
                }).then((t) => t.json());

                if (!payuResponse.success) {
                    showError('Failed to initiate payment. Please try again.');
                    setLoading(false);
                    return;
                }

                // Create a form and submit to PayU
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = payuResponse.paymentUrl;

                // Add all PayU parameters as hidden fields
                Object.keys(payuResponse.params).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = payuResponse.params[key];
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();

                // Don't set loading to false as we're redirecting
                return;
            }

            // Normal Success Flow (COD or Request Only)
            if ((availableItems.length === 0 || results.orderSuccess) && (requestItems.length === 0 || results.requestSuccess)) {
                finalizeSuccess(results);
            } else {
                showError('Something went wrong. Please try again.');
                setLoading(false);
            }

        } catch (err: any) {
            console.error('Checkout error:', err);
            showError(err.message || 'Network error. Please check your connection and try again.');
            setLoading(false);
        }
    };

    const finalizeSuccess = (results: any) => {
        setOrderPlaced(true);
        clearCart();

        let successMessage = '';
        if (availableItems.length > 0 && requestItems.length > 0) {
            successMessage = `Order placed successfully! We have also received your quote request for ${requestItems.length} on-demand items.`;
        } else if (availableItems.length > 0) {
            successMessage = `Order placed successfully!`;
        } else {
            successMessage = `Your quote request has been submitted successfully!`;
        }

        showSuccess(
            successMessage,
            'Success',
            {
                onConfirm: () => {
                    if (results.orderId) {
                        router.push(`/orders/${results.orderId}`);
                    } else {
                        router.push('/');
                    }
                }
            }
        );
        setLoading(false);
    };



    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '2rem' }}>
                {availableItems.length > 0 ? 'Secure Checkout' : 'Submit Procurement Request'}
            </h1>

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

                    {/* Address Selection Section */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>{availableItems.length > 0 ? 'Shipping Address' : 'Contact Address'}</h3>

                        {/* Saved Addresses List */}
                        {savedAddresses.length > 0 && (
                            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {savedAddresses.map((addr: any) => (
                                    <label key={addr._id} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '1rem',
                                        padding: '1rem', border: `2px solid ${selectedAddressId === addr._id ? '#F37021' : '#e2e8f0'}`,
                                        borderRadius: '8px', cursor: 'pointer', background: selectedAddressId === addr._id ? '#fff7ed' : 'white'
                                    }}>
                                        <input
                                            type="radio"
                                            name="address"
                                            value={addr._id}
                                            checked={selectedAddressId === addr._id}
                                            onChange={() => setSelectedAddressId(addr._id)}
                                            style={{ marginTop: '0.25rem' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{addr.street}, {addr.city}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748B' }}>
                                                {addr.landmark ? `${addr.landmark}, ` : ''} {addr.state} - {addr.pincode}
                                            </div>
                                        </div>
                                    </label>
                                ))}

                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                                    color: '#F37021', fontWeight: 600, padding: '0.5rem 0'
                                }}>
                                    <input
                                        type="radio"
                                        name="address"
                                        value="new"
                                        checked={selectedAddressId === 'new'}
                                        onChange={() => setSelectedAddressId('new')}
                                    />
                                    <span>+ Add New Address</span>
                                </label>
                            </div>
                        )}

                        {/* New Address Form */}
                        {isNewAddress && (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Pincode *</label>
                                        <input
                                            type="text"
                                            value={newAddress.pincode}
                                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                            placeholder="123456"
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Town / City *</label>
                                        <input
                                            type="text"
                                            value={newAddress.city}
                                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                            placeholder="Ahmedabad"
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Flat, House no., Building, Company, Apartment *</label>
                                    <input
                                        type="text"
                                        value={newAddress.street}
                                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                        placeholder="123, Vasu House"
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Landmark (Optional)</label>
                                        <input
                                            type="text"
                                            value={newAddress.landmark}
                                            onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                                            placeholder="Near City Mall"
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>State *</label>
                                        <input
                                            type="text"
                                            value="Rajasthan"
                                            readOnly
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f1f5f9', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>

                                {user && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={handleSaveAddress}
                                            style={{
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.6rem 1.2rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            Save Address
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment Method - Hidden (Default: Online) */}
                    {availableItems.length > 0 && (
                        <div style={{ display: 'none' }}>
                            <input type="hidden" value={paymentMethod} />
                        </div>
                    )}
                </div>

                {/* Right: Summary */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Summary</h3>

                        {/* Available Items */}
                        {availableItems.length > 0 && (
                            <>
                                <h4 style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items for Purchase</h4>
                                {availableItems.map(item => (
                                    <div key={`${item.productId}-${item.size || 'default'}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#334155' }}>
                                        <span>{item.name} {item.size ? `(${item.size})` : ''} x {item.quantity}</span>
                                        <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>
                            </>
                        )}

                        {/* On-Demand Items */}
                        {requestItems.length > 0 && (
                            <>
                                <h4 style={{ fontSize: '0.9rem', color: '#F37021', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: availableItems.length > 0 ? '1.5rem' : '0' }}>Procurement Request Items</h4>
                                {requestItems.map(item => (
                                    <div key={`${item.productId}-${item.size || 'default'}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748B' }}>
                                        <span>{item.name} {item.size ? `(${item.size})` : ''} x {item.quantity}</span>
                                        <span style={{ fontSize: '0.75rem', background: '#fff7ed', padding: '2px 6px', borderRadius: '4px', color: '#c2410c', border: '1px solid #fdba74' }}>REQUEST ONLY</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>
                            </>
                        )}

                        {/* Totals - Only show if there are available items */}
                        {availableItems.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Subtotal</span>
                                    <span>₹{cartTotal}</span>
                                </div>

                                {/* Dynamic Tax Display */}
                                {finalShippingAddress.toLowerCase().includes('gujarat') ? (
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
                            </>
                        ) : (
                            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748B', fontStyle: 'italic' }}>
                                No payment required for procurement requests. We will provide a quote.
                            </div>
                        )}

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        >
                            {submitButtonText}
                        </button>

                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748B', textAlign: 'center' }}>
                            {availableItems.length > 0
                                ? 'By placing this order, you agree to our terms and conditions'
                                : 'We will contact you within 24 hours with a quote.'}
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
