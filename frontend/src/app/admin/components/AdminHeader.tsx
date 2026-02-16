'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    FiMenu,
    FiMaximize,
    FiBell,
    FiChevronDown,
    FiLogOut
} from 'react-icons/fi';
import Link from 'next/link';

interface AdminHeaderProps {
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: (value: boolean) => void;
}

export default function AdminHeader({ isSidebarCollapsed, setIsSidebarCollapsed }: AdminHeaderProps) {
    const { user, logout } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Mock notifications for now - in a real app these would come from a context or API
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'ORDER', message: 'New order #1234 received', isRead: false, createdAt: new Date().toISOString() },
        { id: 2, type: 'SYSTEM', message: 'System update scheduled', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
    ]);

    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Handle click outside to close dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const handleNotificationClick = (notif: any) => {
        // Mark as read
        const updated = notifications.map(n =>
            n.id === notif.id ? { ...n, isRead: true } : n
        );
        setNotifications(updated);
        // Navigate or show details logic here
        setIsNotificationsOpen(false);
    };

    const [companyName, setCompanyName] = useState('ADMIN');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Dynamically import to avoid build issues if file doesn't exist yet or path varies
                // But generally clean imports are better if we are sure.
                // Reverting to direct import if possible, but for now using the pattern seen in AdminSidebar
                // Actually, I'll just use the same logic as AdminSidebar
                const { getSystemSettings } = await import('../../utils/systemSettings');
                const settings = await getSystemSettings();
                if (settings && settings.companyName) {
                    const name = settings.companyName.split(' ')[0].toUpperCase();
                    setCompanyName(name);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <header className="admin-topbar">
            <div className="topbar-left">

                {isSidebarCollapsed && <span className="header-brand">{companyName}</span>}
            </div>

            <div className="topbar-right">
                <div className="icon-btn" onClick={handleFullScreen} title="Toggle Fullscreen">
                    <FiMaximize size={20} />
                </div>

                {/* Notification Bell */}
                <div className="icon-btn" ref={notificationRef} onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                    <div className="notification-icon-wrapper">
                        <FiBell size={20} />
                        {unreadCount > 0 && <span className="badge-dot" title={`${unreadCount} unread`}></span>}
                    </div>

                    {isNotificationsOpen && (
                        <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div className="notification-header">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <button className="text-btn-small" onClick={handleMarkAllRead}>
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="no-notif">No new notifications</div>
                                ) : (
                                    notifications.map((notif, idx) => (
                                        <div
                                            key={idx}
                                            className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <div className="notif-icon">
                                                {notif.type === 'ORDER' ? '💰' : '📢'}
                                            </div>
                                            <div className="notif-content">
                                                <p className="notif-msg">{notif.message}</p>
                                                <span className="notif-time">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className="profile-dropdown"
                    ref={profileRef}
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                >
                    <div className="profile-info">
                        <span className="profile-name">{user?.username || 'Admin User'}</span>
                        <span className="profile-role">{user?.role?.replace('_', ' ') || 'Staff'}</span>
                    </div>
                    <div className="profile-avatar">
                        {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <FiChevronDown size={14} style={{ opacity: 0.5, marginLeft: '8px' }} />

                    {isProfileDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); logout(); }}>
                                <FiLogOut size={16} />
                                <span>Logout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
