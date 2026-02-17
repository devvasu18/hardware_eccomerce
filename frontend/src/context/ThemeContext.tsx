'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Load initial theme from localStorage or user settings
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        if (user?.settings?.theme) {
            setThemeState(user.settings.theme as Theme);
        } else if (storedTheme) {
            setThemeState(storedTheme);
        }
    }, [user]);

    // Update resolved theme based on theme choice and system preference
    useEffect(() => {
        const root = window.document.documentElement;

        const updateResolvedTheme = () => {
            let nextTheme: 'light' | 'dark' = 'light';

            if (theme === 'system') {
                nextTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            } else {
                nextTheme = theme as 'light' | 'dark';
            }

            setResolvedTheme(nextTheme);
            root.setAttribute('data-theme', nextTheme);

            // Add a class for specific overrides if needed
            if (nextTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        updateResolvedTheme();

        // Listen for system preference changes
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => updateResolvedTheme();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);

        // Sync with backend if logged in
        if (user) {
            try {
                const token = localStorage.getItem('token');
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                await fetch(`${API_URL}/auth/settings`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ theme: newTheme })
                });
            } catch (error) {
                console.error('Failed to sync theme with backend:', error);
            }
        }
    };

    const toggleTheme = () => {
        const next = resolvedTheme === 'light' ? 'dark' : 'light';
        setTheme(next);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
