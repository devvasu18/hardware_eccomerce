"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import './CategorySection.css';
import { useLanguage } from '../../context/LanguageContext';



export default function CategorySection({ config }: { config?: any }) {
    const { getLocalized, t } = useLanguage();
    const [categories, setCategories] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(8);

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

    // Responsive items per page
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setItemsPerPage(2);
            else if (window.innerWidth < 900) setItemsPerPage(4);
            else if (window.innerWidth < 1200) setItemsPerPage(6);
            else setItemsPerPage(8);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto slide
    useEffect(() => {
        if (categories.length === 0) return;

        const maxIndex = Math.max(0, categories.length - itemsPerPage);

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
        }, 3000);

        return () => clearInterval(interval);
    }, [categories.length, itemsPerPage]);

    if (categories.length === 0) return null;

    return (
        <section className="category-section">
            <div className="container">
                <div className="category-header">
                    <div>
                        <h2 className="category-title">{config?.title || t('browse_categories')}</h2>
                        <p className="category-subtitle">{config?.subtitle || t('categories_subtitle')}</p>
                    </div>
                    <Link href="/categories" className="view-all-btns">
                        <span>{t('view_all_categories')}</span>
                        <FiArrowRight />
                    </Link>
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
                                className="category-card-wrapper"
                                style={{ flex: `0 0 ${100 / itemsPerPage}%` }}
                            >
                                <div className="category-card">
                                    <div className="category-image-wrapper">
                                        <div className="category-image-inner">
                                            <Image
                                                src={cat.imageUrl?.startsWith('http')
                                                    ? cat.imageUrl
                                                    : (cat.imageUrl
                                                        ? `http://localhost:5000/${cat.imageUrl.startsWith('/') ? cat.imageUrl.slice(1) : cat.imageUrl}`
                                                        : '/placeholder.png')}
                                                fill
                                                alt={getLocalized(cat.name)}
                                                unoptimized={true}
                                            />
                                        </div>
                                    </div>

                                    <span className="category-name">{getLocalized(cat.name)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
