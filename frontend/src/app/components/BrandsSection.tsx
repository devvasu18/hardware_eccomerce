"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../utils/api';
import './BrandsSection.css';

export default function BrandsSection() {
    const [brands, setBrands] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    useEffect(() => {
        fetchBrandsFromPublic();
    }, []);

    const fetchBrandsFromPublic = async () => {
        try {
            const res = await api.get('/brands/featured');
            setBrands(res.data);
        } catch (e) {
            console.error(e);
        }
    }

    // Responsive items per page
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setItemsPerPage(2);
            else if (window.innerWidth < 900) setItemsPerPage(3);
            else if (window.innerWidth < 1200) setItemsPerPage(5);
            else setItemsPerPage(6);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto slide
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 4000);
        return () => clearInterval(interval);
    }, [currentIndex, brands.length, itemsPerPage]);

    const nextSlide = () => {
        if (brands.length <= itemsPerPage) return;
        setCurrentIndex(prev => (prev + 1) % (brands.length - itemsPerPage + 1));
    };

    const prevSlide = () => {
        if (brands.length <= itemsPerPage) return;
        setCurrentIndex(prev => (prev === 0 ? brands.length - itemsPerPage : prev - 1));
    };

    if (brands.length === 0) return null;

    return (
        <section className="brands-section">
            <div className="container">
                <div className="brands-header">
                    <div className="brands-title-group">
                        <h2 className="brands-title">Shop by Brands</h2>
                        <p className="brands-subtitle">Discover top-quality products from trusted manufacturers</p>
                    </div>
                    <div className="brands-controls">
                        <div className="brands-nav-buttons">
                            <button
                                onClick={prevSlide}
                                className="brand-nav-btn"
                                aria-label="Previous brands"
                            >
                                <FiChevronLeft />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="brand-nav-btn"
                                aria-label="Next brands"
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                        <Link href="/brands" className="brands-view-all">
                            View All Brands
                        </Link>
                    </div>
                </div>

                <div className="brands-carousel">
                    <div
                        className="brands-track"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`
                        }}
                    >
                        {brands.map((brand, idx) => (
                            <Link
                                href={`/products?brand=${brand.slug || brand.name || brand._id}`}
                                key={idx}
                                className="brand-card"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="brand-logo-wrapper">
                                    <Image
                                        src={(brand.logo || brand.logo_image)?.startsWith('http')
                                            ? (brand.logo || brand.logo_image)
                                            : ((brand.logo || brand.logo_image)
                                                ? `http://localhost:5000/${brand.logo || brand.logo_image}`
                                                : '/placeholder-logo.png')}
                                        fill
                                        alt={brand.name}
                                        unoptimized={true}
                                    />
                                </div>
                                <span className="brand-name">{brand.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
