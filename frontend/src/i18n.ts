
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const isClient = typeof window !== 'undefined';

if (isClient) {
    i18n
        .use(HttpBackend)
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
        backend: isClient ? {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        } : undefined,
        resources: !isClient ? {
            en: { translation: {} },
            hi: { translation: {} }
        } : undefined,
        detection: {
            order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage', 'cookie'],
        },
        react: {
            useSuspense: false, // Avoid suspense on server
        }
    });

export default i18n;
