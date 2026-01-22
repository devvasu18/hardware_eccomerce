'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WishlistItem {
    _id: string;
    product: {
        _id: string;
        name: string;
        basePrice: number;
        discountedPrice: number;
        images: string[];
        stock: number;
        category: string;
        isActive: boolean;
    };
    addedAt: string;
}

interface WishlistContextType {
    wishlistItems: WishlistItem[];
    wishlistCount: number;
    isWishlistOpen: boolean;
    openWishlist: () => void;
    closeWishlist: () => void;
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    loading: boolean;
    syncWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { user, registerLoginCallback } = useAuth();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load wishlist on mount and when user changes
    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            loadGuestWishlist();
        }
    }, [user]);

    // Register sync callback on login
    useEffect(() => {
        registerLoginCallback(() => {
            syncWishlist();
        });
    }, []);

    // Fetch wishlist from server (authenticated users)
    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/wishlist', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setWishlistItems(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load guest wishlist from localStorage
    const loadGuestWishlist = () => {
        try {
            const guestWishlist = localStorage.getItem('guestWishlist');
            if (guestWishlist) {
                const productIds = JSON.parse(guestWishlist);
                // For guest users, we store only product IDs
                // We'll need to fetch product details when displaying
                setWishlistItems(productIds.map((id: string) => ({
                    _id: id,
                    product: { _id: id },
                    addedAt: new Date().toISOString()
                })));
            } else {
                setWishlistItems([]);
            }
        } catch (error) {
            console.error('Error loading guest wishlist:', error);
            setWishlistItems([]);
        }
    };

    // Sync guest wishlist to server on login
    const syncWishlist = async () => {
        try {
            const guestWishlist = localStorage.getItem('guestWishlist');
            if (!guestWishlist || !user) return;

            const productIds = JSON.parse(guestWishlist);
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/wishlist/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ localWishlistItems: productIds }),
            });

            if (response.ok) {
                const data = await response.json();
                setWishlistItems(data.items || []);
                localStorage.removeItem('guestWishlist');
            }
        } catch (error) {
            console.error('Error syncing wishlist:', error);
        }
    };

    // Add to wishlist
    const addToWishlist = async (productId: string) => {
        console.log('🎯 Adding to wishlist:', { productId, hasUser: !!user, userObj: user });

        try {
            if (user) {
                // Authenticated user - save to database
                const token = localStorage.getItem('token');
                console.log('✅ User authenticated, making API call with token:', token?.substring(0, 20) + '...');

                const response = await fetch('http://localhost:5000/api/wishlist/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ productId }),
                });

                console.log('📡 API Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    setWishlistItems(data.items || []);
                    console.log('✅ Successfully added to wishlist (authenticated)');
                } else {
                    const errorText = await response.text();
                    console.error('❌ API Error Response:', errorText);
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { message: errorText || 'Failed to add to wishlist' };
                    }
                    throw new Error(errorData.message || 'Failed to add to wishlist');
                }
            } else {
                // Guest user - save to localStorage
                console.log('👤 Guest user, saving to localStorage...');
                const guestWishlist = localStorage.getItem('guestWishlist');
                const productIds = guestWishlist ? JSON.parse(guestWishlist) : [];

                if (!productIds.includes(productId)) {
                    productIds.push(productId);
                    localStorage.setItem('guestWishlist', JSON.stringify(productIds));

                    // Update state
                    setWishlistItems(prev => [
                        ...prev,
                        {
                            _id: productId,
                            product: { _id: productId } as any,
                            addedAt: new Date().toISOString()
                        }
                    ]);
                    console.log('✅ Successfully added to wishlist (guest), total items:', productIds.length);
                } else {
                    console.log('ℹ️ Product already in wishlist');
                }
            }
        } catch (error) {
            console.error('❌ Error adding to wishlist:', error);
            // Only throw error for authenticated users
            if (user) {
                throw error;
            }
        }
    };

    // Remove from wishlist
    const removeFromWishlist = async (productId: string) => {
        try {
            if (user) {
                // Authenticated user - remove from database
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/wishlist/remove/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setWishlistItems(data.items || []);
                } else {
                    throw new Error('Failed to remove from wishlist');
                }
            } else {
                // Guest user - remove from localStorage
                const guestWishlist = localStorage.getItem('guestWishlist');
                const productIds = guestWishlist ? JSON.parse(guestWishlist) : [];
                const updatedIds = productIds.filter((id: string) => id !== productId);
                localStorage.setItem('guestWishlist', JSON.stringify(updatedIds));

                // Update state
                setWishlistItems(prev => prev.filter(item => item.product._id !== productId));
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            throw error;
        }
    };

    // Check if product is in wishlist
    const isInWishlist = useCallback((productId: string): boolean => {
        return wishlistItems.some(item => item.product._id === productId);
    }, [wishlistItems]);

    // Open/Close wishlist sidebar
    const openWishlist = () => setIsWishlistOpen(true);
    const closeWishlist = () => setIsWishlistOpen(false);

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                wishlistCount: wishlistItems.length,
                isWishlistOpen,
                openWishlist,
                closeWishlist,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                loading,
                syncWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
