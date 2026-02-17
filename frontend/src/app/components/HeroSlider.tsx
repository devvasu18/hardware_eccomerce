'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiPlay, FiZap } from 'react-icons/fi';
import './HeroSlider.css';
import { useLanguage } from '../../context/LanguageContext';

interface Banner {
    _id: string;
    title: string;
    description: string;
    image: string;
    position: string;
    isActive: boolean;
    textColor?: string;
    buttonColor?: string;
    buttonText?: string;
    buttonLink?: string;
    showSecondaryButton?: boolean;
    badgeText?: string;
    secondaryButtonColor?: string;
    offer_id?: {
        _id: string;
        title: string;
        percentage: number;
        slug: string;
    };
    product_ids?: string[];
}

export default function HeroSlider() {
    const { getLocalized } = useLanguage();
    const [slides, setSlides] = useState<Banner[]>([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/banners')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    console.log('Banners loaded:', data);
                    console.log('First banner offer_id:', data[0]?.offer_id);
                    setSlides(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch banners", err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides]);

    if (slides.length === 0) return null;

    return (
        <section className="hero-slider">
            {/* Floating Elements */}
            <div className="hero-float-element hero-float-1"></div>
            <div className="hero-float-element hero-float-2"></div>
            <div className="hero-float-element hero-float-3"></div>

            {slides.map((slide, index) => {
                const title = getLocalized(slide.title);
                const description = getLocalized(slide.description);
                const badgeText = getLocalized(slide.badgeText);
                const buttonText = getLocalized(slide.buttonText);

                // Compute the explore products link
                const exploreHref = slide.offer_id?.slug
                    ? `/products?offer=${slide.offer_id.slug}`
                    : '/products';

                // Debug logging
                if (index === current) {
                    console.log('Current slide:', slide.title);
                    console.log('Offer ID:', slide.offer_id);
                    console.log('Explore href:', exploreHref);
                }

                return (
                    <div
                        key={index}
                        className={`hero-slide ${index === current ? 'active' : ''}`}
                    >
                        <div
                            className="hero-background"
                            style={{
                                backgroundImage: `url(${slide.image.startsWith('http') ? slide.image : `http://localhost:5000/${slide.image}`})`
                            }}
                        ></div>
                        <div className="hero-overlay"></div>

                        <div className="hero-content-wrapper">
                            <div className="container">
                                <div className="hero-content" style={{ textAlign: slide.position?.includes('right') ? 'right' : slide.position?.includes('center') ? 'center' : 'left', marginLeft: slide.position?.includes('right') ? 'auto' : slide.position?.includes('center') ? 'auto' : '0', marginRight: slide.position?.includes('center') ? 'auto' : '0' }}>
                                    {(badgeText && badgeText !== '') && (
                                        <div className="hero-badge">
                                            <FiZap />
                                            <span>{badgeText}</span>
                                        </div>
                                    )}

                                    <h1 className="hero-title" style={{ color: slide.textColor }}>
                                        {title.split(' ').slice(0, -1).join(' ')}{' '}
                                        <span className="hero-title-gradient">
                                            {title.split(' ').slice(-1)}
                                        </span>
                                    </h1>

                                    <p className="hero-description" style={{ color: slide.textColor }}>
                                        {description}
                                    </p>

                                    <div className="hero-buttons" style={{ justifyContent: slide.position?.includes('right') ? 'flex-end' : slide.position?.includes('center') ? 'center' : 'flex-start' }}>
                                        {buttonText && (
                                            <Link
                                                href={slide.buttonLink || '/products'}
                                                className="hero-btn-primary"
                                                style={{ background: slide.buttonColor }}
                                            >
                                                <span>{buttonText}</span>
                                                <FiArrowRight />
                                            </Link>
                                        )}
                                        {(slide.showSecondaryButton !== false) && (
                                            <Link
                                                href={exploreHref}
                                                className="hero-btn-secondary"
                                                style={{ borderColor: slide.secondaryButtonColor || slide.textColor, color: slide.secondaryButtonColor || slide.textColor }}
                                            >
                                                <FiPlay />
                                                <span>Explore Products</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Dots */}
            {slides.length > 1 && (
                <div className="hero-dots">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={`hero-dot ${idx === current ? 'active' : ''}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
