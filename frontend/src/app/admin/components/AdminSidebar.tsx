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
    FiImage,
    FiPower
} from 'react-icons/fi';
import { getSystemSettings } from '../../utils/systemSettings';

interface MenuItem {
    label: string;
    path: string;
    icon?: React.ReactNode;
    roles: string[];
    children?: MenuItem[];
}

interface AdminSidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export default function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    // const [collapsed, setCollapsed] = useState(false); // Removed internal state
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

        ,
        { label: 'Orders & Logistics', path: '/admin/orders', icon: <FiTruck />, roles: ['super_admin', 'ops_admin', 'logistics_admin'] },

        { label: 'On Demand Request', path: '/admin/requests', icon: <FiFileText />, roles: ['super_admin', 'ops_admin', 'support_staff'] },

        { label: 'Transactions', path: '/admin/transactions', icon: <FiFileText />, roles: ['super_admin', 'accounts_admin'] },

        { label: 'Returns & Refunds', path: '/admin/returns', icon: <FiRefreshCw />, roles: ['super_admin', 'ops_admin', 'accounts_admin'] },




        { label: 'Coupons', path: '/admin/coupons', icon: <FiTag />, roles: ['super_admin', 'ops_admin'] },
        { label: 'Special Deals', path: '/admin/special-deals', icon: <FiTag />, roles: ['super_admin', 'ops_admin'] },
        { label: 'Push Campaigns', path: '/admin/campaigns', icon: <FiTag />, roles: ['super_admin', 'ops_admin'] },
        { label: 'Pages', path: '/admin/pages', icon: <FiGrid />, roles: ['super_admin', 'ops_admin'] },






        { label: 'User Management', path: '/admin/users', icon: <FiUsers />, roles: ['super_admin'] },
        {
            label: 'Stock Manager', path: '/admin/stock', icon: <FiGrid />, roles: ['super_admin', 'ops_admin', 'logistics_admin'], children: [
                { label: 'Stock Entry', path: '/admin/stock', roles: ['super_admin', 'ops_admin'] },
                { label: 'Party Master', path: '/admin/masters/parties', roles: ['super_admin', 'ops_admin'] }
            ]
        },
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
        { label: 'Banner Manager', path: '/admin/banners', icon: <FiImage />, roles: ['super_admin', 'ops_admin'] },
        // Grouped System Settings
        {
            label: 'Settings',
            path: '#',
            icon: <FiSettings />,
            roles: ['super_admin'],
            children: [
                { label: 'System Settings', path: '/admin/settings/system', roles: ['super_admin'] },
                { label: 'Notification Settings', path: '/admin/settings/notifications', roles: ['super_admin'] },
                { label: 'WhatsApp Integration', path: '/admin/settings/whatsapp', roles: ['super_admin'] },
                { label: 'System Logs', path: '/admin/logs', roles: ['super_admin'] }

            ]
        },

        {
            label: 'Analytics',
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
                setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
            }
        });
    }, [pathname]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getSystemSettings();
                if (settings && settings.companyName) {
                    // Take first word or full name but uppercase
                    const name = settings.companyName.split(' ')[0].toUpperCase();
                    setCompanyName(name);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []);

    // TEMPORARY: Show all items for everyone for easier testing
    const filteredMenu = menuItems;

    return (
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!collapsed && <span className="logo-text">{companyName}</span>}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="toggle-btn"
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {collapsed ? <FiChevronRight size={20} /> : <FiChevronDown style={{ transform: 'rotate(90deg)' }} size={20} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {filteredMenu.map((item, index) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedMenus[item.label];
                    const active = isParentActive(item);

                    // Optional: Add group labels if needed, or separators

                    if (hasChildren) {
                        return (
                            <div key={item.label} className="menu-group">
                                <div
                                    onClick={() => !collapsed && toggleMenu(item.label)}
                                    className={`nav-item ${active ? 'active' : ''}`}
                                >
                                    <div className="nav-icon">{item.icon}</div>
                                    {!collapsed && (
                                        <>
                                            <span style={{ flex: 1 }}>{item.label}</span>
                                            <FiChevronDown className={`menu-arrow ${isExpanded ? 'expanded' : ''}`} />
                                        </>
                                    )}
                                </div>

                                {/* Children mapping */}
                                {!collapsed && isExpanded && (
                                    <div className="sub-menu">
                                        {item.children!.map(child => (
                                            <Link
                                                href={child.path}
                                                key={child.path}
                                                className={`sub-nav-item ${isActive(child.path) ? 'active' : ''}`}
                                            >
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
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <div className="nav-icon">{item.icon}</div>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                {/* Profile and Logout moved to Header */}
            </div>
        </aside>
    );
}

