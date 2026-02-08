"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../utils/api';
import './BrandsSection.css';



export default function BrandsSection() {
    const [brands, setBrands] = useState<any[]>([]);

    useEffect(() => {
        fetchBrandsFromPublic();
    }, []);

    const fetchBrandsFromPublic = async () => {
        try {
            const res = await api.get('/brands/featured');
            // Take first 6 for the hex grid
            setBrands(res.data.slice(0, 6));
        } catch (e) {
            console.error(e);
        }
    }

    if (brands.length === 0) return null;

    return (
        <section className="brands-section">
            <div className="container">
                <div className="brands-container">
                    <h2 className="brands-title">Our Partner Brands</h2>

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
                                                    ? `http://localhost:5000/${brand.logo || brand.logo_image}`
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

                    <div className="view-all-btn-wrapper">
                        <Link href="/brands" className="brands-view-all-btn">
                            View All Brands
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    );
}
