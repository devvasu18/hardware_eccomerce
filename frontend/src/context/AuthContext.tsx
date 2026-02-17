'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
    id: string;
    username: string;
    role: string;
    customerType: string;
    wholesaleDiscount?: number;
    mobile?: string;
    email?: string;
    savedAddresses?: Array<{
        _id?: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        landmark?: string;
        isDefault?: boolean;
    }>;
    settings?: {
        theme: string;
        language: string;
        notifications: {
            email: boolean;
            whatsapp: boolean;
            sms: boolean;
        };
    };
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
    onLoginCallbacks: Array<() => void>;
    registerLoginCallback: (callback: () => void) => void;
    loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginCallbacks, setLoginCallbacks] = useState<Array<() => void>>([]);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                // If token is invalid, clear it
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Failed to load user:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const registerLoginCallback = useCallback((callback: () => void) => {
        setLoginCallbacks(prev => [...prev, callback]);
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Execute all login callbacks (e.g., cart sync)
        loginCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Login callback error:', error);
            }
        });
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Determine API URL (using env or defaultlocalhost)
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Logout API failed:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('cart'); // Clear cart on logout
            setUser(null);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            loading,
            onLoginCallbacks: loginCallbacks,
            registerLoginCallback,
            loadUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
