'use client';
import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n'; // Initialize i18n

type Language = 'en' | 'hi';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: any) => string;
    getLocalized: (content: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const { i18n, t } = useTranslation();

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang).catch(err => {
            console.error(`[LanguageContext] Error changing language:`, err);
        });
        if (typeof window !== 'undefined') {
            localStorage.setItem('i18nextLng', lang);
        }
    };

    const currentLanguage = ((i18n.resolvedLanguage || i18n.language || 'en').startsWith('hi') ? 'hi' : 'en') as Language;

    const getLocalized = (content: any) => {
        if (!content) return '';
        if (typeof content === 'string') return content;

        // Handle bilingual objects like { en: "...", hi: "..." }
        const val = content[currentLanguage];
        if (val) return val;

        // Fallback to "en" if current language is not found in object
        return content['en'] || (typeof content === 'object' ? (Object.values(content).find(v => typeof v === 'string') || '') : '') || '';
    };

    // Update HTML lang attribute whenever language changes
    React.useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = currentLanguage;
        }
    }, [currentLanguage]);

    return (
        <LanguageContext.Provider value={{ language: currentLanguage, setLanguage, t, getLocalized }}>
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
            t: (key: string, params?: any) => {
                // Simple interpolation for fallback
                if (!params) return key;
                let result = key;
                Object.keys(params).forEach(paramKey => {
                    result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), params[paramKey]);
                });
                return result;
            },
            getLocalized: (content: any) => {
                if (!content) return '';
                if (typeof content === 'string') return content;
                return content['en'] || (typeof content === 'object' ? (Object.values(content).find(v => typeof v === 'string') || '') : '') || '';
            }
        };
    }
    return context;
}
