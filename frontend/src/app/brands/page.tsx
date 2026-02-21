"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '../utils/api';
import { FiGrid } from "react-icons/fi";
import Header from '../components/Header';
import Footer from '../components/Footer';
import { cache } from '@/utils/cache';

export default function BrandsPage() {
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cachedBrands = cache.get<any[]>('all_brands');
        if (cachedBrands) {
            setBrands(cachedBrands);
            setLoading(false);
        }

        const fetchBrands = async (isBackground = false) => {
            if (!isBackground) setLoading(true);
            try {
                const res = await api.get('/brands');
                setBrands(res.data);
                cache.set('all_brands', res.data, 60); // Cache brands for 60 minutes
            } catch (error) {
                console.error(error);
            } finally {
                if (!isBackground) setLoading(false);
            }
        };

        const isExpired = cache.isExpired('all_brands');
        if (isExpired || brands.length === 0) {
            fetchBrands(brands.length > 0);
        }
    }, []);

    return (
        <>
            <Header />
            <section className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem', minHeight: '60vh' }}>
                <div className="page-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Our Partner Brands</h1>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        We partner with the world's leading industrial manufacturers to bring you quality and reliability.
                    </p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#94A3B8' }}>Loading Brands...</div>
                ) : brands.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>No brands found.</div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '2rem'
                    }}>
                        {brands.map((brand) => (
                            <Link href={`/products?brand=${brand.slug}`} key={brand._id} style={{ textDecoration: 'none' }}>
                                <div className="card" style={{
                                    padding: '2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                    height: '100%',
                                    cursor: 'pointer',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                    }}
                                >
                                    <div style={{ position: 'relative', width: '100px', height: '80px', marginBottom: '1rem' }}>
                                        <Image
                                            src={(brand.logo || brand.logo_image)?.startsWith('http') ? (brand.logo || brand.logo_image) : ((brand.logo || brand.logo_image) ? `/${(brand.logo || brand.logo_image).startsWith('/') ? (brand.logo || brand.logo_image).slice(1) : (brand.logo || brand.logo_image)}` : '/placeholder-logo.png')}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                            alt={brand.name}
                                            unoptimized={true} // Bypasses optimization to avoid some local/remote issues
                                        />
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>{brand.name}</h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
            <Footer />
        </>
    );
}
