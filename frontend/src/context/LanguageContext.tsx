'use client';
import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n'; // Initialize i18n

type Language = 'en' | 'hi';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    getLocalized: (content: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const { i18n, t } = useTranslation();

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('i18nextLng', lang);
        }
    };

    const getLocalized = (content: any) => {
        if (!content) return '';
        if (typeof content === 'string') return content;
        // Check if it's bilingual object
        const currentLang = i18n.language as Language || 'en';
        const val = content[currentLang];
        if (val) return val;
        return content['en'] || '';
    };

    return (
        <LanguageContext.Provider value={{ language: i18n.language as Language || 'en', setLanguage, t, getLocalized }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        // During SSR or if not wrapped in provider, return fallback
        console.warn('useLanguage used outside LanguageProvider, using fallback');
        return {
            language: 'en' as Language,
            setLanguage: () => { },
            t: (key: string) => key,
            getLocalized: (content: any) => {
                if (!content) return '';
                if (typeof content === 'string') return content;
                return content['en'] || content || '';
            }
        };
    }
    return context;
}
