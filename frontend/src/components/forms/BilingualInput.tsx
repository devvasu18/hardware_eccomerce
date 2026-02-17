import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';

interface BilingualInputProps {
    label: string;
    registerEn: UseFormRegisterReturn;
    registerHi: UseFormRegisterReturn;
    errorEn?: FieldError;
    errorHi?: FieldError;
    placeholderEn?: string;
    placeholderHi?: string;
    required?: boolean;
    multiline?: boolean;
    rows?: number;
}

export default function BilingualInput({
    label,
    registerEn,
    registerHi,
    errorEn,
    errorHi,
    placeholderEn = "Enter text in English",
    placeholderHi = "हिंदी में टेक्स्ट दर्ज करें",
    required = false,
    multiline = false,
    rows = 3
}: BilingualInputProps) {
    const { language } = useLanguage();

    const inputStyles: React.CSSProperties = {
        width: '100%',
        padding: '0.5rem',
        background: 'var(--surface)',
        color: 'var(--text-primary)',
        borderRadius: '4px',
        fontFamily: 'inherit'
    };

    return (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 500 }}>
                    {label} {required && <span style={{ color: 'red' }}>*</span>}
                </label>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {language === 'en' ? 'English' : 'हिंदी'} Mode
                </div>
            </div>

            <div style={{ position: 'relative' }}>
                {/* English Input */}
                <div style={{ display: language === 'en' ? 'block' : 'none' }}>
                    {multiline ? (
                        <textarea
                            {...registerEn}
                            className="form-input"
                            placeholder={placeholderEn}
                            rows={rows}
                            style={{
                                ...inputStyles,
                                border: `1px solid ${errorEn ? 'var(--danger)' : 'var(--border)'}`,
                                resize: 'vertical'
                            }}
                        />
                    ) : (
                        <input
                            {...registerEn}
                            className="form-input"
                            placeholder={placeholderEn}
                            style={{
                                ...inputStyles,
                                border: `1px solid ${errorEn ? 'var(--danger)' : 'var(--border)'}`,
                            }}
                        />
                    )}
                    {errorEn && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errorEn.message}</span>}
                </div>

                {/* Hindi Input */}
                <div style={{ display: language === 'hi' ? 'block' : 'none' }}>
                    {multiline ? (
                        <textarea
                            {...registerHi}
                            className="form-input"
                            placeholder={placeholderHi}
                            rows={rows}
                            style={{
                                ...inputStyles,
                                border: `1px solid ${errorHi ? 'var(--danger)' : 'var(--border)'}`,
                                resize: 'vertical'
                            }}
                        />
                    ) : (
                        <input
                            {...registerHi}
                            className="form-input"
                            placeholder={placeholderHi}
                            style={{
                                ...inputStyles,
                                border: `1px solid ${errorHi ? 'var(--danger)' : 'var(--border)'}`,
                            }}
                        />
                    )}
                    {errorHi && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errorHi.message}</span>}
                </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                {language === 'en'
                    ? "Editing English version. Switch language to edit Hindi."
                    : "हिंदी संस्करण का संपादन। अंग्रेजी संपादित करने के लिए भाषा बदलें।"}
            </div>
        </div>
    );
}
