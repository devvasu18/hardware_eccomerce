'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    const menuItems = [
        { label: 'Dashboard', path: '/admin', icon: '📊', roles: ['super_admin', 'ops_admin'] },
        { label: 'Orders & Logistics', path: '/admin/orders', icon: '🚚', roles: ['super_admin', 'ops_admin', 'logistics_admin'] },
        { label: 'Procurement Requests', path: '/admin/requests', icon: '📝', roles: ['super_admin', 'ops_admin', 'support_staff'] },
        { label: 'Product Manager', path: '/admin/products', icon: '🛍️', roles: ['super_admin', 'ops_admin'] },
        { label: 'Tally & Accounting', path: '/admin/tally', icon: '💹', roles: ['super_admin', 'accounts_admin'] },
        { label: 'Returns & Refunds', path: '/admin/returns', icon: '🔄', roles: ['super_admin', 'ops_admin', 'accounts_admin'] },
        { label: 'User Management', path: '/admin/users', icon: '👥', roles: ['super_admin'] },
        { label: 'System Logs', path: '/admin/logs', icon: '🛡️', roles: ['super_admin'] },
        { label: 'Banner Config', path: '/admin/banners', icon: '🖼️', roles: ['super_admin', 'ops_admin'] },
    ];

    // Filter based on role (simple include check)
    // For MVP, if user.role is 'admin' (legacy) treat as super_admin
    // TEMPORARY: Show all items for everyone for easier testing/demo
    // const userRole = user?.role === 'admin' ? 'super_admin' : user?.role;
    // const filteredMenu = menuItems.filter(item => item.roles.includes(userRole || 'customer') || userRole === 'super_admin');
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
            zIndex: 100
        }}>
            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
                {!collapsed && <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F37021', letterSpacing: '1px' }}>CHAMUNDA</span>}
                <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>
                    {collapsed ? '☰' : '◀'}
                </button>
            </div>

            <nav style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                {filteredMenu.map(item => (
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
                        className="sidebar-link"
                    >
                        <span style={{ fontSize: '1.2rem', marginRight: collapsed ? 0 : '1rem' }}>{item.icon}</span>
                        {!collapsed && <span style={{ fontWeight: 500 }}>{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid #334155' }}>
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
