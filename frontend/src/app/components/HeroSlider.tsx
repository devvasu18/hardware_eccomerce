'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Banner {
    _id: string;
    title: string;
    subtitle: string;
    image: string;
    position: string;
    isActive: boolean;
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

// Default fallbacks while loading or if no active banners
const DEFAULT_SLIDES = [
    {
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1600&auto=format&fit=crop',
        title: 'Industrial Grade. Precision Delivered.',
        subtitle: 'The single-vendor marketplace for mechanical parts, hardware, and heavy-duty components.',
        position: 'center'
    },
    {
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop',
        title: 'Modern Office Furniture',
        subtitle: 'Elevate your workspace with our premium collection of desks, chairs, and storage solutions.',
        position: 'center-left'
    },
    {
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1600&auto=format&fit=crop',
        title: 'Home Renovation Essentials',
        subtitle: 'From cabinet handles to door fittings, find the perfect hardware for your home.',
        position: 'center-right'
    }
];

export default function HeroSlider() {
    const [slides, setSlides] = useState<any[]>(DEFAULT_SLIDES);
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
        }, 5000); // 5s is better for reading
        return () => clearInterval(timer);
    }, [slides]);

    return (
        <section style={{ position: 'relative', height: '600px', overflow: 'hidden', background: '#0F172A' }}>
            {slides.map((slide, index) => {
                // Get alignment styles based on position
                const posStyle = POSITION_STYLES[slide.position || 'center'];

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
                            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url(${slide.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            ...posStyle, // Apply alignment
                            color: 'white',
                            padding: '4rem' // Inner padding for edges
                        }}
                    >
                        <div className="container" style={{ maxWidth: '800px' }}>
                            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: 800, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                {slide.title}
                            </h1>
                            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                {slide.subtitle}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: posStyle.justifyContent === 'flex-start' ? 'flex-start' : posStyle.justifyContent === 'flex-end' ? 'flex-end' : 'center' }}>
                                <Link href="/products" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                                    Browse Catalog
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
