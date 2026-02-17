'use client';

import { useState, useRef, useEffect } from 'react';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string;
    imageUrl?: string;
    images: string[];
    isOnDemand: boolean;
}

export default function NewArrivalsSlider({ products }: { products: Product[] }) {
    const { t } = useLanguage();
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    // Auto Scroll Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (!isHovering) {
            interval = setInterval(() => {
                if (sliderRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
                    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10; // tolerance

                    if (isAtEnd) {
                        sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        // Scroll amount equal to roughly one item width including gap
                        sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                    }
                }
            }, 3000); // 3 seconds
        }

        return () => clearInterval(interval);
    }, [isHovering]);

    // Manual Scroll Logic
    const scrollLeft = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    return (
        <div
            className="slider-container"
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Left Arrow - Minimal SVG */}
            <button
                onClick={scrollLeft}
                className="slider-arrow left"
                aria-label={t('scroll_left')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>

            <div
                className="slider-track-wrapper"
                ref={sliderRef}
            >
                {/* CSS moved to NewArrivals.css */}

                {products.map((item) => (
                    <div key={item._id} className="slider-item">
                        <ProductCard product={item} />
                    </div>
                ))}
            </div>

            {/* Right Arrow - Minimal SVG */}
            <button
                onClick={scrollRight}
                className="slider-arrow right"
                aria-label={t('scroll_right')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>
    );
}
