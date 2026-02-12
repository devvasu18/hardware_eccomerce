'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WishlistItem {
    _id: string;
    product: {
        _id: string;
        title: string;
        basePrice: number;
        discountedPrice: number;
        featured_image?: string;
        gallery_images?: string[];
        stock: number;
        category: string;
        isActive: boolean;
        offers?: { title: string; percentage: number; isActive?: boolean }[];
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

    // Calculate Stacked Price Helper
    const processWishlistData = useCallback((items: any[]): WishlistItem[] => {
        if (!items) return []; // Guard against null items
        return items.map(item => {
            const product = item.product;
            if (!product) return item; // Safety

            let finalPrice = product.discountedPrice || product.basePrice || 0;
            // Often backend 'discountedPrice' matches 'selling_price_a'.
            // If backend didn't apply offers (which it doesn't in populate), we start from base.
            // Actually, safe bet is to start from max(basePrice, discountedPrice) if no offers applied yet?
            // No, 'basePrice' is MRP. 'discountedPrice' is Selling Price A (Variant min).
            // We apply Apply Offer on Selling Price A.

            // 1. Offer
            if (product.offers && Array.isArray(product.offers) && product.offers.length > 0) {
                const bestOffer = product.offers.reduce((prev: any, current: any) => {
                    // Check if offer is active (if populated object has isActive field)
                    if (current.isActive === false) return prev;
                    const p = current.percentage || 0;
                    return (prev.percentage > p) ? prev : { ...current, percentage: p };
                }, { percentage: 0 });

                if (bestOffer.percentage > 0) {
                    finalPrice = Math.round(finalPrice * (1 - bestOffer.percentage / 100));
                }
            }

            // 2. Wholesale
            if (user?.customerType === 'wholesale' && user.wholesaleDiscount > 0) {
                finalPrice = Math.round(finalPrice * (1 - user.wholesaleDiscount / 100));
            }

            return {
                ...item,
                product: {
                    ...product,
                    discountedPrice: finalPrice
                }
            };
        });
    }, [user]);

    // Load wishlist on mount and when user changes
    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            loadGuestWishlist();
        }
    }, [user, processWishlistData]);

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
                setWishlistItems(processWishlistData(data.items || []));
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load guest wishlist from localStorage
    const loadGuestWishlist = async () => {
        try {
            const guestWishlist = localStorage.getItem('guestWishlist');
            if (guestWishlist) {
                const productIds = JSON.parse(guestWishlist);
                if (productIds.length === 0) {
                    setWishlistItems([]);
                    return;
                }

                // Fetch details for these IDs
                try {
                    const res = await fetch(`http://localhost:5000/api/products?ids=${productIds.join(',')}&limit=100`);
                    if (res.ok) {
                        const data = await res.json();
                        const products = Array.isArray(data) ? data : data.products;

                        const items = products.map((p: any) => ({
                            _id: p._id,
                            product: {
                                _id: p._id,
                                title: p.title,
                                basePrice: p.basePrice || p.mrp || 0,
                                discountedPrice: p.discountedPrice || p.selling_price_a || 0,
                                featured_image: p.featured_image,
                                gallery_images: p.gallery_images,
                                stock: p.stock || 0,
                                category: p.category?.name || 'Uncategorized',
                                isActive: p.isActive,
                                offers: p.offers // Pass offers
                            },
                            addedAt: new Date().toISOString()
                        }));

                        setWishlistItems(processWishlistData(items));
                    }
                } catch (fetchErr) {
                    console.error("Failed to fetch guest wishlist details", fetchErr);
                    setWishlistItems(productIds.map((id: string) => ({
                        _id: id,
                        product: { _id: id, title: 'Loading...', category: '', basePrice: 0, discountedPrice: 0, stock: 0, isActive: true },
                        addedAt: new Date().toISOString()
                    })));
                }

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
                setWishlistItems(processWishlistData(data.items || []));
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

                const response = await fetch('http://localhost:5000/api/wishlist/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ productId }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setWishlistItems(processWishlistData(data.items || []));
                    console.log('✅ Successfully added to wishlist (authenticated)');
                } else {
                    const errorText = await response.text();
                    console.error('❌ API Error Response:', errorText);
                    throw new Error('Failed to add to wishlist');
                }
            } else {
                // Guest user - save to localStorage
                console.log('👤 Guest user, saving to localStorage...');
                const guestWishlist = localStorage.getItem('guestWishlist');
                const productIds = guestWishlist ? JSON.parse(guestWishlist) : [];

                if (!productIds.includes(productId)) {
                    productIds.push(productId);
                    localStorage.setItem('guestWishlist', JSON.stringify(productIds));

                    // Update state (basic, no price calc until reload/fetch)
                    setWishlistItems(prev => [
                        ...prev,
                        {
                            _id: productId,
                            product: { _id: productId } as any,
                            addedAt: new Date().toISOString()
                        }
                    ]);
                    // Optionally trigger reload to get price
                    loadGuestWishlist();
                }
            }
        } catch (error) {
            console.error('❌ Error adding to wishlist:', error);
            if (user) throw error;
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
                    setWishlistItems(processWishlistData(data.items || []));
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
