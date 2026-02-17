'use client';

import { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    showCancel = false
}: ModalProps) {
    const { t } = useLanguage();

    const displayConfirm = confirmText === 'OK' ? t('ok') : confirmText;
    const displayCancel = cancelText === 'Cancel' ? t('cancel_btn') : cancelText;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const getIconAndColor = () => {
        switch (type) {
            case 'success':
                return { icon: '✓', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'error':
                return { icon: '✕', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' };
            case 'warning':
                return { icon: '⚠', color: 'var(--primary)', bg: 'rgba(243, 112, 33, 0.1)' };
            default:
                return { icon: 'ℹ', color: 'var(--primary)', bg: 'rgba(59, 130, 246, 0.1)' };
        }
    };

    const { icon, color, bg } = getIconAndColor();

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--surface)',
                    borderRadius: '12px',
                    padding: '2rem',
                    maxWidth: '450px',
                    width: '90%',
                    boxShadow: 'var(--shadow-xl)',
                    animation: 'slideUp 0.3s ease-out',
                    position: 'relative',
                    border: '1px solid var(--border)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: color,
                        border: `1px solid ${color}33`
                    }}
                >
                    {icon}
                </div>

                {/* Title */}
                <h2
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        marginBottom: '0.75rem',
                        color: 'var(--text-primary)'
                    }}
                >
                    {title}
                </h2>

                {/* Message */}
                <p
                    style={{
                        fontSize: '1rem',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        marginBottom: '2rem',
                        lineHeight: '1.6'
                    }}
                >
                    {message}
                </p>

                {/* Buttons */}
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'center'
                    }}
                >
                    {showCancel && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: '2px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minWidth: '100px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.color = 'var(--primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            {displayCancel}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: color,
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '100px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        {displayConfirm}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
