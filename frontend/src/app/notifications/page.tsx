'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification, Notification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import { FiClock, FiCheck, FiInfo, FiAlertCircle, FiBox } from 'react-icons/fi';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import './notifications.css';

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const { notifications, markAsRead, markAllAsRead, loading: notifLoading } = useNotification();
    const router = useRouter();
    const { t, language } = useLanguage();
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
                    {t('notifications_loading')}
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
                    {t('notifications_login_required')}
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
                    <h1>{t('notifications_page_title')}</h1>
                    <div className="header-actions">
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
                                onClick={() => setFilter('ALL')}
                            >
                                {t('notifications_all')}
                            </button>
                            <button
                                className={`filter-tab ${filter === 'UNREAD' ? 'active' : ''}`}
                                onClick={() => setFilter('UNREAD')}
                            >
                                {t('notifications_unread')}
                            </button>
                        </div>
                        {notifications.some(n => !n.isRead) && (
                            <button className="mark-all-btn" onClick={() => markAllAsRead()}>
                                {t('notifications_mark_all_read')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="notifications-list-wrapper">
                    {filteredNotifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔕</div>
                            <h3>{t('notifications_empty_title')}</h3>
                            <p>{t('notifications_empty_desc')}</p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {filteredNotifications.map((notif) => {
                                // Localize "New Order Received" message if applicable
                                let displayMessage = notif.message;
                                if (notif.type === 'ORDER' && notif.title === 'Order Update' && notif.message === 'New Order Received') {
                                    displayMessage = t('new_order_received');
                                }

                                return (
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
                                                    {new Date(notif.createdAt).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US')}
                                                </span>
                                            </div>
                                            <p className="notif-message">{displayMessage}</p>
                                        </div>
                                        {!notif.isRead && <div className="unread-dot"></div>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
