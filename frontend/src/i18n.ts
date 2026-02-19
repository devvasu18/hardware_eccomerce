import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';

const isClient = typeof window !== 'undefined';

if (isClient) {
    i18n
        .use(LanguageDetector);
}

i18n
    .use(initReactI18next)
    .init({
        load: 'languageOnly',
        fallbackLng: 'en',
        supportedLngs: ['en', 'hi'],
        debug: process.env.NODE_ENV === 'development',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        resources: {
            en: { translation: enTranslation },
            hi: { translation: hiTranslation }
        },
        detection: {
            order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage', 'cookie'],
        },
        react: {
            useSuspense: false, // Avoid suspense on server
        }
    });

export default i18n;
