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
    mrp?: number;
}

// ... imports
interface ProductActionAreaProps {
    product: Product;
    onVariationSelect?: (variation: Variation | null, model: Model | null, isAutoSelect?: boolean) => void;
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

    // Auto-select lowest price model/variation
    useEffect(() => {
        // If selection already exists, do nothing (preserves user selection if they navigate back/forth or something, though on mount it's usually null)
        if (selectedModel || currentVariation) return;

        let bestPrice = Infinity;
        let bestModel: Model | null = null;
        let bestVar: Variation | null = null;

        const hasModelsLocal = product.models && product.models.length > 0;

        if (hasModelsLocal) {
            product.models?.forEach(m => {
                if (m.isActive === false) return;

                // If model has variations, we usually MUST pick a variation. 
                // So we check variations.
                // If model has NO variations, we check model base price.
                const mVars = m.variations?.filter(v => v.isActive !== false) || [];

                if (mVars.length > 0) {
                    mVars.forEach(v => {
                        if (v.price && v.price < bestPrice) {
                            bestPrice = v.price;
                            bestModel = m;
                            bestVar = v;
                        }
                    });
                } else {
                    // Start checking model base price if no variations
                    if (m.selling_price_a && m.selling_price_a < bestPrice) {
                        bestPrice = m.selling_price_a;
                        bestModel = m;
                        bestVar = null;
                    }
                }
            });
        } else {
            // No models, check global variations
            const pVars = product.variations?.filter(v => v.isActive !== false) || [];
            pVars.forEach(v => {
                if (v.price && v.price < bestPrice) {
                    bestPrice = v.price;
                    bestVar = v;
                }
            });
        }

        // Apply Selection
        if (bestPrice !== Infinity) {
            if (bestModel) {
                setSelectedModel(bestModel);
            }
            if (bestVar) {
                setCurrentVariation(bestVar);
                setSelectedVariations({ [bestVar.type]: bestVar.value });
                if (onVariationSelect) onVariationSelect(bestVar, bestModel, true);
            } else if (bestModel) {
                // Model selected, no variation (standalone model)
                setCurrentVariation(null);
                setSelectedVariations({});
                if (onVariationSelect) onVariationSelect(null, bestModel, true);
            }
        }

    }, [product]);

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

        // Auto-select lowest priced variation in the selected model
        let bestVar: Variation | null = null;
        let minPrice = Infinity;

        // Filter active variations
        const activeVariations = model.variations?.filter(v => v.isActive !== false) || [];

        if (activeVariations.length > 0) {
            activeVariations.forEach(v => {
                if (v.price < minPrice) {
                    minPrice = v.price;
                    bestVar = v;
                }
            });
        }

