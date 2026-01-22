'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    size?: string;
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
                            // Filter out invalid items (e.g. missing productId)
                            const validItems = parsed.filter(i => i.productId && typeof i.productId === 'string');
                            setItems(validItems);
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
                        name: item.product?.name || 'Unknown Product',
                        price: item.price,
                        quantity: item.quantity,
                        image: item.product?.imageUrl || item.product?.images?.[0] || '',
                        size: item.size
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
                        name: item.product?.name || 'Unknown Product',
                        price: item.price,
                        quantity: item.quantity,
                        image: item.product?.imageUrl || item.product?.images?.[0] || '',
                        size: item.size
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
                        size: newItem.size
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const updatedItems = data.items
                        .filter((item: any) => item.product)
                        .map((item: any) => ({
                            productId: typeof item.product === 'object' ? item.product._id : item.product,
                            name: item.product?.name || 'Unknown Product',
                            price: item.price,
                            quantity: item.quantity,
                            image: item.product?.imageUrl || item.product?.images?.[0] || '',
                            size: item.size
                        }));
                    setItems(updatedItems);
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
                // Normalize size comparison (undefined == null == '')
                const newItemSize = newItem.size || '';

                const existingIndex = prev.findIndex(i =>
                    i.productId === newItem.productId &&
                    (i.size || '') === newItemSize
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
        console.log('Removing from cart:', { productId, size });
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
                    body: JSON.stringify({ productId, size })
                });

                if (response.ok) {
                    const data = await response.json();
                    const updatedItems = data.items.map((item: any) => ({
                        productId: item.product._id,
                        name: item.product.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.product.imageUrl || item.product.images?.[0],
                        size: item.size
                    }));
                    setItems(updatedItems);
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
                // Normalize size comparison
                const currentSize = i.size || '';
                const targetSize = size || '';
                const sizeMatch = currentSize === targetSize;

                return !(idMatch && sizeMatch);
            }));
        }
    };

    // Update quantity
    const updateQuantity = async (productId: string, quantity: number, size?: string) => {
        if (quantity < 1) return;

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
                    body: JSON.stringify({ productId, quantity, size })
                });

                if (response.ok) {
                    const data = await response.json();
                    const updatedItems = data.items.map((item: any) => ({
                        productId: item.product._id,
                        name: item.product.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.product.imageUrl || item.product.images?.[0],
                        size: item.size
                    }));
                    setItems(updatedItems);
                }
            } catch (error) {
                console.error('Error updating cart:', error);
            }
        } else {
            // Guest: Update in localStorage
            setItems(prev => prev.map(i =>
                (i.productId === productId &&
                    (size ? i.size === size : !i.size))
                    ? { ...i, quantity }
                    : i
            ));
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
