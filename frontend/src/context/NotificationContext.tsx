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
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                const res = await fetch(`/api/public/settings`);
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

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

        // Connect Socket
        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            const userId = (user as any)._id || user.id;
            console.log('🔗 Connected to Notification Service', newSocket.id);
            console.log('✨ Joining room with ID:', userId);
            newSocket.emit('join', userId);

            // Join role-based room
            if (user.role === 'admin' || user.role === 'super_admin') {
                newSocket.emit('join_role', 'admin');
            }
        });

        newSocket.on('notification', (notification: Notification) => {
            console.log('🔔 New Notification Received:', notification);

            // Add to state
            setNotifications((prev) => [notification, ...prev]);

            // Increment unread count
            setUnreadCount((prev) => prev + 1);

            // Play Sound
            playSound(notification.type);

            // Show Toast
            if (typeof toast !== 'undefined') {
                toast(notification.message, {
                    icon: '🔔',
                    duration: 4000
                });
            }
        });

        newSocket.on('connect_error', (err: any) => {
            console.error('Socket Connection Error:', err);
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
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
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
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
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
