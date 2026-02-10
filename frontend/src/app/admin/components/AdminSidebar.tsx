'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    FiChevronDown,
    FiChevronRight,
    FiGrid,
    FiTruck,
    FiFileText,
    FiShoppingBag,
    FiTag,
    FiPieChart,
    FiRefreshCw,
    FiSettings,
    FiUsers,
    FiShield,
    FiImage
} from 'react-icons/fi';
import { getSystemSettings } from '../../utils/systemSettings';

interface MenuItem {
    label: string;
    path: string;
    icon?: React.ReactNode;
    roles: string[];
    children?: MenuItem[];
}

export default function AdminSidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
        'Product Manager': false,
        'Stock Manager': false,
        'System Settings': false
    });
    const [companyName, setCompanyName] = useState('ADMIN');

    const isActive = (path: string) => {
        if (path === '/admin') {
            return pathname === '/admin';
        }
        return pathname === path || pathname?.startsWith(path + '/');
    };

    const isParentActive = (item: MenuItem) => {
        if (isActive(item.path)) return true;
        if (item.children) {
            return item.children.some(child => isActive(child.path));
        }
        return false;
    };

    const toggleMenu = (label: string) => {
        setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const menuItems: MenuItem[] = [
        { label: 'Dashboard', path: '/admin', icon: <FiGrid />, roles: ['super_admin', 'ops_admin'] },

        // Grouped Product Manager
        {
            label: 'Product Manager',
            path: '#',
            icon: <FiShoppingBag />,
            roles: ['super_admin', 'ops_admin'],
            children: [
                { label: 'HSN Code', path: '/admin/masters/hsn', roles: ['super_admin'] },
                { label: 'Categories', path: '/admin/categories', roles: ['super_admin', 'ops_admin'] },
                { label: 'Sub-Categories', path: '/admin/masters/sub-categories', roles: ['super_admin'] },
                { label: 'Brands', path: '/admin/masters/brands', roles: ['super_admin'] },
                { label: 'Offers', path: '/admin/masters/offers', roles: ['super_admin'] },
                { label: 'Products', path: '/admin/products', roles: ['super_admin', 'ops_admin'] },
            ]
        },

        { label: 'On Demand Request', path: '/admin/requests', icon: <FiFileText />, roles: ['super_admin', 'ops_admin', 'support_staff'] },

        {
            label: 'Stock Manager', path: '/admin/stock', icon: <FiGrid />, roles: ['super_admin', 'ops_admin', 'logistics_admin'], children: [
                { label: 'Stock Entry', path: '/admin/stock', roles: ['super_admin', 'ops_admin'] },
                { label: 'Party Master', path: '/admin/masters/parties', roles: ['super_admin', 'ops_admin'] }
            ]
        },

        { label: 'Banner Manager', path: '/admin/banners', icon: <FiImage />, roles: ['super_admin', 'ops_admin'] },
        { label: 'Coupons', path: '/admin/coupons', icon: <FiTag />, roles: ['super_admin', 'ops_admin'] },
        { label: 'Special Deals', path: '/admin/special-deals', icon: <FiTag />, roles: ['super_admin', 'ops_admin'] },

        { label: 'User Management', path: '/admin/users', icon: <FiUsers />, roles: ['super_admin'] },

        { label: 'Orders & Logistics', path: '/admin/orders', icon: <FiTruck />, roles: ['super_admin', 'ops_admin', 'logistics_admin'] },
        { label: 'Transactions', path: '/admin/transactions', icon: <FiFileText />, roles: ['super_admin', 'accounts_admin'] },

        { label: 'Returns & Refunds', path: '/admin/returns', icon: <FiRefreshCw />, roles: ['super_admin', 'ops_admin', 'accounts_admin'] },

        // Grouped System Settings
        {
            label: 'System Settings',
            path: '#',
            icon: <FiSettings />,
            roles: ['super_admin'],
            children: [
                { label: 'System Settings', path: '/admin/settings/system', roles: ['super_admin'] },
                { label: 'System Logs', path: '/admin/logs', roles: ['super_admin'] },
                { label: 'WhatsApp Integration', path: '/admin/settings/whatsapp', roles: ['super_admin'] }

            ]
        },

        {
            label: 'Business Intelligence',
            path: '#',
            icon: <FiPieChart />,
            roles: ['super_admin', 'ops_admin'],
            children: [
                { label: 'Strategic Overview', path: '/admin/analytics/intelligence', roles: ['super_admin'] },
                { label: 'Product Analytics', path: '/admin/analytics/products', roles: ['super_admin'] },
                { label: 'Customer Insights', path: '/admin/analytics/customers', roles: ['super_admin'] }
            ]
        },

        { label: 'Tally & Accounting', path: '/admin/tally', icon: <FiPieChart />, roles: ['super_admin', 'accounts_admin'] },
    ];

    // Auto-expand menu if child is active
    useEffect(() => {
        menuItems.forEach(item => {
            if (item.children && item.children.some(child => isActive(child.path))) {
            }
        });
    }, [pathname]);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getSystemSettings();
            if (settings && settings.companyName) {
                // Take first word or full name but uppercase
                const name = settings.companyName.split(' ')[0].toUpperCase();
                setCompanyName(name);
            }
        };
        fetchSettings();
    }, []);

    // TEMPORARY: Show all items for everyone for easier testing
    const filteredMenu = menuItems;

    return (
        <aside style={{
            width: collapsed ? '60px' : '260px',
            background: '#0F172A',
            color: 'white',
            transition: 'width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
            zIndex: 100,
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden' // Contain scroll
        }}>
            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', flexShrink: 0 }}>
                {!collapsed && <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F37021', letterSpacing: '1px' }}>{companyName}</span>}
                <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>
                    {collapsed ? '☰' : '◀'}
                </button>
            </div>

            <nav style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                {filteredMenu.map(item => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedMenus[item.label];
                    const active = isParentActive(item);

                    if (hasChildren) {
                        return (
                            <div key={item.label} style={{ marginBottom: '0.5rem' }}>
                                <div
                                    onClick={() => !collapsed && toggleMenu(item.label)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        cursor: collapsed ? 'default' : 'pointer',
                                        color: active ? 'white' : '#94a3b8',
                                        background: active && collapsed ? '#F37021' : 'transparent', // Highlight closed parent if active
                                        transition: 'all 0.2s',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.2rem', marginRight: collapsed ? 0 : '1rem', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                                        {!collapsed && <span style={{ fontWeight: 500 }}>{item.label}</span>}
                                    </div>
                                    {!collapsed && (isExpanded ? <FiChevronDown /> : <FiChevronRight />)}
                                </div>

                                {/* Children mapping */}
                                {!collapsed && isExpanded && (
                                    <div style={{ marginLeft: '1rem', marginTop: '0.25rem', borderLeft: '1px solid #334155', paddingLeft: '0.5rem' }}>
                                        {item.children!.map(child => (
                                            <Link
                                                href={child.path}
                                                key={child.path}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '0.6rem 1rem',
                                                    borderRadius: '6px',
                                                    textDecoration: 'none',
                                                    color: isActive(child.path) ? '#F37021' : '#cbd5e1', // Orange text when active child
                                                    fontSize: '0.9rem',
                                                    marginBottom: '0.25rem',
                                                    transition: 'all 0.2s',
                                                    background: isActive(child.path) ? 'rgba(243, 112, 33, 0.1)' : 'transparent'
                                                }}
                                            >
                                                {/* No icons for children, just text */}
                                                <span>{child.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            href={item.path}
                            key={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.75rem 1rem',
                                marginBottom: '0.5rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: isActive(item.path) ? 'white' : '#94a3b8',
                                background: isActive(item.path) ? '#F37021' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', marginRight: collapsed ? 0 : '1rem', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                            {!collapsed && <span style={{ fontWeight: 500 }}>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid #334155', flexShrink: 0 }}>
                {!collapsed && (
                    <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#1e293b', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.username}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{(user?.role || 'Guest').replace('_', ' ')}</div>
                    </div>
                )}
                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.5rem'
                    }}
                >
                    <span style={{ fontSize: '1.2rem', marginRight: collapsed ? 0 : '1rem' }}>🚪</span>
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
