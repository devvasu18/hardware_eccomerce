'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Modal from '@/app/components/Modal';
import { useModal } from '@/app/hooks/useModal';

interface Variation {
    type: string;
    value: string;
    price: number;
    stock: number;
    sku?: string;
    mrp?: number;
    image?: string;
    isActive: boolean;
    _id: string;
}

interface Model {
    _id: string;
    name: string;
    mrp?: number;
    selling_price_a?: number;
    featured_image?: string;
    isActive: boolean;
    variations: Variation[];
}

interface Product {
    _id: string;
    title?: string;
    name?: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    isOnDemand: boolean;
    featured_image?: string;
    gallery_images?: string[];
    images?: string[];
    availableSizes?: string[];
    variations?: Variation[];
    models?: Model[];
}

// ... imports
interface ProductActionAreaProps {
    product: Product;
    onVariationSelect?: (variation: Variation | null) => void;
}


export default function ProductActionArea({ product, onVariationSelect }: ProductActionAreaProps) {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const { modalState, hideModal, showSuccess, showError } = useModal();

    // --- Model Selection ---
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);

    // --- Variation State ---
    const [selectedVariations, setSelectedVariations] = useState<{ [key: string]: string }>({});
    const [currentVariation, setCurrentVariation] = useState<Variation | null>(null);

    // Auto-select first model if only one exists or for better UX
    useEffect(() => {
        if (product.models && product.models.length > 0 && !selectedModel) {
            // Optional: don't auto-select to force user choice
            // setSelectedModel(product.models[0]);
        }
    }, [product.models]);

    // Group variations by Type
    const variationGroups = useMemo(() => {
        const sourceVariations = selectedModel ? selectedModel.variations : product.variations;
        if (!sourceVariations) return {};

        const groups: { [key: string]: Variation[] } = {};
        sourceVariations.forEach(v => {
            if (!v.isActive) return;
            if (!groups[v.type]) groups[v.type] = [];
            groups[v.type].push(v);
        });
        return groups;
    }, [selectedModel, product.variations]);

    const hasModels = product.models && product.models.length > 0;
    // Only show variation selector if:
    // 1. A model is selected (it might have variations)
    // 2. OR There are no models at all (show standalone variations)
    const hasVariations = Object.keys(variationGroups).length > 0 && (selectedModel || !hasModels);

    const handleModelSelect = (model: Model) => {
        setSelectedModel(model);
        setSelectedVariations({});
        setCurrentVariation(null);
        if (onVariationSelect) onVariationSelect(null);
    };

    // Handle Selection
    const handleSelect = (type: string, value: string) => {
        const newSelection = { ...selectedVariations, [type]: value };
        setSelectedVariations(newSelection);

        const sourceVariations = selectedModel ? selectedModel.variations : product.variations;
        const match = sourceVariations?.find(v =>
            v.type === type && v.value === value
        );
        if (match) {
            setCurrentVariation(match);
            if (onVariationSelect) onVariationSelect(match);
        }
    };
    // ALSO update on click logic in the map loop


    // --- Price & Stock Logic ---
    const sourceVariationsForPrice = selectedModel ? selectedModel.variations : product.variations;
    const variationPrices = sourceVariationsForPrice?.map(v => v.price) || [];
    const minVarPrice = variationPrices.length > 0 ? Math.min(...variationPrices) : null;

    const basePrice = currentVariation
        ? currentVariation.price
        : (selectedModel?.selling_price_a || product.discountedPrice || product.basePrice || minVarPrice || 0);

    const stock = currentVariation
        ? currentVariation.stock
        : (hasModels && selectedModel ? selectedModel.variations.reduce((acc, v) => acc + (v.stock || 0), 0) : product.stock);

    const isStrictlyOnDemand = product.isOnDemand;

    // Discount Logic
    let finalPrice = basePrice;
    if (user?.wholesaleDiscount && user.wholesaleDiscount > 0) {
        finalPrice = Math.round(basePrice * (1 - user.wholesaleDiscount / 100));
    }

    const isOutOfStock = !isStrictlyOnDemand && stock < 1;
    const isBackorder = !isStrictlyOnDemand && !isOutOfStock && (quantity > stock);

    const handleAddToCart = () => {
        // Validation: Must select model if models exist
        if (hasModels && !selectedModel) {
            showError('Please select a model first.', 'Selection Required');
            return;
        }

        // Validation: Must select variation if variations exist for this model
        if (hasVariations && !currentVariation) {
            showError('Please select an option first.', 'Selection Required');
            return;
        }

        const productName = product.title || product.name || 'Product';
        const variationText = currentVariation ? `${currentVariation.type}: ${currentVariation.value}` : undefined;

        const cartItemName = currentVariation
            ? `${productName} (${currentVariation.value})`
            : productName;

        const productImage = currentVariation?.image ||
            selectedModel?.featured_image ||
            product.featured_image ||
            (product.gallery_images && product.gallery_images.length > 0 ? product.gallery_images[0] : '') ||
            (product.images && product.images.length > 0 ? product.images[0] : '');

        addToCart({
            productId: product._id,
            name: cartItemName,
            price: finalPrice,
            quantity: quantity,
            image: productImage,
            variationId: currentVariation?._id,
            modelId: selectedModel?._id,
            modelName: selectedModel?.name,
            variationText: variationText, // For Tally
            isOnDemand: isStrictlyOnDemand || (stock < quantity)
        });
        showSuccess(`Added ${quantity} x ${cartItemName} to cart!`, 'Added to Cart');
    };

    return (
        <>
            <div className="product-action-section">
                {/* Model Selector */}
                {hasModels && (
                    <div className="variations-container" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <label className="section-label" style={{ display: 'block', marginBottom: '10px', color: '#1a1a1a', fontWeight: 700 }}>CHOOSE MODEL</label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {product.models?.map(m => (
                                <button
                                    key={m._id}
                                    className={`size-btn ${selectedModel?._id === m._id ? 'active' : ''}`}
                                    onClick={() => handleModelSelect(m)}
                                    style={{
                                        padding: '8px 20px',
                                        height: 'auto',
                                        minWidth: '100px',
                                        fontSize: '0.9rem',
                                        fontWeight: selectedModel?._id === m._id ? 700 : 400,
                                        border: selectedModel?._id === m._id ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                        background: selectedModel?._id === m._id ? '#fff' : '#f8fafc',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pricing */}
                <div className="pricing-section">
                    <div className="price-display">
                        {currentVariation && currentVariation.mrp && currentVariation.mrp > finalPrice ? (
                            <>
                                <span className="price-original">₹{currentVariation.mrp}</span>
                                <span className="price-separator">/</span>
                                <span className="price-current">₹{finalPrice}</span>
                            </>
                        ) : (!currentVariation && product.discountedPrice > 0 && product.discountedPrice < product.basePrice) ? (
                            <>
                                {hasVariations && <span style={{ fontSize: '0.9rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Starting from</span>}
                                <span className="price-original">₹{product.basePrice}</span>
                                <span className="price-separator">/</span>
                                <span className="price-current">₹{finalPrice}</span>
                            </>
                        ) : (
                            <>
                                {hasVariations && !currentVariation && <span style={{ fontSize: '0.9rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Starting from</span>}
                                <span className="price-current">₹{finalPrice}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Variation Selector (Flat List Logic) */}
                {hasVariations && (
                    <div className="variations-container">
                        {Object.entries(variationGroups).map(([type, variants]) => (
                            <div key={type} className="size-selector-section">
                                <label className="section-label">{type.toUpperCase()}</label>
                                <div className="size-options" style={{ flexWrap: 'wrap' }}>
                                    {variants.map(v => (
                                        <button
                                            key={v._id}
                                            className={`size-btn ${currentVariation?._id === v._id ? 'active' : ''}`}
                                            onClick={() => handleSelect(type, v.value)}
                                            style={type === 'Color' ? {
                                                backgroundColor: v.value.toLowerCase(), // Simple color assumption
                                                color: ['white', 'black'].includes(v.value.toLowerCase()) ? 'gray' : 'transparent',
                                                border: currentVariation?._id === v._id ? '2px solid black' : '1px solid #ddd',
                                                width: '30px', height: '30px', borderRadius: '50%',
                                                textIndent: '-9999px', overflow: 'hidden'
                                            } : {}}
                                            title={`${v.value} - ₹${v.price}`}
                                        >
                                            {v.value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Legacy Size Selector (Backward Compat) */}
                {!hasVariations && product.availableSizes && product.availableSizes.length > 0 && (
                    <div className="size-selector-section">
                        <p style={{ fontSize: '0.8rem', color: 'orange' }}>Legacy Options (Update Product to use Variations)</p>
                    </div>
                )}


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
                                {!isOutOfStock ? `${stock} in stock` : 'Out of Stock'}
                            </span>
                        </div>
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
