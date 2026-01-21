'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import './WhyChooseUs.css';

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
    const [features, setFeatures] = useState<Feature[]>([]);
    const [trustIndicators, setTrustIndicators] = useState<TrustIndicator[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [featuresRes, indicatorsRes] = await Promise.all([
                    fetch('http://localhost:5000/api/homepage/features'),
                    fetch('http://localhost:5000/api/homepage/trust-indicators')
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

    return (
        <section className="why-choose-us">
            <div className="container">
                <div className="section-header-center">
                    <span className="section-badge">Why Choose Us</span>
                    <h2 className="section-title-center">Your Trusted Auto Parts Partner</h2>
                    <p className="section-description">
                        We combine quality products, competitive pricing, and exceptional service to power your automotive needs
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
                                    {feature.iconUrl ? (
                                        <Image
                                            src={feature.iconUrl}
                                            alt={feature.title}
                                            width={40}
                                            height={40}
                                            className="feature-icon-img"
                                        />
                                    ) : (
                                        <span className="feature-icon-placeholder">✓</span>
                                    )}
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
                            <div key={indicator._id}>
                                {index > 0 && <div className="trust-divider" />}
                                <div className="trust-item">
                                    <div className="trust-number">{indicator.value}</div>
                                    <div className="trust-label">{indicator.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
