"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import './BrandsSection.css';
import { useLanguage } from '../../context/LanguageContext';



export default function BrandsSection({ config }: { config?: any }) {
    const { t } = useLanguage();
    const [brands, setBrands] = useState<any[]>([]);

    useEffect(() => {
        const fetchBrandsFromPublic = async () => {
            try {
                const res = await api.get('/brands/featured');
                // Show up to 12 brands in the grid
                setBrands(res.data.slice(0, 12));
            } catch (e) {
                console.error(e);
            }
        }
        fetchBrandsFromPublic();
    }, []);

    if (brands.length === 0) return null;

    return (
        <section className="brands-section">
            <div className="container">
                <div className="brands-container">
                    <div className="brands-header">
                        <div>
                            <h2 className="brands-title">{config?.title || t('our_partner_brands')}</h2>
                            {config?.subtitle && <p className="brands-subtitle">{config.subtitle}</p>}
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
