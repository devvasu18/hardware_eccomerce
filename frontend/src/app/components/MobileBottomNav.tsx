'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiTag, FiShoppingBag, FiUser } from 'react-icons/fi'; // Or check existing imports
import { MdOutlineDashboard } from 'react-icons/md';
import './MobileBottomNav.css';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav = () => {
    const { t } = useLanguage();
    const pathname = usePathname();
    const { user } = useAuth();
    const [currentPath, setCurrentPath] = React.useState('');

    React.useEffect(() => {
        if (pathname) setCurrentPath(pathname);
    }, [pathname]);

    const isActive = (path: string) => {
        if (!currentPath) return false;
        if (path === '/') return currentPath === '/';
        // Highlight profile icon for any account related pages
        if (path === '/account') {
            return currentPath === '/account' ||
                currentPath.startsWith('/profile') ||
                currentPath.startsWith('/orders') ||
                currentPath.startsWith('/change-password') ||
                currentPath.startsWith('/settings') ||
                currentPath.startsWith('/admin');
        }
        return currentPath.startsWith(path);
    };

    return (
        <div className="mobile-bottom-nav">
            <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                <FiHome className="nav-icon" />
                <span suppressHydrationWarning>{t('nav_home')}</span>
            </Link>
            <Link href="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
                <FiGrid className="nav-icon" />
                <span suppressHydrationWarning>{t('nav_products')}</span>
            </Link>
            <Link href="/brands" className={`nav-link ${isActive('/brands') ? 'active' : ''}`}>
                <FiTag className="nav-icon" />
                <span suppressHydrationWarning>{t('nav_brands')}</span>
            </Link>
            <Link href="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
                <FiShoppingBag className="nav-icon" />
                <span suppressHydrationWarning>{t('nav_orders')}</span>
            </Link>

            {user ? (
                <Link href="/account" className={`nav-link ${isActive('/account') ? 'active' : ''}`}>
                    <FiUser className="nav-icon" />
                    <span suppressHydrationWarning>{t('nav_profile')}</span>
                </Link>
            ) : (
                <Link href="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
                    <FiUser className="nav-icon" />
                    <span suppressHydrationWarning>{t('login')}</span>
                </Link>
            )}
        </div>
    );
};

export default MobileBottomNav;
