'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiTag, FiShoppingBag, FiUser } from 'react-icons/fi'; // Or check existing imports
import { MdOutlineDashboard } from 'react-icons/md';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    return (
        <div className="mobile-bottom-nav">
            <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                <FiHome className="nav-icon" />
                <span>Home</span>
            </Link>
            <Link href="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
                <FiGrid className="nav-icon" />
                <span>Products</span>
            </Link>
            <Link href="/brands" className={`nav-link ${isActive('/brands') ? 'active' : ''}`}>
                <FiTag className="nav-icon" />
                <span>Brands</span>
            </Link>
            <Link href="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
                <FiShoppingBag className="nav-icon" />
                <span>My Orders</span>
            </Link>
            <Link href="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                <FiUser className="nav-icon" />
                <span>Profile</span>
            </Link>
        </div>
    );
};

export default MobileBottomNav;
