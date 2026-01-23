"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../utils/api';

export default function CategorySection() {
    const [categories, setCategories] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Try public route
                const res = await api.get('/categories');
                // Assuming standard route exists from previous steps
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
            else if (window.innerWidth < 1024) setItemsPerPage(3);
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
        }, 3500); // Slightly slower than Brands
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
        <section style={{ padding: '3rem 0', background: '#F8FAFC' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Browse Categories</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Find exactly what you need</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={prevSlide} className="nav-btn-cat"><FiChevronLeft /></button>
                            <button onClick={nextSlide} className="nav-btn-cat"><FiChevronRight /></button>
                        </div>
                    </div>
                </div>

                <div style={{ overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex',
                        gap: '2rem',
                        transition: 'transform 0.5s ease-in-out',
                        transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
                        padding: '1rem 0.5rem' // Padding for shadows
                    }}>
                        {categories.map((cat, idx) => (
                            <Link
                                href={`/products?category=${cat.slug}`}
                                key={idx}
                                style={{
                                    minWidth: `calc(${100 / itemsPerPage}% - 1.75rem)`,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                <div className="cat-circle" style={{
                                    width: '180px', height: '180px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    padding: '0',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s',
                                    border: '4px solid white',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <Image
                                            src={cat.imageUrl?.startsWith('http')
                                                ? cat.imageUrl
                                                : (cat.imageUrl ? `http://localhost:5000/${cat.imageUrl.startsWith('/') ? cat.imageUrl.slice(1) : cat.imageUrl}` : '/placeholder.png')}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            alt={cat.name}
                                            unoptimized={true}
                                        />
                                    </div>
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)', textAlign: 'center', fontSize: '0.95rem' }}>
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .nav-btn-cat {
                    width: 36px; height: 36px;
                    border-radius: 8px;
                    border: none;
                    background: white;
                    color: var(--text-main);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                }
                .nav-btn-cat:hover {
                    background: var(--primary);
                    color: white;
                }
                .cat-circle:hover {
                    border-color: var(--primary);
                    transform: translateY(-5px);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                }
            `}</style>
        </section>
    );
}
