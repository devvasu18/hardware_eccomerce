'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
    id: string;
    username: string;
    role: string;
    customerType: string;
    wholesaleDiscount?: number;
    mobile?: string;
    savedAddresses?: Array<{
        _id?: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        landmark?: string;
        isDefault?: boolean;
    }>;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
    onLoginCallbacks: Array<() => void>;
    registerLoginCallback: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginCallbacks, setLoginCallbacks] = useState<Array<() => void>>([]);

    useEffect(() => {
        // Check localStorage on mount
        const token = localStorage.getItem('token');
        if (token) {
            // Validate token logic could go here
            // For now, assume if token exists, we try to fetch 'me' or just use stored user
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    }, []);

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

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart'); // Clear cart on logout
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            loading,
            onLoginCallbacks: loginCallbacks,
            registerLoginCallback
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