        if (bestVar) {
            setCurrentVariation(bestVar);
            setSelectedVariations({ [bestVar.type]: bestVar.value });
            if (onVariationSelect) onVariationSelect(bestVar, model, false);
        } else {
            // If no variations, clear selection
            setSelectedVariations({});
            setCurrentVariation(null);
            if (onVariationSelect) onVariationSelect(null, model, false);
        }
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
            if (onVariationSelect) onVariationSelect(match, selectedModel, false);
        }
    };
    // ALSO update on click logic in the map loop


    // --- Price & Stock Logic ---
    const sourceVariationsForPrice = selectedModel ? selectedModel.variations : product.variations;
    const variationPrices = sourceVariationsForPrice?.map(v => v.price) || [];
    const minVarPrice = variationPrices.length > 0 ? Math.min(...variationPrices) : null;

    // Calculate minimum price globally across all models (for default display)
    const minModelPrice = useMemo(() => {
        if (!product.models || product.models.length === 0) return null;
        const allPrices: number[] = [];
        product.models.forEach(m => {
            if (m.isActive === false) return;
            if (m.selling_price_a && m.selling_price_a > 0) allPrices.push(m.selling_price_a);
            if (m.variations) {
                m.variations.forEach(v => {
                    if (v.isActive === false) return;
                    if (v.price && v.price > 0) allPrices.push(v.price);
                });
            }
        });
        return allPrices.length > 0 ? Math.min(...allPrices) : null;
    }, [product.models]);

    // Calculate default MRP for the starting price
    const defaultDisplayMRP = useMemo(() => {
        if (!minModelPrice) return null;

        let foundMrp: number | null = null;

        // Check variations first (if standalone)
        const matchingVar = product.variations?.find(v => v.price === minModelPrice && v.isActive !== false);
        if (matchingVar && matchingVar.mrp) {
            return matchingVar.mrp;
        }

        // Check models
        if (product.models) {
            const matchingModel = product.models.find(m => {
                if (m.isActive === false) return false;
                // check model base price
                if (m.selling_price_a === minModelPrice) return true;
                // check model variations
                return m.variations?.some(v => v.isActive !== false && v.price === minModelPrice);
            });

            if (matchingModel) {
                const matchingModelVar = matchingModel.variations?.find(v => v.isActive !== false && v.price === minModelPrice);
                if (matchingModelVar && matchingModelVar.mrp) {
                    return matchingModelVar.mrp;
                } else if (matchingModel.mrp) {
                    return matchingModel.mrp;
                }
            }
        }
        return null;
    }, [minModelPrice, product.models, product.variations]);

    const basePrice = currentVariation
        ? currentVariation.price
        : (selectedModel
            ? (selectedModel.selling_price_a || minVarPrice || 0)
            : (product.discountedPrice || product.basePrice || minVarPrice || minModelPrice || 0));

    const stock = currentVariation
        ? currentVariation.stock
        : (hasModels && selectedModel ? selectedModel.variations.reduce((acc, v) => acc + (v.stock || 0), 0) : product.stock);

    const isStrictlyOnDemand = product.isOnDemand;

    // Discount Logic
    let finalPrice = basePrice;
    if (user?.wholesaleDiscount && user.wholesaleDiscount > 0) {
        finalPrice = Math.round(basePrice * (1 - user.wholesaleDiscount / 100));
    }

    // Calculate Effective MRP for Display
    let effectiveMRP: number | null | undefined = null;

    if (currentVariation) {
        // Heuristic: If variation price matches model price, prefer model MRP 
        // This fixes issues where variations have default/incorrect MRPs (like the lowest variant's MRP)
        const modelPrice = selectedModel?.selling_price_a;
        const variationPrice = currentVariation.price;
        const variationMatchesModelPrice = modelPrice !== undefined && Math.abs(variationPrice - modelPrice) < 0.01;

        if (variationMatchesModelPrice && selectedModel && selectedModel.mrp && selectedModel.mrp > 0) {
            effectiveMRP = selectedModel.mrp;
        } else if (currentVariation.mrp && currentVariation.mrp > 0) {
            effectiveMRP = currentVariation.mrp;
        } else if (selectedModel && selectedModel.mrp && selectedModel.mrp > 0) {
            // Fallback to model MRP if variation (inside model) doesn't have one
            effectiveMRP = selectedModel.mrp;
        }
    } else if (selectedModel) {
        if (selectedModel.mrp && selectedModel.mrp > 0) {
            effectiveMRP = selectedModel.mrp;
        }
    } else {
        // Default "Starting From" MRP
        effectiveMRP = defaultDisplayMRP || product.basePrice || product.mrp;
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
                        {effectiveMRP && effectiveMRP > finalPrice ? (
                            <>
                                {!currentVariation && !selectedModel && hasVariations && <span style={{ fontSize: '0.9rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Starting from</span>}
                                <span className="price-original">₹{effectiveMRP}</span>
                                <span className="price-separator">/</span>
                                <span className="price-current">₹{finalPrice}</span>
                            </>
                        ) : (
                            <>
                                {!currentVariation && !selectedModel && hasVariations && <span style={{ fontSize: '0.9rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Starting from</span>}
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
