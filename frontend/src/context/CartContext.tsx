'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    size?: string; // Optional size (e.g., 'SM', 'M', 'L', 'XL')
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('cart');
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
        setLoaded(true);
    }, []);

    // Save to local storage
    useEffect(() => {
        if (loaded) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, loaded]);

    const addToCart = (newItem: CartItem) => {
        setItems((prev) => {
            // Match by both productId AND size (if size exists)
            const existing = prev.find(i =>
                i.productId === newItem.productId &&
                (newItem.size ? i.size === newItem.size : !i.size)
            );
            if (existing) {
                return prev.map(i =>
                    (i.productId === newItem.productId &&
                        (newItem.size ? i.size === newItem.size : !i.size))
                        ? { ...i, quantity: i.quantity + newItem.quantity }
                        : i
                );
            }
            return [...prev, newItem];
        });
    };

    const removeFromCart = (id: string) => {
        setItems(prev => prev.filter(i => i.productId !== id));
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        setItems(prev => prev.map(i => i.productId === id ? { ...i, quantity: qty } : i));
    };

    const clearCart = () => setItems([]);

    const cartTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
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
