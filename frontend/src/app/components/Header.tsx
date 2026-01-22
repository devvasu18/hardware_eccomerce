'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext'; // Import AuthContext
import { useCart } from '../../context/CartContext'; // Import CartContext
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const { cartCount, openCart } = useCart();
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [categories, setCategories] = useState<{ _id: string, name: string, slug: string }[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/categories');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
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
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow click
                        />
                        <button className="search-icon-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Search Dropdown */}
                    {isSearchFocused && (
                        <div className="search-dropdown">
                            <div className="popular-searches-section">
                                <h4 className="dropdown-title">Popular Searches</h4>
                                <div className="tags-grid">
                                    <div className="search-tag">
                                        <span className="trend-icon">↗</span> 4 Door Wardrobes
                                    </div>
                                    <div className="search-tag">
                                        <span className="trend-icon">↗</span> Book Shelves
                                    </div>
                                    <div className="search-tag">
                                        <span className="trend-icon">↗</span> Centre Tables
                                    </div>
                                    <div className="search-tag">
                                        <span className="trend-icon">↗</span> Sofa Cum Beds
                                    </div>
                                    <div className="search-tag">
                                        <span className="trend-icon">↗</span> TV Units
                                    </div>
                                    <div className="search-tag">
                                        <span className="trend-icon">↗</span> Bed
                                    </div>
                                    <div className="search-tag">
                                        <span className="trend-icon">↗</span> Bed Side Table
                                    </div>
                                    <div className="search-tag">
                                        <span className="trend-icon">↗</span> Dining Table
                                    </div>
                                </div>
                            </div>
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
                    <div className="action-item">
                        <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
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
