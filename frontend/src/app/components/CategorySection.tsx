"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../utils/api';
import './CategorySection.css';

export default function CategorySection() {
    const [categories, setCategories] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data);
            } catch (error) {
                console.log("Category fetch fallback");
            }
        };
        fetchCategories();
    }, []);

    // Responsive
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setItemsPerPage(2);
            else if (window.innerWidth < 900) setItemsPerPage(3);
            else if (window.innerWidth < 1200) setItemsPerPage(4);
            else setItemsPerPage(5);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto Slide
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 4500);
        return () => clearInterval(interval);
    }, [currentIndex, categories.length, itemsPerPage]);

    const nextSlide = () => {
        if (categories.length <= itemsPerPage) return;
        setCurrentIndex(prev => (prev + 1) % (categories.length - itemsPerPage + 1));
    };

    const prevSlide = () => {
        if (categories.length <= itemsPerPage) return;
        setCurrentIndex(prev => (prev === 0 ? categories.length - itemsPerPage : prev - 1));
    };

    if (categories.length === 0) return null;

    return (
        <section className="category-section">
            <div className="container">
                <div className="category-header">
                    <h2 className="category-title">Browse Categories</h2>
                    <p className="category-subtitle">Find exactly what you need from our wide range of categories</p>
                </div>

                <div className="category-controls">
                    <button
                        onClick={prevSlide}
                        className="category-nav-btn"
                        aria-label="Previous categories"
                    >
                        <FiChevronLeft />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="category-nav-btn"
                        aria-label="Next categories"
                    >
                        <FiChevronRight />
                    </button>
                </div>

                <div className="category-carousel">
                    <div
                        className="category-track"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`
                        }}
                    >
                        {categories.map((cat, idx) => (
                            <Link
                                href={`/products?category=${cat.slug}`}
                                key={idx}
                                className="category-card"
                            >
                                <div className="category-image-wrapper">
                                    <div className="category-image-inner">
                                        <Image
                                            src={cat.imageUrl?.startsWith('http')
                                                ? cat.imageUrl
                                                : (cat.imageUrl
                                                    ? `http://localhost:5000/${cat.imageUrl.startsWith('/') ? cat.imageUrl.slice(1) : cat.imageUrl}`
                                                    : '/placeholder.png')}
                                            fill
                                            alt={cat.name}
                                            unoptimized={true}
                                        />
                                    </div>
                                </div>
                                <span className="category-name">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
