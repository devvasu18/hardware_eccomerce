'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; // Import AuthContext
import { useCart } from '../../context/CartContext'; // Import CartContext
import { useWishlist } from '../../context/WishlistContext'; // Import WishlistContext
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const { cartCount, openCart } = useCart();
    const router = useRouter();
    const { wishlistCount, openWishlist } = useWishlist();
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [categories, setCategories] = useState<{ _id: string, name: string, slug: string, showInNav: boolean }[]>([]);

    const handleSearch = () => {
        if (searchTerm.trim()) {
            router.push(`/products?keyword=${encodeURIComponent(searchTerm.trim())}`);
            setIsSearchFocused(false);
        }
    };

    // Debounced search for suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                try {
                    // We reuse the products API with keyword and limit 5
                    const res = await fetch(`http://localhost:5000/api/products?keyword=${encodeURIComponent(searchTerm)}&limit=5`);
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(Array.isArray(data) ? data : data.products || []);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setSuggestions([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/categories');
                if (res.ok) {
                    const data = await res.json();
                    // Filter by showInNav and take max 10
                    const navCategories = data.filter((cat: any) => cat.showInNav).slice(0, 10);
                    setCategories(navCategories);
                }
            } catch (error) {
                console.error('Failed to load menu categories', error);
            }
        };
        fetchCategories();
    }, []);

    return (
        <header className="header-container">
            {/* Top Bar: Logo, Search, Actions */}
            <div className="header-main-bar">

                {/* Left: Brand Logo */}
                <div className="header-logo-area">
                    <Link href="/" className="logo-text">
                        Selfmade
                    </Link>
                </div>

                {/* Center: Search Input */}
                <div className="header-search-area">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for furniture, decor and more..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow click
                        />
                        <button className="search-icon-btn" onClick={handleSearch}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Search Dropdown */}
                    {isSearchFocused && (
                        <div className="search-dropdown">
                            {searchTerm.length >= 2 ? (
                                <div className="suggestions-section">
                                    <h4 className="dropdown-title">Suggestions</h4>
                                    {suggestions.length > 0 ? (
                                        <div className="suggestions-list">
                                            {suggestions.map((product) => (
                                                <Link
                                                    key={product._id}
                                                    href={`/products/${product._id}`}
                                                    className="suggestion-item"
                                                    onClick={() => setIsSearchFocused(false)}
                                                >
                                                    <div className="suggestion-image-wrapper">
                                                        <Image
                                                            src={
                                                                (product.featured_image || (product.gallery_images && product.gallery_images[0]))?.startsWith('http')
                                                                    ? (product.featured_image || (product.gallery_images && product.gallery_images[0]))
                                                                    : (product.featured_image || (product.gallery_images && product.gallery_images[0]))
                                                                        ? `http://localhost:5000/${product.featured_image || (product.gallery_images && product.gallery_images[0])}`
                                                                        : '/placeholder.png'
                                                            }
                                                            alt={product.title}
                                                            width={40}
                                                            height={40}
                                                            className="suggestion-image"
                                                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                                                        />
                                                    </div>
                                                    <span className="suggestion-text">{product.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-suggestions">
                                            No products found matching "{searchTerm}"
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="popular-searches-section">
                                    <h4 className="dropdown-title">Popular Categories</h4>
                                    <div className="tags-grid">
                                        {categories.slice(0, 5).map((category) => (
                                            <Link
                                                key={category._id}
                                                href={`/products?category=${category.slug}`}
                                                className="search-tag"
                                                onClick={() => setIsSearchFocused(false)}
                                            >
                                                <span className="trend-icon">↗</span> {category.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: User Actions */}
                <div className="header-actions-area">
                    {/* Login / Profile */}
                    <div
                        className="action-item relative-wrapper"
                        onMouseEnter={() => setIsUserDropdownOpen(true)}
                        onMouseLeave={() => setIsUserDropdownOpen(false)}
                    >
                        {user ? (
                            <>
                                <div className="action-text">
                                    <span className="action-text-sub">Hello, {user.username}</span>
                                    <span className="action-text-main">Account</span>
                                </div>
                                <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>

                                {/* User Dropdown */}
                                {isUserDropdownOpen && (
                                    <div className="user-dropdown">
                                        <div className="dropdown-item-text">Signed in as <br /><strong>{user.username}</strong></div>
                                        <div className="dropdown-divider"></div>
                                        <Link href="/profile" className="dropdown-item">My Profile</Link>
                                        <Link href="/orders" className="dropdown-item">My Orders</Link>
                                        {user.role === 'admin' && (
                                            <Link href="/admin" className="dropdown-item">Admin Dashboard</Link>
                                        )}
                                        <div className="dropdown-divider"></div>
                                        <button onClick={logout} className="dropdown-item logout-btn">Logout</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link href="/login" className="login-link-wrapper">
                                <div className="action-text">
                                    <span className="action-text-sub">Sign Up Now</span>
                                    <span className="action-text-main">Login</span>
                                </div>
                                <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </Link>
                        )}
                    </div>



                    {/* Wishlist */}
                    <div
                        className="action-item wishlist-btn-wrapper"
                        onClick={openWishlist}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="wishlist-icon-container">
                            <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {wishlistCount > 0 && (
                                <span className="wishlist-badge">{wishlistCount}</span>
                            )}
                        </div>
                    </div>

                    {/* Cart */}
                    <div
                        className="action-item cart-btn-wrapper"
                        onClick={openCart}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="cart-icon-container">
                            <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="cart-badge">{cartCount}</span>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Nav Bar: Categories */}
            <div className="header-nav-bar">
                <div className="nav-links-container">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <Link
                                key={category._id}
                                href={`/products?category=${category.slug}`}
                                className="nav-link"
                            >
                                {category.name}
                            </Link>
                        ))
                    ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading categories...</span>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
