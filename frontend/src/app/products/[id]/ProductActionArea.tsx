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
    // Out of Stock if NOT on-demand AND stock < 1
    const isOutOfStock = !isStrictlyOnDemand && product.stock < 1;
    // Backorder if NOT on-demand, NOT out of stock, but quantity > stock
    const isBackorder = !isStrictlyOnDemand && !isOutOfStock && (quantity > product.stock);

    // Pricing Logic
    const originalPrice = product.basePrice;
    const sellingPrice = product.discountedPrice || product.basePrice;

    let finalPrice = sellingPrice;
    if (user?.wholesaleDiscount && user.wholesaleDiscount > 0) {
        finalPrice = Math.round(sellingPrice * (1 - user.wholesaleDiscount / 100));
    }

    const handleAddToCart = () => {
        addToCart({
            productId: product._id,
            name: product.name,
            price: finalPrice,
            quantity: quantity,
            image: product.images && product.images.length > 0 ? product.images[0] : '',
            size: product.availableSizes && product.availableSizes.length > 0 ? selectedSize : undefined,
            isOnDemand: product.isOnDemand || (product.stock < quantity) // Consider it on-demand for cart purposes if checking strictly or backorder? Actually simpler: just pass product.isOnDemand. The backend/cart logic handles overrides if needed.
            // Wait, the user requirement for checkout implies we need to distinguishing.
            // "if a customer adds two available items and one on-demand item..."
            // The backorder case (ordering 5 when stock is 2) was called "Special Procurement Request" in text, so it should probably be treated as onDemand too? 
            // The prompt says "Items that are checked as On-Demand ... should not show Out of Stock".
            // Let's stick to product.isOnDemand for now, unless the user specific request for 'quantity > stock' to be split. 
            // "Requesting more than available stock... processed as Special Procurement Request". 
            // So yes, if backorder, treat as onDemand for checkout separation.
        });
        showSuccess(`Successfully added ${quantity} ${quantity === 1 ? 'item' : 'items'} to your cart!`, 'Added to Cart');
    };

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
                    {(user?.wholesaleDiscount || 0) > 0 && (
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
                            disabled={isOutOfStock}
                        >
                            -
                        </button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="qty-input"
                            disabled={isOutOfStock}
                        />
                        <button
                            className="qty-btn"
                            onClick={() => setQuantity(quantity + 1)}
                            disabled={isOutOfStock}
                        >
                            +
                        </button>
                    </div>

                    {!isStrictlyOnDemand && (
                        <div className="stock-info">
                            <span className={`stock-badge ${!isOutOfStock ? 'in-stock' : 'out-stock'}`}>
                                {!isOutOfStock ? `${product.stock} in stock` : 'Out of Stock'}
                            </span>
                        </div>
                    )}

                    {isBackorder && !isStrictlyOnDemand && (
                        <p className="warning-text">
                            ⚠️ Ordering more than available stock ({product.stock}). The excess ({quantity - product.stock}) will be backordered.
                        </p>
                    )}

                    {isStrictlyOnDemand && (
                        <p className="info-text" style={{ color: '#F37021', fontWeight: 600, marginTop: '0.5rem' }}>
                            ℹ️ This is an On-Demand item. It will be added to your procurement request list.
                        </p>
                    )}
                </div>

                {/* Action Button */}
                <button
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                    {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                </button>
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
