'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'hi' : 'en');
    };

    return (
        <div
            onClick={toggleLanguage}
            style={{
                position: 'relative',
                width: '64px',
                height: '32px',
                backgroundColor: 'var(--surface, #e5e7eb)',
                borderRadius: '9999px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                border: '1px solid var(--border, #d1d5db)',
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
            }}
            title="Switch Language"
        >
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'var(--primary, #3b82f6)',
                    x: language === 'en' ? 0 : 32
                }}
            >
                {language.toUpperCase()}
            </motion.div>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 8px',
                alignItems: 'center',
                pointerEvents: 'none',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--text-muted, #9ca3af)'
            }}>
                <span style={{ opacity: language === 'en' ? 0 : 1 }}>EN</span>
                <span style={{ opacity: language === 'hi' ? 0 : 1 }}>HI</span>
            </div>
        </div>
    );
}
