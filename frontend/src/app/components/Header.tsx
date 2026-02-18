'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; // Import AuthContext
import { useCart } from '../../context/CartContext'; // Import CartContext
import { useWishlist } from '../../context/WishlistContext'; // Import WishlistContext
import { useNotification, Notification } from '../../context/NotificationContext'; // Import NotificationContext
import { useLanguage } from '../../context/LanguageContext';
import { getSystemSettings } from '../utils/systemSettings';
import './Header.css';

const Header = () => {
    const { t, language, setLanguage } = useLanguage();
    const { user, logout } = useAuth();
    const { cartCount, openCart } = useCart();
    const router = useRouter();
    const pathname = usePathname();
    const { wishlistCount, openWishlist } = useWishlist();
    const { unreadCount, notifications, markAsRead } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<Record<string, any[]>>({});
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobileSearchTerm, setMobileSearchTerm] = useState('');
    const [companyName, setCompanyName] = useState('Hardware Store');

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Helper to get localized name
    const getLocalizedName = (name: any) => {
        if (typeof name === 'string') return name;
        if (name && typeof name === 'object') {
            return name[language] || name['en'] || '';
        }
        return '';
    };

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = () => {
        if (searchTerm.trim()) {
            router.push(`/products?keyword=${encodeURIComponent(searchTerm.trim())}`);
            setIsSearchFocused(false);
        }
    };

    const handleMobileSearch = () => {
        if (mobileSearchTerm.trim()) {
            router.push(`/products?keyword=${encodeURIComponent(mobileSearchTerm.trim())}`);
            setIsMobileMenuOpen(false);
            setMobileSearchTerm('');
        }
    };

    // Debounced search for suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                try {
                    // We reuse the products API with keyword and limit 5
                    const res = await fetch(`/api/products?keyword=${encodeURIComponent(searchTerm)}&limit=5`);
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
        const fetchAllNavData = async () => {
            try {
                // Fetch categories
                const res = await fetch('/api/categories');
                if (!res.ok) throw new Error('Failed to fetch categories');

                const data = await res.json();
                const navCategories = data.filter((cat: any) => cat.showInNav).slice(0, 10);

                // Fetch sub-categories in parallel
                const subCatMap: Record<string, any[]> = {};
                await Promise.all(navCategories.map(async (cat: any) => {
                    try {
                        const subRes = await fetch(`/api/categories/${cat.slug}/subcategories`);
                        if (subRes.ok) {
                            subCatMap[cat._id] = await subRes.json();
                        }
                    } catch (err) {
                        console.error(`Error fetching sub-categories for ${cat.slug}:`, err);
                    }
                }));

                // Update both states
                setCategories(navCategories);
                setSubCategories(subCatMap);
                console.log('Final Navigation Data Loaded:', { categories: navCategories, subCategories: subCatMap });
            } catch (error) {
                console.error('Failed to load navigation data:', error);
            }
        };
        fetchAllNavData();
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getSystemSettings();
            if (settings && settings.companyName) {
                setCompanyName(settings.companyName);
            }
        };
        fetchSettings();
    }, []);



    return (
        <header className={`header-container ${isVisible ? 'header-visible' : 'header-hidden'}`}>
            {/* Top Bar: Logo, Search, Actions */}
            <div className="header-main-bar">

                {/* Left: Brand Logo */}
                <div className="header-logo-area">
                    <Link href="/" className="logo-text">
                        {companyName}
                    </Link>
                </div>

                {/* Hamburger Menu for Mobile/Tablet */}
                <button
                    className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>

                {/* Center: Search Input */}
                <div className="header-search-area">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder={t('search_placeholder')}
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
                                    <h4 className="dropdown-title">{t('suggestions')}</h4>
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
                                                                        ? `/${product.featured_image || (product.gallery_images && product.gallery_images[0])}`
                                                                        : '/placeholder.png'
                                                            }
                                                            alt={getLocalizedName(product.title)}
                                                            width={40}
                                                            height={40}
                                                            className="suggestion-image"
                                                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                                                        />
                                                    </div>
                                                    <span className="suggestion-text">{getLocalizedName(product.title)}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-suggestions">
                                            {t('no_products_found')} "{searchTerm}"
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="popular-searches-section">
                                    <h4 className="dropdown-title">{t('popular_categories')}</h4>
                                    <div className="tags-grid">
                                        {categories.slice(0, 5).map((category) => (
                                            <Link
                                                key={category._id}
                                                href={`/products?category=${category.slug}`}
                                                className="search-tag"
                                                onClick={() => setIsSearchFocused(false)}
                                            >
                                                <span className="trend-icon">↗</span> {getLocalizedName(category.name)}
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
                    {/* Language Switcher */}
                    <div
                        className="action-item relative-wrapper"
                        onMouseEnter={() => setIsLangDropdownOpen(true)}
                        onMouseLeave={() => setIsLangDropdownOpen(false)}
                        onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    >
                        <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: '0.2rem' }}>
                            {language === 'en' ? 'EN' : 'HI'}
                        </span>

                        {isLangDropdownOpen && (
                            <div className="user-dropdown" style={{ minWidth: '140px', right: '0', width: 'auto' }}>
                                <button
                                    className={`dropdown-item ${language === 'en' ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); setLanguage('en'); setIsLangDropdownOpen(false); }}
                                    style={{ color: language === 'en' ? 'var(--primary)' : 'inherit' }}
                                >
                                    English
                                </button>
                                <button
                                    className={`dropdown-item ${language === 'hi' ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); setLanguage('hi'); setIsLangDropdownOpen(false); }}
                                    style={{ color: language === 'hi' ? 'var(--primary)' : 'inherit' }}
                                >
                                    हिंदी (Hindi)
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Notification Bell */}
                    {user && (
                        <div
                            className="action-item notification-btn-wrapper"
                            onClick={() => router.push('/notifications')}
                            style={{ cursor: 'pointer', position: 'relative' }}
                            title={t('notifications_title')}
                        >
                            <div className="notification-icon-container">
                                <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="notification-badge">{unreadCount}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Login / Profile */}
                    <div
                        className="action-item relative-wrapper"
                        onMouseEnter={() => setIsUserDropdownOpen(true)}
                        onMouseLeave={() => setIsUserDropdownOpen(false)}
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    >
                        {user ? (
                            <>
                                <div className="action-text">
                                    <span className="action-text-sub">{t('hello')}, {user.username}</span>
                                    <span className="action-text-main">{t('account')}</span>
                                </div>
                                <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>

                                {/* User Dropdown */}
                                {isUserDropdownOpen && (
                                    <div className="user-dropdown">
                                        <div className="dropdown-item-text">{t('sign_in_as')} <br /><strong>{user.username}</strong></div>
                                        <div className="dropdown-divider"></div>
                                        {user.role !== 'admin' && user.role !== 'super_admin' && (
                                            <>
                                                <Link href="/profile" className="dropdown-item">{t('my_profile')}</Link>
                                                <Link href="/orders" className="dropdown-item">{t('my_orders')}</Link>
                                                <Link href="/change-password" className="dropdown-item">{t('change_password')}</Link>
                                                <Link href="/settings" className="dropdown-item">{t('settings')}</Link>
                                            </>
                                        )}
                                        {(user.role === 'admin' || user.role === 'super_admin') && (
                                            <Link href="/admin" className="dropdown-item">{t('admin_dashboard')}</Link>
                                        )}
                                        <div className="dropdown-divider"></div>
                                        <button onClick={logout} className="dropdown-item logout-btn">{t('logout')}</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link href="/login" className="login-link-wrapper">
                                <div className="action-text">
                                    <span className="action-text-sub">{t('sign_up')}</span>
                                    <span className="action-text-main">{t('login')}</span>
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
                        categories.map((category) => {
                            const hasSubCategories = subCategories[category._id]?.length > 0;
                            return (
                                <div
                                    key={String(category._id)}
                                    className="nav-link-wrapper"
                                    onMouseEnter={() => {
                                        if (hasSubCategories) {
                                            setHoveredCategory(String(category._id));
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredCategory(null);
                                    }}
                                >
                                    <Link
                                        href={`/products?category=${category.slug}`}
                                        className="nav-link"
                                        onMouseEnter={() => {
                                            if (hasSubCategories) setHoveredCategory(String(category._id));
                                        }}
                                    >
                                        {getLocalizedName(category.name)}
                                        {hasSubCategories && (
                                            <span className="nav-link-arrow">▼</span>
                                        )}
                                    </Link>

                                    {/* Sub-category Dropdown */}
                                    {hasSubCategories && hoveredCategory === String(category._id) && (
                                        <div className="subcategory-dropdown">
                                            <div className="subcategory-grid">
                                                {subCategories[category._id].map((subCat: any) => (
                                                    <Link
                                                        key={String(subCat._id)}
                                                        href={`/products?category=${category.slug}&subcategory=${subCat.slug}`}
                                                        className="subcategory-item"
                                                        onClick={() => setHoveredCategory(null)}
                                                    >
                                                        <span className="subcategory-icon">→</span>
                                                        {getLocalizedName(subCat.name)}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{t('loading')}</span>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-nav-header">
                    <span className="mobile-nav-logo">{companyName}</span>
                    <button className="mobile-nav-close" onClick={() => setIsMobileMenuOpen(false)}>×</button>
                </div>
                <nav className="mobile-nav-links">
                    {categories.map((category) => (
                        <Link
                            key={category._id}
                            href={`/products?category=${category.slug}`}
                            className="mobile-nav-link"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {getLocalizedName(category.name)}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Mobile Search Bar */}
            <div className="mobile-search-container">
                <div className="mobile-search-wrapper">
                    <input
                        type="text"
                        className="mobile-search-input"
                        placeholder={t('search_mobile')}
                        value={mobileSearchTerm}
                        onChange={(e) => setMobileSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleMobileSearch()}
                    />
                    <button className="mobile-search-btn" onClick={handleMobileSearch}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
