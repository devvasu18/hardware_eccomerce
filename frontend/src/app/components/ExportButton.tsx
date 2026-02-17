"use client";

import { useState } from 'react';
import { FiDownload, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

interface ExportButtonProps {
    onExport: (format: 'csv' | 'excel' | 'pdf') => Promise<void> | void;
    formats?: ('csv' | 'excel' | 'pdf')[];
    label?: string;
    className?: string;
    style?: React.CSSProperties;
}

export default function ExportButton({
    onExport,
    formats = ['csv', 'excel', 'pdf'],
    label = 'Export',
    className = '',
    style = {}
}: ExportButtonProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const displayLabel = label === 'Export' ? t('export') : label;

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        setIsExporting(true);
        setIsOpen(false);
        try {
            await onExport(format);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const formatLabels = {
        csv: 'CSV',
        excel: 'Excel (XLSX)',
        pdf: 'PDF'
    };

    const formatIcons = {
        csv: '📄',
        excel: '📊',
        pdf: '📕'
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className={`btn btn-outline ${className}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative',
                    ...style
                }}
                onMouseEnter={(e) => {
                    if (!isExporting) setIsOpen(true);
                }}
            >
                <FiDownload />
                {displayLabel}
                <FiChevronDown style={{
                    fontSize: '0.8rem',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
            </button>

            {isOpen && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 998
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            right: 0,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            minWidth: '180px',
                            zIndex: 999,
                            overflow: 'hidden',
                            animation: 'slideDown 0.2s ease-out'
                        }}
                        onMouseLeave={() => setIsOpen(false)}
                    >
                        <style>{`
                            @keyframes slideDown {
                                from {
                                    opacity: 0;
                                    transform: translateY(-10px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                        `}</style>
                        <div style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #f1f5f9'
                        }}>
                            {t('download_as')}
                        </div>
                        {formats.map((format) => (
                            <button
                                key={format}
                                onClick={() => handleExport(format)}
                                disabled={isExporting}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: 'none',
                                    background: 'white',
                                    textAlign: 'left',
                                    cursor: isExporting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    fontSize: '0.95rem',
                                    transition: 'background 0.15s',
                                    color: '#1e293b',
                                    fontWeight: 500
                                }}
                                onMouseEnter={(e) => {
                                    if (!isExporting) {
                                        e.currentTarget.style.background = '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white';
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{formatIcons[format]}</span>
                                <span style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>{formatLabels[format]}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
