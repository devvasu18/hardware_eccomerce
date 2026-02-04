'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    size?: string; // Legacy
    variationId?: string; // New
    variationText?: string; // New
    isOnDemand?: boolean;
    gst_rate?: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: string, size?: string) => void;
    updateQuantity: (productId: string, quantity: number, size?: string) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    loading: boolean;
    syncCart: () => Promise<void>;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_URL = 'http://localhost:5000/api';

export function CartProvider({ children }: { children: ReactNode }) {
    const { user, registerLoginCallback } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    // Register cart sync callback on mount
    useEffect(() => {
        registerLoginCallback(() => {
            // Use local variable to avoid closure issues if needed, 
            // but syncCart inside the component will now use latest user via useEffect
        });
    }, [registerLoginCallback]);

    // Handle sync on user login transition
    const prevUserRef = useRef(user);
    useEffect(() => {
        const justLoggedIn = !prevUserRef.current && user;
        const justLoggedOut = prevUserRef.current && !user;

        if (justLoggedIn) {
            syncCart();
        } else if (justLoggedOut) {
            setItems([]);
            localStorage.removeItem('cart');
            setLoaded(true);
        } else if (!user && !loaded) {
            loadCart();
        } else if (user && !loaded) {
            loadCart();
        }

        prevUserRef.current = user;
    }, [user, loaded]);

    // Load cart from localStorage or database
    const loadCart = async () => {
        setLoading(true);
        try {
            if (user) {
                // Logged-in user: fetch from database
                await fetchCartFromDB();
            } else {
                // Guest user: load from localStorage
                const saved = localStorage.getItem('cart');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed)) {
                            // Filter out invalid items
                            const validItems = parsed.filter(i => i.productId && typeof i.productId === 'string');

                            if (validItems.length > 0) {
                                // Fetch fresh details for these items
                                const ids = [...new Set(validItems.map(i => i.productId))];
                                const res = await fetch(`${API_URL}/products?ids=${ids.join(',')}&limit=100`);

                                if (res.ok) {
                                    const data = await res.json();

                                    // Define interface for the data we expect
                                    interface ProductData {
                                        _id: string;
                                        title: string;
                                        basePrice: number;
                                        mrp?: number;
                                        discountedPrice?: number;
                                        selling_price_a?: number;
                                        featured_image?: string;
                                        gallery_images?: string[];
                                        isOnDemand?: boolean;
                                        gst_rate?: number;
                                    }

                                    const productsMap = new Map<string, ProductData>((Array.isArray(data) ? data : data.products || []).map((p: ProductData) => [p._id, p]));

                                    // Merge fresh details with local quantity/size
                                    const enrichedItems = validItems.map(item => {
                                        const product = productsMap.get(item.productId);
                                        if (!product) return item; // Keep as is if fetch fails

                                        return {
                                            ...item,
                                            name: product.title,
                                            price: product.discountedPrice || product.basePrice || product.mrp || 0,
                                            image: product.featured_image || product.gallery_images?.[0] || '',
                                            isOnDemand: product.isOnDemand,
                                            gst_rate: product.gst_rate
                                        };
                                    });
                                    setItems(enrichedItems);
                                } else {
                                    setItems(validItems);
                                }
                            } else {
                                setItems([]);
                            }
                        } else {
                            setItems([]);
                        }
                    } catch (e) {
                        console.error('Failed to parse cart', e);
                        setItems([]);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        } finally {
            setLoaded(true);
            setLoading(false);
        }
    };

    // Fetch cart from database (logged-in users)
    const fetchCartFromDB = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const dbItems = data.items
                    .filter((item: any) => item.product) // Safety check: skip deleted products
                    .map((item: any) => ({
                        productId: typeof item.product === 'object' ? item.product._id : item.product,
                        name: item.variationText ? `${item.product?.title} (${item.variationText})` : (item.product?.title || 'Unknown Product'),
                        price: item.price,
                        quantity: item.quantity,
                        image: item.product?.featured_image || item.product?.gallery_images?.[0] || '',
                        size: item.size,
                        variationId: item.variationId,
                        variationText: item.variationText,
                        isOnDemand: item.product?.isOnDemand || (typeof item.product?.stock === 'number' && item.quantity > item.product.stock),
                        gst_rate: item.product?.gst_rate
                    }));
                setItems(dbItems);
            }
        } catch (error) {
            console.error('Error fetching cart from DB:', error);
        }
    };

    // Sync localStorage cart to database on login
    const syncCart = async () => {
        if (!user) return;

        const localCart = localStorage.getItem('cart');
        if (!localCart) {
            await fetchCartFromDB();
            return;
        }

        try {
            const localItems = JSON.parse(localCart);
            if (localItems.length === 0) {
                await fetchCartFromDB();
                return;
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/cart/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ localCartItems: localItems })
            });

            if (response.ok) {
                const data = await response.json();
                const syncedItems = data.items
                    .filter((item: any) => item.product)
                    .map((item: any) => ({
                        productId: typeof item.product === 'object' ? item.product._id : item.product,
                        name: item.product?.title || 'Unknown Product',
                        price: item.price,
                        quantity: item.quantity,
                        image: item.product?.featured_image || item.product?.gallery_images?.[0] || '',
                        size: item.size,
                        variationId: item.variationId, // Ensure syncing preserves this
                        variationText: item.variationText,
                        isOnDemand: item.product?.isOnDemand || (typeof item.product?.stock === 'number' && item.quantity > item.product.stock),
                        gst_rate: item.product?.gst_rate
                    }));
                setItems(syncedItems);
                localStorage.removeItem('cart'); // Clear localStorage after successful sync
            }
        } catch (error) {
            console.error('Error syncing cart:', error);
        }
    };

    // Save to localStorage (guest users only)
    useEffect(() => {
        if (loaded && !user) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, loaded, user]);

    // Add to cart
    const addToCart = async (newItem: CartItem) => {
        console.log('Adding to cart:', newItem);
        if (user) {
            // Logged-in: Add to database
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/cart/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId: newItem.productId,
                        quantity: newItem.quantity,
                        price: newItem.price,
                        size: newItem.size,
                        variationId: newItem.variationId,
                        variationText: newItem.variationText
                    })
                });

                if (response.ok) {
                    await fetchCartFromDB(); // Safest to re-fetch
                    openCart(); // Open sidebar on add
                } else {
                    console.error('Failed to add to cart DB', await response.text());
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
            }
        } else {
            // Guest: Add to localStorage
            setItems((prev) => {
                const newItemKey = newItem.variationId || newItem.size || '';

                const existingIndex = prev.findIndex(i =>
                    i.productId === newItem.productId &&
                    (i.variationId || i.size || '') === newItemKey
                );

                if (existingIndex > -1) {
                    const newItems = [...prev];
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        quantity: newItems[existingIndex].quantity + newItem.quantity
                    };
                    return newItems;
                }
                return [...prev, newItem];
            });
            openCart(); // Open sidebar on add
        }
    };

    // Remove from cart
    const removeFromCart = async (productId: string, size?: string) => {
        // NOTE: The 'size' parameter here is often used as a generic 'variant identifier' in legacy code.
        // We should check if it looks like a MongoID (24 hex chars) - if so treat as variationId.
        const isVariationId = size && size.length === 24 && /^[0-9a-fA-F]+$/.test(size);

        console.log('Removing from cart:', { productId, size, isVariationId });

        if (user) {
            // Logged-in: Remove from database
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/cart/remove`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId,
                        size: !isVariationId ? size : undefined,
                        variationId: isVariationId ? size : undefined
                    })
                });

                if (response.ok) {
                    await fetchCartFromDB();
                } else {
                    console.error('Failed to remove from cart DB');
                }
            } catch (error) {
                console.error('Error removing from cart:', error);
            }
        } else {
            // Guest: Remove from localStorage
            setItems(prev => prev.filter(i => {
                const idMatch = i.productId === productId;
                // Normalize identifier comparison
                const currentKey = i.variationId || i.size || '';
                const targetKey = size || '';

                return !(idMatch && currentKey === targetKey);
            }));
        }
    };

    // Update quantity
    const updateQuantity = async (productId: string, quantity: number, size?: string) => {
        if (quantity < 1) return;

        const isVariationId = size && size.length === 24 && /^[0-9a-fA-F]+$/.test(size);

        if (user) {
            // Logged-in: Update in database
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/cart/update`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId,
                        quantity,
                        size: !isVariationId ? size : undefined,
                        variationId: isVariationId ? size : undefined
                    })
                });

                if (response.ok) {
                    await fetchCartFromDB();
                }
            } catch (error) {
                console.error('Error updating cart:', error);
            }
        } else {
            // Guest: Update in localStorage
            setItems(prev => prev.map(i => {
                const currentKey = i.variationId || i.size || '';
                const targetKey = size || '';

                if (i.productId === productId && currentKey === targetKey) {
                    return { ...i, quantity };
                }
                return i;
            }));
        }
    };

    // Clear cart
    const clearCart = async () => {
        if (user) {
            // Logged-in: Clear database cart
            try {
                const token = localStorage.getItem('token');
                await fetch(`${API_URL}/cart/clear`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setItems([]);
            } catch (error) {
                console.error('Error clearing cart:', error);
            }
        } else {
            // Guest: Clear localStorage
            setItems([]);
            localStorage.removeItem('cart');
        }
    };

    const cartTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            loading,
            syncCart,
            isCartOpen,
            openCart,
            closeCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
