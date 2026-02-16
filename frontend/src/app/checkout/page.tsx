'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/Modal';
import { useModal } from '@/app/hooks/useModal';
import { FaArrowLeft, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { getSystemSettings } from '@/app/utils/systemSettings';
import Header from '@/app/components/Header';
import './checkout.css';

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi"
];

export default function CheckoutPage() {
    const { items, clearCart, loading: cartLoading } = useCart();
    const { user, login } = useAuth();
    const router = useRouter();

    // Split items into Available and On-Demand
    const availableItems = useMemo(() => items.filter(i => !i.isOnDemand), [items]);
    const requestItems = useMemo(() => items.filter(i => i.isOnDemand), [items]);

    // Calculate totals only for Available items
    const cartTotal = useMemo(() => availableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0), [availableItems]);
    const mrpTotal = useMemo(() => availableItems.reduce((acc, item) => acc + ((item.mrp || item.price) * item.quantity), 0), [availableItems]);
    const totalSavings = mrpTotal - cartTotal;
    const taxAmount = useMemo(() => availableItems.reduce((acc, item) => acc + (item.price * item.quantity * ((item.gst_rate !== undefined ? item.gst_rate : 18) / 100)), 0), [availableItems]);

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
        state: 'Rajasthan', // Default, but selectable
        pincode: ''
    });

    // Derived state for existing addresses
    const savedAddresses = (user as any)?.savedAddresses || [];

    // Auto-select logic with Address Locking
    const lockedAddress = useMemo(() => {
        const approvedItem = availableItems.find(i => i.requestId && i.customerContact?.address);
        return approvedItem?.customerContact?.address;
    }, [availableItems]);

    useEffect(() => {
        // If locked address exists, try to find it in saved addresses or pre-fill new address
        if (lockedAddress) {
            const foundAddr = savedAddresses.find((a: any) => formatAddress(a) === lockedAddress);
            if (foundAddr) {
                setSelectedAddressId(foundAddr._id);
            } else {
                // If not found in saved, we must use it as a "New/Custom" address but read-only
                // We'll parse it or just set it as string? 
                // Since our newAddress form is fields, we might need a "Locked View"
                // For now, let's just warn or handle standard case.
                // Better approach: If lockedAddress matches a saved address, select it.
            }
        } else if (savedAddresses.length > 0 && selectedAddressId === 'new') {
            const defaultAddr = savedAddresses.find((a: any) => a.isDefault);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr._id);
            } else {
                setSelectedAddressId(savedAddresses[0]._id);
            }
        }
    }, [savedAddresses.length, lockedAddress]);

    const isNewAddress = selectedAddressId === 'new';

    // Helper to format address
    const formatAddress = (addr: any) => {
        return `${addr.street}, ${addr.landmark}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
    };

    // Determine the effective state for Tax Calculation
    const effectiveState = useMemo(() => {
        if (!isNewAddress) {
            const addr = savedAddresses.find((a: any) => a._id === selectedAddressId);
            return addr ? addr.state : '';
        }
        return newAddress.state;
    }, [selectedAddressId, savedAddresses, newAddress.state, isNewAddress]);

    const finalShippingAddress = useMemo(() => {
        if (!isNewAddress) {
            const addr = savedAddresses.find((a: any) => a._id === selectedAddressId);
            return addr ? formatAddress(addr) : '';
        }
        return formatAddress(newAddress);
    }, [selectedAddressId, savedAddresses, newAddress, isNewAddress]);

    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('Online');
    const [paymentSettings, setPaymentSettings] = useState({ onlinePaymentEnabled: true, codEnabled: false });
    const [loading, setLoading] = useState(false);

    // Coupon State
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponDiscount, setCouponDiscount] = useState(0);

    const grandTotal = Math.round(cartTotal + taxAmount - couponDiscount);

    const { modalState, hideModal, showError, showWarning, showSuccess } = useModal();

    useEffect(() => {
        const fetchPaymentSettings = async () => {
            const settings = await getSystemSettings();
            setPaymentSettings({
                onlinePaymentEnabled: settings.onlinePaymentEnabled,
                codEnabled: settings.codEnabled
            });

            // Handle default selection and restrictions
            if (!settings.onlinePaymentEnabled && settings.codEnabled) {
                setPaymentMethod('COD');
            } else if (settings.onlinePaymentEnabled && !settings.codEnabled) {
                setPaymentMethod('Online');
            } else if (!settings.onlinePaymentEnabled && !settings.codEnabled) {
                // If both disabled, maybe allow Online as fallback or show error
                // For now, keep as is but UI will handle it
            }
        };
        fetchPaymentSettings();
    }, []);

    const submitButtonText = useMemo(() => {
        if (loading) return 'Processing...';
        if (availableItems.length > 0 && requestItems.length > 0) return `Place Order & Submit Request`;
        if (availableItems.length > 0) {
            if (!paymentSettings.onlinePaymentEnabled && !paymentSettings.codEnabled) return 'Payment Methods Unavailable';
            return `Place Order (${paymentMethod})`;
        }
        return 'Submit Request (No Payment Required)';
    }, [loading, availableItems.length, requestItems.length, paymentMethod, paymentSettings]);

    useEffect(() => {
        if (!cartLoading && items.length === 0 && !orderPlaced) {
            router.push('/cart');
        }
    }, [items, router, orderPlaced, cartLoading]);

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;

        try {
            const res = await fetch('http://localhost:5000/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponInput, cartTotal })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setAppliedCoupon(data.coupon);
                setCouponDiscount(data.discountAmount);
                showSuccess(`Coupon "${data.coupon.code}" applied! You saved ₹${data.discountAmount}.`);
            } else {
                showError(data.message || 'Invalid coupon code');
                setAppliedCoupon(null);
                setCouponDiscount(0);
            }
        } catch (e) {
            console.error(e);
            showError('Failed to validate coupon');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponInput('');
    };


    if (items.length === 0 && !orderPlaced) {
        return null;
    }

    // SHOP LOCATION ASSUMPTION: GUJARAT (Based on previous logic where 'Gujarat' triggered SGST)
    const SHOP_STATE = 'Gujarat';
    const isIntraState = effectiveState?.toLowerCase() === SHOP_STATE.toLowerCase();

    const handleSaveAddress = async () => {
        if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
            showWarning('Please fill in all required address fields.', 'Address Incomplete');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            if (loading) return;

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
                    const updatedUser = { ...user, savedAddresses: data.savedAddresses };
                    login(token, updatedUser);
                }

                const newAddr = data.savedAddresses[data.savedAddresses.length - 1];
                if (newAddr && newAddr._id) {
                    setSelectedAddressId(newAddr._id);
                }

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
        let finalAddressString = '';

        if (lockedAddress) {
            finalAddressString = lockedAddress;
        } else if (isNewAddress) {
            if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
                showWarning('Please fill in all required address fields.', 'Address Incomplete');
                return;
            }
            finalAddressString = formatAddress(newAddress);

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

            // 1. Process Order
            if (availableItems.length > 0) {
                const orderData: any = {
                    items: availableItems.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        size: i.size,
                        variationId: i.variationId,
                        variationText: i.variationText,
                        modelId: i.modelId,
                        modelName: i.modelName
                    })),
                    shippingAddress: finalAddressString,
                    billingAddress: finalAddressString,
                    paymentMethod,
                    guestCustomer: customerContact,
                    couponCode: appliedCoupon?.code
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
                results.orderSuccess = true;
            }

            // 2. Process Requests
            if (requestItems.length > 0) {
                const requestPromises = requestItems.map(item =>
                    fetch('http://localhost:5000/api/requests', {
                        method: 'POST',
                        headers, // Use headers with Auth token
                        body: JSON.stringify({
                            productId: item.productId,
                            quantity: item.quantity,
                            modelId: item.modelId,
                            variationId: item.variationId,
                            declaredBasePrice: item.price,
                            customerContact: {
                                name: user ? user.username : guestName,
                                mobile: user ? user.mobile : guestPhone,
                                address: finalAddressString
                            }
                        })
                    })
                );

                const requestResponses = await Promise.all(requestPromises);
                if (requestResponses.every(r => r.ok)) results.requestSuccess = true;
            } else {
                results.requestSuccess = true;
            }

            // PayU Integration
            if (results.orderSuccess && paymentMethod === 'Online' && results.orderId) {
                const payuResponse = await fetch('http://localhost:5000/api/payment/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, // Pass token for opt auth
                    body: JSON.stringify({
                        amount: grandTotal,
                        orderId: results.orderId
                    })
                }).then((t) => t.json());

                if (!payuResponse.success) {
                    showError('Failed to initiate payment. Please try again.');
                    setLoading(false);
                    return;
                }

                if (payuResponse.bypass) {
                    // Manual Bypass for Testing
                    router.push(`/payment/success?status=success&udf1=${results.orderId}&bypass=true`);
                    return;
                }

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = payuResponse.paymentUrl;

                Object.keys(payuResponse.params).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = payuResponse.params[key];
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
                return;
            }

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
        <>
            <Header />
            <div className="container checkout-container">
                <button onClick={() => router.back()} className="back-btn">
                    <FaArrowLeft /> Back
                </button>
                <h1 className="checkout-title">
                    {availableItems.length > 0 ? 'Secure Checkout' : 'Submit Procurement Request'}
                </h1>

                <div className="checkout-grid">

                    {/* Left: Details */}
                    <div>
                        {/* Guest Customer Details */}
                        {!user && (
                            <div className="card checkout-section">
                                <h3 className="section-title">Contact Information</h3>
                                <div className="form-group">
                                    <label className="form-label">
                                        Full Name <span className="form-asterisk">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Phone Number <span className="form-asterisk">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        placeholder="Enter your phone number"
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Address Selection Section */}
                        <div className="card checkout-section">
                            <h3 className="section-title">{availableItems.length > 0 ? 'Shipping Address' : 'Contact Address'}</h3>

                            {lockedAddress ? (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
                                    <p className="text-sm font-semibold text-blue-800 mb-1">
                                        Address Locked for Approved Limit
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        Your order contains an approved On-Demand request which is tied to the following address:
                                    </p>
                                    <div className="mt-2 p-3 bg-white border border-blue-100 rounded text-gray-800 font-medium">
                                        {lockedAddress}
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2">
                                        To ship to a different address, please remove the approved On-Demand item from your cart.
                                    </p>
                                </div>
                            ) : (null)}

                            {/* Saved Addresses List */}
                            {!lockedAddress && savedAddresses.length > 0 && (
                                <div className="address-list">
                                    {savedAddresses.map((addr: any) => (
                                        <label key={addr._id} className={`address-card ${selectedAddressId === addr._id ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="address"
                                                value={addr._id}
                                                checked={selectedAddressId === addr._id}
                                                onChange={() => setSelectedAddressId(addr._id)}
                                                style={{ marginTop: '0.25rem' }}
                                            />
                                            <div>
                                                <div className="address-street">{addr.street}, {addr.city}</div>
                                                <div className="address-meta">
                                                    {addr.landmark ? `${addr.landmark}, ` : ''} {addr.state} - {addr.pincode}
                                                </div>
                                            </div>
                                        </label>
                                    ))}

                                    <label className="add-new-address-label">
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
                            {!lockedAddress && isNewAddress && (
                                <div className="grid-gap-1">
                                    <div className="address-grid">
                                        <div>
                                            <label className="form-label">Pincode <span className="form-asterisk">*</span></label>
                                            <input
                                                type="text"
                                                value={newAddress.pincode}
                                                onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                                placeholder="123456"
                                                className="form-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Town / City <span className="form-asterisk">*</span></label>
                                            <input
                                                type="text"
                                                value={newAddress.city}
                                                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                placeholder="Ahmedabad"
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Street Address <span className="form-asterisk">*</span></label>
                                        <input
                                            type="text"
                                            value={newAddress.street}
                                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                            placeholder="123, Vasu House"
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="address-grid">
                                        <div>
                                            <label className="form-label">Landmark (Optional)</label>
                                            <input
                                                type="text"
                                                value={newAddress.landmark}
                                                onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                                                placeholder="Near City Mall"
                                                className="form-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">State <span className="form-asterisk">*</span></label>
                                            <select
                                                value={newAddress.state}
                                                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                                className="form-input"
                                                style={{ backgroundColor: 'white' }}
                                            >
                                                {INDIAN_STATES.map(st => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {user && (
                                        <div className="save-btn-container">
                                            <button
                                                type="button"
                                                onClick={handleSaveAddress}
                                                className="save-address-btn"
                                            >
                                                Save Address
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Method - Dynamic Selection */}
                        {availableItems.length > 0 && (paymentSettings.onlinePaymentEnabled || paymentSettings.codEnabled) && (
                            <div className="card checkout-section">
                                <h3 className="section-title">Payment Method</h3>

                                <div className="payment-options">
                                    {paymentSettings.onlinePaymentEnabled && (
                                        <label className={`payment-card ${paymentMethod === 'Online' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="Online"
                                                checked={paymentMethod === 'Online'}
                                                onChange={() => setPaymentMethod('Online')}
                                            />
                                            <div className="payment-icon">
                                                <FaCreditCard size={20} />
                                            </div>
                                            <div className="payment-info">
                                                <div className="payment-name">Online Payment</div>
                                                <div className="payment-desc">Pay securely via Cards, UPI, or NetBanking</div>
                                            </div>
                                        </label>
                                    )}

                                    {paymentSettings.codEnabled && (
                                        <label className={`payment-card ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="COD"
                                                checked={paymentMethod === 'COD'}
                                                onChange={() => setPaymentMethod('COD')}
                                            />
                                            <div className="payment-icon">
                                                <FaMoneyBillWave size={20} />
                                            </div>
                                            <div className="payment-info">
                                                <div className="payment-name">Cash on Delivery (COD)</div>
                                                <div className="payment-desc">Pay when you receive your order</div>
                                            </div>
                                        </label>
                                    )}
                                </div>

                                {!paymentSettings.onlinePaymentEnabled && !paymentSettings.codEnabled && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                        No payment methods are currently available. Please contact support.
                                    </div>
                                )}
                            </div>
                        )}

                        {availableItems.length > 0 && !paymentSettings.onlinePaymentEnabled && !paymentSettings.codEnabled && (
                            <div className="hidden">
                                <input type="hidden" value={paymentMethod} />
                            </div>
                        )}
                    </div>

                    {/* Right: Summary */}
                    <div>
                        <div className="card summary-sticky">
                            <h3 className="section-title">Summary</h3>

                            {/* Available Items */}
                            {availableItems.length > 0 && (
                                <>
                                    <h4 className="summary-header">Items for Purchase</h4>
                                    {availableItems.map(item => (
                                        <div key={`${item.productId}-${item.size || 'default'}`} className="summary-item">
                                            <span>{item.name} {item.size ? `(${item.size})` : ''} x {item.quantity}</span>
                                            <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                    <div className="summary-divider"></div>
                                </>
                            )}

                            {/* On-Demand Items */}
                            {requestItems.length > 0 && (
                                <>
                                    <h4 className={`summary-header ${availableItems.length > 0 ? 'mt-1-5' : 'mt-0'}`}>Procurement Request Items</h4>
                                    {requestItems.map(item => (
                                        <div key={`${item.productId}-${item.size || 'default'}`} className="summary-item text-request">
                                            <span>{item.name} {item.size ? `(${item.size})` : ''} x {item.quantity}</span>
                                            <span className="request-tag">REQUEST ONLY</span>
                                        </div>
                                    ))}
                                    <div className="summary-divider"></div>
                                </>
                            )}

                            {/* Totals - Only show if there are available items */}
                            {availableItems.length > 0 ? (
                                <>
                                    <div className="summary-row">
                                        <span>Subtotal (MRP)</span>
                                        <span style={{ textDecoration: totalSavings > 0 ? 'line-through' : 'none', color: totalSavings > 0 ? '#666' : 'inherit' }}>₹{mrpTotal}</span>
                                    </div>

                                    {totalSavings > 0 && (
                                        <div className="summary-row text-success" style={{ fontWeight: 600, color: '#2e7d32' }}>
                                            <span>Total Savings</span>
                                            <span>-₹{totalSavings}</span>
                                        </div>
                                    )}

                                    <div className="summary-row" style={{ marginTop: '0.25rem' }}>
                                        <span>Selling Price</span>
                                        <span>₹{cartTotal}</span>
                                    </div>

                                    {/* Dynamic Tax Display */}
                                    {isIntraState ? (
                                        <>
                                            <div className="tax-row">
                                                <span>CGST (Total)</span>
                                                <span>₹{Math.round(taxAmount / 2)}</span>
                                            </div>
                                            <div className="tax-row mb-1">
                                                <span>SGST (Total)</span>
                                                <span>₹{Math.round(taxAmount / 2)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="tax-row mb-1">
                                            <span>IGST (Total)</span>
                                            <span>₹{Math.round(taxAmount)}</span>
                                        </div>
                                    )}

                                    {/* Coupon Section */}
                                    <div className="summary-divider"></div>
                                    {!appliedCoupon ? (
                                        <div className="coupon-apply-box">
                                            <input
                                                type="text"
                                                value={couponInput}
                                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                placeholder="ENTER COUPON CODE"
                                                className="coupon-input"
                                            />
                                            <button onClick={handleApplyCoupon} className="coupon-apply-btn">Apply</button>
                                        </div>
                                    ) : (
                                        <div className="applied-coupon-box">
                                            <div className="flex justify-between items-center w-full">
                                                <div>
                                                    <div className="coupon-code-badge">{appliedCoupon.code}</div>
                                                    <div className="coupon-desc-text">{appliedCoupon.description}</div>
                                                </div>
                                                <button onClick={handleRemoveCoupon} className="coupon-remove-btn">Remove</button>
                                            </div>
                                            <div className="summary-row text-success mt-2" style={{ fontWeight: 600 }}>
                                                <span>Coupon Discount</span>
                                                <span>-₹{couponDiscount}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grand-total">
                                        <span>Grand Total</span>
                                        <span>₹{grandTotal}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-muted-italic">
                                    No payment required for ON-DEMAND items. We will contact you within 24 hours.
                                </div>
                            )}

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading || (availableItems.length > 0 && !paymentSettings.onlinePaymentEnabled && !paymentSettings.codEnabled)}
                                className="btn btn-primary submit-btn"
                            >
                                {submitButtonText}
                            </button>

                            <p className="terms-text">
                                {availableItems.length > 0
                                    ? 'By placing this order, you agree to our terms and conditions'
                                    : 'For more information about ON-DEMAND items, please contact us on 9876543210.'}
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

                {/* Loading Overlay */}
                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <p style={{ color: 'white', marginTop: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>
                            {paymentMethod === 'Online' && availableItems.length > 0
                                ? 'Redirecting to Secure Payment Gateway...'
                                : 'Processing your Request...'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
