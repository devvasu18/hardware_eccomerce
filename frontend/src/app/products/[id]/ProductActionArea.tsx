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
    availableSizes?: string[]; // Optional size variants
}

export default function ProductActionArea({ product }: { product: Product }) {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('M');
    const [submitting, setSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const { modalState, hideModal, showSuccess, showError } = useModal();

    // Customer Contact for Request (Guest)
    const [contact, setContact] = useState({ name: user?.username || '', mobile: (user as any)?.mobile || '' });

    // Available sizes (from product data or default)
    const sizes = product.availableSizes && product.availableSizes.length > 0
        ? product.availableSizes
        : ['SM', 'M', 'L', 'XL'];

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
            image: product.images && product.images.length > 0 ? product.images[0] : '',
            size: product.availableSizes && product.availableSizes.length > 0 ? selectedSize : undefined
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
            <div className="product-action-section">
                {/* Pricing */}
                <div className="pricing-section">
                    <div className="price-display">
                        {(product.discountedPrice > 0 && product.discountedPrice < product.basePrice) ? (
                            <>
                                <span className="price-original">₹{originalPrice}</span>
                                <span className="price-separator">/</span>
                                <span className="price-current">₹{finalPrice}</span>
                            </>
                        ) : (
                            <span className="price-current">₹{originalPrice}</span>
                        )}
                    </div>
                    {user?.wholesaleDiscount && user.wholesaleDiscount > 0 && (
                        <span className="wholesale-badge">
                            WHOLESALE DISCOUNT: -{user.wholesaleDiscount}%
                        </span>
                    )}
                </div>

                {/* Size Selector - Only show if product has available sizes */}
                {product.availableSizes && product.availableSizes.length > 0 ? (
                    <div className="size-selector-section">
                        <label className="section-label">SIZE</label>
                        <div className="size-options">
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Quantity Selector */}
                <div className="quantity-selector-section">
                    <label className="section-label">QUANTITY</label>
                    <div className="quantity-controls">
                        <button
                            className="qty-btn"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                            -
                        </button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="qty-input"
                        />
                        <button
                            className="qty-btn"
                            onClick={() => setQuantity(quantity + 1)}
                        >
                            +
                        </button>
                    </div>

                    {!isStrictlyOnDemand && (
                        <span className={`stock-badge ${(product.stock > 0 && quantity <= product.stock) ? 'in-stock' : 'out-stock'}`}>
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                        </span>
                    )}

                    {isHybridShift && !isStrictlyOnDemand && (
                        <p className="warning-text">
                            ⚠️ Requesting more than available stock ({product.stock}). This will be processed as a <strong>Special Procurement Request</strong>.
                        </p>
                    )}
                </div>

                {/* Action Button or Form */}
                {isRequestFlow ? (
                    <div className="procurement-form">
                        <h4 className="form-title">Procurement Form</h4>
                        <div className="form-inputs">
                            <input
                                type="text"
                                placeholder="Your Name / Company Name"
                                value={contact.name}
                                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                                className="form-input"
                            />
                            <input
                                type="tel"
                                placeholder="Mobile Number (Required)"
                                value={contact.mobile}
                                onChange={(e) => setContact({ ...contact, mobile: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <button
                            className="btn-submit-request"
                            disabled={!contact.mobile || submitting}
                            onClick={handleCreateRequest}
                        >
                            {submitting ? 'Sending...' : 'Submit Request'}
                        </button>
                        <p className="form-note">We will contact you with a quote and delivery timeline.</p>
                    </div>
                ) : (
                    <button
                        className="btn-add-to-cart"
                        onClick={handleAddToCart}
                    >
                        ADD TO CART
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
