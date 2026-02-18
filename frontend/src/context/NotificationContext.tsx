'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast'; // Assuming toast exists or can be added

export interface Notification {
    _id: string;
    userId: string;
    role: string;
    title: string;
    message: string;
    type: 'ORDER' | 'SYSTEM' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PAYMENT' | 'STOCK' | 'CMS';
    entityId?: string;
    redirectUrl: string;
    isRead: boolean;
    priority: 'HIGH' | 'NORMAL' | 'LOW';
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [loading, setLoading] = useState(true);

    const [soundSettings, setSoundSettings] = useState({ enabled: true, sound: 'default' });

    // Fetch System Settings (Sound)
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/public/settings`);
                if (!res.ok) {
                    console.warn(`System settings fetch failed: ${res.status}`);
                    return;
                }
                const data = await res.json();
                if (data) {
                    setSoundSettings({
                        enabled: data.notificationSoundEnabled !== false,
                        sound: data.notificationSound || 'default'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch sound settings', error);
            }
        };
        fetchSettings();
    }, []);

    const playSound = (type: string) => {
        if (!soundSettings.enabled) return;

        let audioPath = '/sounds/order_alert.mp3'; // Default fallback

        if (soundSettings.sound && soundSettings.sound !== 'default') {
            audioPath = soundSettings.sound;
        } else {
            // Default logic based on type if 'default' is selected
            audioPath = type === 'ORDER' ? '/sounds/order_alert.mp3' : '/sounds/notification.mp3';
        }

        console.log(`🔊 Attempting to play sound: ${audioPath}`);

        try {
            const audio = new Audio(audioPath);
            audio.volume = 1.0;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('✅ Audio played successfully');
                    })
                    .catch((error) => {
                        console.warn('❌ Audio playback prevented by browser:', error);
                    });
            }
        } catch (err) {
            console.error('❌ Audio creation error:', err);
        }
    };

    // Initialize Socket & Fetch Data
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        // Determine backend URL for direct connection
        let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

        // If it's relative or empty in development, we fallback to localhost:5000
        if (!backendUrl || !backendUrl.startsWith('http')) {
            if (process.env.NODE_ENV === 'development') {
                backendUrl = 'http://localhost:5000';
            } else {
                backendUrl = ''; // Fallback to window.location.origin for relative paths
            }
        } else {
            // Remove /api suffix if present to get the base URL
            backendUrl = backendUrl.replace(/\/api$/, '').replace(/\/api\/$/, '');
        }

        console.log('📡 Initializing Socket.IO connection to:', backendUrl || 'relative origin');

        const newSocket = io(backendUrl || undefined, {
            path: '/socket.io',
            withCredentials: true,
            transports: ['websocket', 'polling'], // Prefer websocket as it's more stable for proxies/rewrites
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        // Function to re-sync state
        const syncNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const countRes = await fetch(`/api/notifications/unread-count`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (countRes.ok) {
                    const countData = await countRes.json();
                    if (countData.success) setUnreadCount(countData.count);
                }
            } catch (e) {
                console.error('Failed to sync notifications on connect', e);
            }
        };

        newSocket.on('connect', () => {
            const userId = (user as any)._id || user.id;
            console.log('✅ Connected to Notification Service!', newSocket.id);
            console.log('✨ Joining rooms for User:', userId);
            newSocket.emit('join', userId);

            // Join role-based room
            if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'ops_admin') {
                console.log('🛡️ Joining role room: admin');
                newSocket.emit('join_role', 'admin');
            }

            // Sync unread count immediately on connect/reconnect
            syncNotifications();
        });

        newSocket.on('notification', (notification: Notification) => {
            console.log('🔔 RECEIVED:', notification.title);

            // Avoid duplicates if same notification received multiple times (e.g. from role + user rooms)
            setNotifications((prev) => {
                const exists = prev.some(n => n._id === notification._id);
                if (exists) return prev;

                // Increment unread count only for NEW notifications
                setUnreadCount((count) => count + 1);
                return [notification, ...prev];
            });

            // Play Sound
            playSound(notification.type);

            // Show Toast
            if (typeof toast !== 'undefined') {
                toast(notification.message, {
                    icon: notification.type === 'ORDER' ? '🛒' : '🔔',
                    duration: 5000
                });
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('❌ Socket Disconnected:', reason);
        });

        newSocket.on('connect_error', (err: any) => {
            console.error('⚠️ Socket Connection Error:', err.message);
        });

        setSocket(newSocket);

        // Fetch Initial Data
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                const [notifsRes, countRes] = await Promise.all([
                    fetch(`/api/notifications?limit=20`, { headers }),
                    fetch(`/api/notifications/unread-count`, { headers })
                ]);

                if (notifsRes.ok && countRes.ok) {
                    const notifsData = await notifsRes.json();
                    const countData = await countRes.json();

                    if (notifsData.success) {
                        setNotifications(notifsData.notifications);
                    }
                    if (countData.success) {
                        setUnreadCount(countData.count);
                    }
                } else {
                    console.warn(`Notifications fetch failed: ${notifsRes.status} / ${countRes.status}`);
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Optimistic Update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            const notif = notifications.find(n => n._id === id);
            if (notif && !notif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

        } catch (error) {
            console.error('Mark read failed', error);
            // Revert on error? overly complex for now
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            await fetch(`/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Mark all read failed', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
