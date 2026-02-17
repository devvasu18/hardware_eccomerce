'use client';

import { useEffect, ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    maxWidth?: string;
}

export default function FormModal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '600px'
}: FormModalProps) {
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
                    padding: '0',
                    maxWidth: maxWidth,
                    width: '90%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-xl)',
                    animation: 'slideUp 0.3s ease-out',
                    position: 'relative',
                    border: '1px solid var(--border)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div role="heading" aria-level={2} style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0,
                        flex: 1
                    }}>
                        {title}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            fontSize: '1.25rem',
                            display: 'flex',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FiX />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: '1.5rem',
                    overflowY: 'auto'
                }}>
                    {children}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
