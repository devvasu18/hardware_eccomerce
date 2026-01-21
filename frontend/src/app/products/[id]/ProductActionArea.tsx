'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Modal from '@/app/components/Modal';
import { useModal } from '@/app/hooks/useModal';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    isOnDemand: boolean;
    images: string[];
}

export default function ProductActionArea({ product }: { product: Product }) {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const { modalState, hideModal, showSuccess, showError } = useModal();

    // Customer Contact for Request (Guest)
    const [contact, setContact] = useState({ name: user?.username || '', mobile: (user as any)?.mobile || '' });

    // Logic: 
    const isStrictlyOnDemand = product.isOnDemand;
    const isHybridShift = !isStrictlyOnDemand && (quantity > product.stock);
    const isRequestFlow = isStrictlyOnDemand || isHybridShift;

    // Pricing Logic
    // Pricing Logic
    const originalPrice = product.basePrice;
    const sellingPrice = product.discountedPrice || product.basePrice;

    let finalPrice = sellingPrice;
    const isWholesale = user?.customerType === 'wholesale';
    // Also support legacy special types if they have discount set? For now strictly follow wholesale instruction or use generic discount check
    if (user?.wholesaleDiscount && user.wholesaleDiscount > 0) {
        // Apply discount for any user with a discount set (Wholesale primarily)
        finalPrice = Math.round(sellingPrice * (1 - user.wholesaleDiscount / 100));
    }

    const savings = originalPrice - finalPrice;

    const handleCreateRequest = async () => {
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    quantity: quantity,
                    customerContact: contact
                })
            });
            if (res.ok) setRequestSent(true);
            else showError('Failed to submit request. Please try again.');
        } catch (e) {
            showError('Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddToCart = () => {
        addToCart({
            productId: product._id,
            name: product.name,
            price: finalPrice,
            quantity: quantity,
            image: product.images && product.images.length > 0 ? product.images[0] : ''
        });
        showSuccess(`Successfully added ${quantity} ${quantity === 1 ? 'item' : 'items'} to your cart!`, 'Added to Cart');
    };

    if (requestSent) {
        return (
            <div style={{ background: '#ecfdf5', padding: '1.5rem', borderRadius: '8px', border: '1px solid #10b981', color: '#064e3b' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Request Submitted!</h3>
                <p>Your procurement request for <strong>{quantity} units</strong> has been sent to our admin team. We will call you at {contact.mobile} explicitly.</p>
                <button onClick={() => setRequestSent(false)} style={{ marginTop: '1rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}>Make another request</button>
            </div>
        )
    }

    return (
        <>
            <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                            {(product.discountedPrice > 0 && product.discountedPrice < product.basePrice) && (
                                <span style={{ textDecoration: 'line-through', color: '#dc2626', fontSize: '1.2rem', fontWeight: 600 }}>₹{originalPrice}</span>
                            )}
                            <h2 style={{ fontSize: '2rem', color: '#1E293B' }}>₹{finalPrice} <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: 'normal' }}>/ unit</span></h2>
                        </div>
                        {user?.wholesaleDiscount && user.wholesaleDiscount > 0 && (
                            <span className="badge badge-sale" style={{ width: 'fit-content' }}>
                                WHOLESALE DISCOUNT: -{user.wholesaleDiscount}%
                            </span>
                        )}
                    </div>

                    {!isStrictlyOnDemand && (
                        <span className={(product.stock > 0 && quantity <= product.stock) ? 'badge badge-new' : 'badge badge-sale'} style={{ alignSelf: 'center' }}>
                            {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                        </span>
                    )}
                </div>

                {/* Quantity Input */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Quantity Required</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            style={{ width: '40px', height: '40px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
                        >-</button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '80px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1.1rem' }}
                        />
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            style={{ width: '40px', height: '40px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
                        >+</button>
                    </div>

                    {isHybridShift && !isStrictlyOnDemand && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#dc2626' }}>
                            ⚠️ You are requesting more than available stock ({product.stock}). This order will be processed as a <strong>Special Procurement Request</strong>.
                        </p>
                    )}
                </div>

                {/* Form or Button */}
                {isRequestFlow ? (
                    <div style={{ background: '#fff7ed', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fdba74' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#9a3412' }}>Procurement Form</h4>
                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Your Name / Company Name"
                                value={contact.name}
                                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                            />
                            <input
                                type="tel"
                                placeholder="Mobile Number (Required)"
                                value={contact.mobile}
                                onChange={(e) => setContact({ ...contact, mobile: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', background: '#ea580c' }}
                            disabled={!contact.mobile || submitting}
                            onClick={handleCreateRequest}
                        >
                            {submitting ? 'Sending...' : 'Submit Request'}
                        </button>
                        <p style={{ fontSize: '0.8rem', color: '#9a3412', marginTop: '0.5rem', textAlign: 'center' }}>We will contact you with a quote and delivery timeline.</p>
                    </div>
                ) : (
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        onClick={handleAddToCart}
                    >
                        Add to Cart - ₹{finalPrice * quantity}
                    </button>
                )}

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
        </>
    );
}
