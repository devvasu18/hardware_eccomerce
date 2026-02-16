'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification, Notification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import { FiClock, FiCheck, FiInfo, FiAlertCircle, FiBox } from 'react-icons/fi';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import './notifications.css';

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const { notifications, markAsRead, markAllAsRead, loading: notifLoading } = useNotification();
    const router = useRouter();
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

    const filteredNotifications = filter === 'ALL'
        ? notifications
        : notifications.filter(n => !n.isRead);

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.isRead) {
            await markAsRead(notif._id);
        }
        if (notif.redirectUrl) {
            router.push(notif.redirectUrl);
        }
    };

    if (authLoading || notifLoading) {
        return (
            <>
                <Header />
                <div className="loading-state" style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    Loading notifications...
                </div>
                <Footer />
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Header />
                <div className="auth-required" style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    Please login to view notifications
                </div>
                <Footer />
            </>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'ORDER': return <FiBox className="notif-icon-img order" />;
            case 'SUCCESS': return <FiCheck className="notif-icon-img success" />;
            case 'WARNING': return <FiAlertCircle className="notif-icon-img warning" />;
            case 'ERROR': return <FiAlertCircle className="notif-icon-img error" />;
            default: return <FiInfo className="notif-icon-img info" />;
        }
    };

    return (
        <>
            <Header />
            <div className="notifications-page-container">
                <div className="notifications-header">
                    <h1>Notifications</h1>
                    <div className="header-actions">
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
                                onClick={() => setFilter('ALL')}
                            >
                                All
                            </button>
                            <button
                                className={`filter-tab ${filter === 'UNREAD' ? 'active' : ''}`}
                                onClick={() => setFilter('UNREAD')}
                            >
                                Unread
                            </button>
                        </div>
                        {notifications.some(n => !n.isRead) && (
                            <button className="mark-all-btn" onClick={() => markAllAsRead()}>
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>

                <div className="notifications-list-wrapper">
                    {filteredNotifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔕</div>
                            <h3>No notifications found</h3>
                            <p>You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {filteredNotifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    className={`notification-card ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="card-icon">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="card-content">
                                        <div className="card-header-row">
                                            <span className="notif-title">{notif.title}</span>
                                            <span className="notif-time">
                                                <FiClock size={12} style={{ marginRight: 4 }} />
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="notif-message">{notif.message}</p>
                                    </div>
                                    {!notif.isRead && <div className="unread-dot"></div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
