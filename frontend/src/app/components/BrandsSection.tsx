"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import './BrandsSection.css';
import { useLanguage } from '../../context/LanguageContext';



import { CategorySkeleton } from './skeletons/HomeSkeleton';

export default function BrandsSection({ config }: { config?: any }) {
    const { t, language } = useLanguage();
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const displayTitle = (language === 'hi' && config?.showHindi && config?.titleHindi)
        ? config.titleHindi
        : (config?.title || t('our_partner_brands'));

    const displaySubtitle = (language === 'hi' && config?.showHindi && config?.subtitleHindi)
        ? config.subtitleHindi
        : (config?.subtitle || '');

    useEffect(() => {
        let mounted = true;
        const fetchBrandsFromPublic = async () => {
            try {
                const res = await api.get('/brands/featured');
                // Show up to 12 brands in the grid
                if (mounted) setBrands(res.data.slice(0, 12));
            } catch (e) {
                console.error(e);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchBrandsFromPublic();
        return () => { mounted = false; };
    }, []);

    if (loading) return <CategorySkeleton />;
    if (brands.length === 0) return null;

    return (
        <section className="brands-section">
            <div className="container">
                <div className="brands-container">
                    <div className="brands-header">
                        <div>
                            <h2 className="brands-title">{displayTitle}</h2>
                            {displaySubtitle && <p className="brands-subtitle">{displaySubtitle}</p>}
                        </div>
                        <Link href="/brands" className="brands-view-all-btn">
                            <span>{t('view_all_brands')}</span>
                            <FiArrowRight />
                        </Link>
                    </div>

                    <div className="brands-grid-wrapper">
                        {brands.map((brand, idx) => (
                            <Link
                                href={`/products?brand=${brand.slug || brand.name || brand._id}`}
                                key={idx}
                                className="brand-hexagon"
                            >
                                <div className="brand-hexagon-inner">
                                    <div className="brand-logo-wrapper">
                                        <Image
                                            src={(brand.logo || brand.logo_image)?.startsWith('http')
                                                ? (brand.logo || brand.logo_image)
                                                : ((brand.logo || brand.logo_image)
                                                    ? `/${(brand.logo || brand.logo_image).startsWith('/') ? (brand.logo || brand.logo_image).slice(1) : (brand.logo || brand.logo_image)}`
                                                    : '/placeholder-logo.png')}
                                            fill
                                            alt={brand.name}
                                            unoptimized={true}
                                        />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
