'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Banner {
    _id: string;
    title: string;
    description: string; // Backend sends description
    image: string;
    position: string;
    isActive: boolean;
    textColor?: string;
    buttonColor?: string;
    buttonText?: string;
    buttonLink?: string;
}

const POSITION_STYLES: Record<string, React.CSSProperties> = {
    'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start', textAlign: 'left' },
    'top-center': { justifyContent: 'center', alignItems: 'flex-start', textAlign: 'center' },
    'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start', textAlign: 'right' },
    'center-left': { justifyContent: 'flex-start', alignItems: 'center', textAlign: 'left' },
    'center': { justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
    'center-right': { justifyContent: 'flex-end', alignItems: 'center', textAlign: 'right' },
    'bottom-left': { justifyContent: 'flex-start', alignItems: 'flex-end', textAlign: 'left' },
    'bottom-center': { justifyContent: 'center', alignItems: 'flex-end', textAlign: 'center' },
    'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end', textAlign: 'right' },
};

export default function HeroSlider() {
    const [slides, setSlides] = useState<Banner[]>([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch Banners
        fetch('http://localhost:5000/api/banners')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
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
        }, 5000);
        return () => clearInterval(timer);
    }, [slides]);

    return (
        slides.length === 0 ? null :
            <section style={{ position: 'relative', height: '600px', overflow: 'hidden', background: '#0F172A' }}>
                {slides.map((slide, index) => {
                    // Get alignment styles based on position
                    const posStyle = POSITION_STYLES[slide.position || 'center-left'] || POSITION_STYLES['center-left'];
                    const textColor = slide.textColor || '#ffffff';
                    const buttonColor = slide.buttonColor || '#0F172A';

                    return (
                        <div
                            key={index}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                opacity: index === current ? 1 : 0,
                                transition: 'opacity 1s ease-in-out',
                                backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${slide.image.startsWith('http') ? slide.image : `http://localhost:5000/${slide.image}`})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                ...posStyle, // Apply alignment
                                color: textColor,
                                padding: '4rem' // Inner padding for edges
                            }}
                        >
                            <div className="container" style={{ maxWidth: '800px' }}>
                                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: 800, color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    {slide.title}
                                </h1>
                                <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: textColor, textShadow: '0 1px 2px rgba(0,0,0,0.5)', opacity: 0.9 }}>
                                    {slide.description}
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: posStyle.justifyContent === 'flex-start' ? 'flex-start' : posStyle.justifyContent === 'flex-end' ? 'flex-end' : 'center' }}>
                                    <Link href={slide.buttonLink || '/products'} className="btn" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: buttonColor, color: 'white', border: 'none' }}>
                                        {slide.buttonText || 'Shop Now'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Dots */}
                {slides.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '0.5rem', zIndex: 10 }}>
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: idx === current ? 'white' : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>
    );
}
