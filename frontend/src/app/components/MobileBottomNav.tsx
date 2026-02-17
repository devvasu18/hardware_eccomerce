'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiTag, FiShoppingBag, FiUser } from 'react-icons/fi'; // Or check existing imports
import { MdOutlineDashboard } from 'react-icons/md';
import './MobileBottomNav.css';
import { useLanguage } from '../../context/LanguageContext';

const MobileBottomNav = () => {
    const { t } = useLanguage();
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    return (
        <div className="mobile-bottom-nav">
            <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                <FiHome className="nav-icon" />
                <span>{t('nav_home')}</span>
            </Link>
            <Link href="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
                <FiGrid className="nav-icon" />
                <span>{t('nav_products')}</span>
            </Link>
            <Link href="/brands" className={`nav-link ${isActive('/brands') ? 'active' : ''}`}>
                <FiTag className="nav-icon" />
                <span>{t('nav_brands')}</span>
            </Link>
            <Link href="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
                <FiShoppingBag className="nav-icon" />
                <span>{t('nav_orders')}</span>
            </Link>
            <Link href="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                <FiUser className="nav-icon" />
                <span>{t('nav_profile')}</span>
            </Link>
        </div>
    );
};

export default MobileBottomNav;
