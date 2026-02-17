'use client';

import { useState, useEffect, Fragment } from 'react';
import './WhyChooseUs.css';
import { useLanguage } from '../../context/LanguageContext';


interface Feature {
    _id: string;
    title: string;
    description: string;
    iconUrl: string;
    color: string;
    stats?: string;
}

interface TrustIndicator {
    _id: string;
    label: string;
    value: string;
}

export default function WhyChooseUs() {
    const { t } = useLanguage();
    const [features, setFeatures] = useState<Feature[]>([]);
    const [trustIndicators, setTrustIndicators] = useState<TrustIndicator[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [featuresRes, indicatorsRes] = await Promise.all([
                    fetch('/api/homepage/features'),
                    fetch('/api/homepage/trust-indicators')
                ]);

                if (featuresRes.ok) {
                    const featuresData = await featuresRes.json();
                    setFeatures(featuresData);
                }

                if (indicatorsRes.ok) {
                    const indicatorsData = await indicatorsRes.json();
                    setTrustIndicators(indicatorsData);
                }
            } catch (error) {
                console.error('Error fetching homepage data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return null; // Or loading skeleton
    }

    if (features.length === 0) {
        return null; // Don't show section if no features
    }

    const renderIcon = (title: string) => {
        const iconStyle = { width: '40px', height: '40px', fill: 'white' };

        switch (title) {
            case 'Genuine Parts':
                return (
                    <svg viewBox="0 0 24 24" style={iconStyle}>
                        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
                    </svg>
                );
            case 'Fast Delivery':
                return (
                    <svg viewBox="0 0 24 24" style={iconStyle}>
                        <path d="M18 18.5a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5m1.5-9l1.96 2.5H17V9.5m-11 9A1.5 1.5 0 0 1 4.5 17 1.5 1.5 0 0 1 6 15.5 1.5 1.5 0 0 1 7.5 17 1.5 1.5 0 0 1 6 18.5M20 8h-3V4H3c-1.11 0-2 .89-2 2v11h2a3 3 0 0 0 3 3 3 3 0 0 0 3-3h6a3 3 0 0 0 3 3 3 3 0 0 0 3-3h2v-5l-3-4z" />
                    </svg>
                );
            case 'Wholesale Pricing':
                return (
                    <svg viewBox="0 0 24 24" style={iconStyle}>
                        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7zm11.77 8.27L13 19.54l-4.27-4.27C8.28 14.81 8 14.19 8 13.5c0-1.38 1.12-2.5 2.5-2.5.69 0 1.32.28 1.77.74l.73.72.73-.73c.45-.45 1.08-.73 1.77-.73 1.38 0 2.5 1.12 2.5 2.5 0 .69-.28 1.32-.73 1.77z" />
                    </svg>
                );
            case 'Expert Support':
                return (
                    <svg viewBox="0 0 24 24" style={iconStyle}>
                        <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                    </svg>
                );
            case 'Tally Integration':
                return (
                    <svg viewBox="0 0 24 24" style={iconStyle}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        <path d="M19 8l-1.41-1.42-5.59 5.59-2.59-2.59L8 11l4 4z" opacity="0.5" />
                    </svg>
                );
            case 'Trusted Partner':
                return (
                    <svg viewBox="0 0 24 24" style={iconStyle}>
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                );
            default:
                return <span className="feature-icon-placeholder">✓</span>;
        }
    };

    return (
        <section className="why-choose-us">
            <div className="container">
                <div className="section-header-center">
                    <span className="section-badge">{t('why_choose_us')}</span>
                    <h2 className="section-title-center">{t('trusted_hardware_partner')}</h2>
                    <p className="section-description">
                        {t('why_choose_us_desc')}
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature) => (
                        <div
                            key={feature._id}
                            className={`feature-card ${activeId === feature._id ? 'active' : ''}`}
                            onMouseEnter={() => setActiveId(feature._id)}
                            onMouseLeave={() => setActiveId(null)}
                        >
                            <div className="feature-icon-container">
                                <div
                                    className="feature-icon"
                                    style={{
                                        background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)`,
                                        boxShadow: `0 8px 24px -8px ${feature.color}66`
                                    }}
                                >
                                    {renderIcon(feature.title)}
                                </div>
                                {feature.stats && (
                                    <div className="feature-stats" style={{ color: feature.color }}>
                                        {feature.stats}
                                    </div>
                                )}
                            </div>

                            <div className="feature-content">
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>

                            <div
                                className="feature-glow"
                                style={{ background: `radial-gradient(circle at center, ${feature.color}15 0%, transparent 70%)` }}
                            />
                        </div>
                    ))}
                </div>

                {trustIndicators.length > 0 && (
                    <div className="trust-indicators">
                        {trustIndicators.map((indicator, index) => (
                            <Fragment key={indicator._id}>
                                {index > 0 && <div className="trust-divider" />}
                                <div className="trust-item">
                                    <div className="trust-number">{indicator.value}</div>
                                    <div className="trust-label">{indicator.label}</div>
                                </div>
                            </Fragment>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
