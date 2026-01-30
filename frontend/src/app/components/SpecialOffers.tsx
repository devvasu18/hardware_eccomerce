'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './SpecialOffers.css';

interface Product {
    _id: string;
    name?: string;
    title?: string;
    category: string;
    images?: string[];
    imageUrl?: string;
    featured_image?: string;
    gallery_images?: string[];
}

interface SpecialOffer {
    _id: string;
    productId: Product;
    title: string;
    badge: string;
    discountPercent: number;
    originalPrice: number;
    offerPrice: number;
    endDate: string;
    isLimitedStock: boolean;
}

export default function SpecialOffers() {
    const [offers, setOffers] = useState<SpecialOffer[]>([]);
    const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch special offers from API
        async function fetchOffers() {
            try {
                const res = await fetch('http://localhost:5000/api/special-offers');
                if (res.ok) {
                    const data = await res.json();
                    console.log('Special Offers Data:', data);
                    console.log('First offer product:', data[0]?.productId);
                    setOffers(data);
                }
            } catch (error) {
                console.error('Error fetching special offers:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchOffers();
    }, []);

    useEffect(() => {
        if (offers.length === 0) return;

        const timer = setInterval(() => {
            const newTimeLeft: { [key: string]: string } = {};

            offers.forEach(offer => {
                const now = new Date().getTime();
                const end = new Date(offer.endDate).getTime();
                const distance = end - now;

                if (distance > 0) {
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    newTimeLeft[offer._id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                } else {
                    newTimeLeft[offer._id] = 'EXPIRED';
                }
            });

            setTimeLeft(newTimeLeft);
        }, 1000);

        return () => clearInterval(timer);
    }, [offers]);

    if (loading) {
        return null; // Or a loading skeleton
    }

    if (offers.length === 0) {
        return null; // Don't show section if no offers
    }

    return (
        <section className="special-offers">
            <div className="container">
                <div className="offers-header">
                    <div className="offers-title-section">

                        <h2 className="offers-title">Special Deals This Week</h2>
                        <p className="offers-subtitle">
                            Grab these exclusive deals before they're gone. Wholesale prices slashed even further!
                        </p>
                    </div>
                </div>

                <div className="deals-grid">
                    {offers.map((offer) => (
                        <div key={offer._id} className="deal-card">
                            <div className="deal-badge-container">


                            </div>

                            <div className="deal-image-container">
                                <div className="discount-circle">
                                    <div className="discount-percent">{offer.discountPercent}%</div>
                                    <div className="discount-text">OFF</div>
                                </div>
                                {(() => {
                                    const product = offer.productId;
                                    if (!product) {
                                        return (
                                            <div className="deal-image-placeholder">
                                                <span className="image-icon">📦</span>
                                            </div>
                                        );
                                    }

                                    // Check for image in order of preference
                                    const imageUrl = product.featured_image
                                        || product.gallery_images?.[0]
                                        || product.imageUrl
                                        || product.images?.[0];

                                    if (!imageUrl) {
                                        return (
                                            <div className="deal-image-placeholder">
                                                <span className="image-icon">📦</span>
                                            </div>
                                        );
                                    }

                                    const fullImageUrl = imageUrl.startsWith('http')
                                        ? imageUrl
                                        : `http://localhost:5000/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;

                                    return (
                                        <Image
                                            src={fullImageUrl}
                                            alt={offer.title}
                                            width={240}
                                            height={130}
                                            className="deal-product-image"
                                            unoptimized={true}
                                        />
                                    );
                                })()}
                            </div>

                            <div className="deal-content">
                                <div className="deal-category ">{offer.productId?.title || 'Auto Parts'}</div>


                                <div className="deal-pricing">
                                    <div className="price-row">
                                        <span className="original-price">₹{offer.originalPrice.toLocaleString()}</span>
                                        <span className="savings-badge">
                                            Save ₹{(offer.originalPrice - offer.offerPrice).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="discounted-price">₹{offer.offerPrice.toLocaleString()}</div>
                                </div>

                                <div className="deal-timer">
                                    <div className="timer-icon">⏰</div>
                                    <div className="timer-content">
                                        <div className="timer-label">Ends in:</div>
                                        <div className="timer-value">{timeLeft[offer._id] || 'Loading...'}</div>
                                    </div>
                                </div>

                                <Link href={`/products/${offer.productId?._id}`} className="deal-cta">
                                    Grab This Deal
                                    <span className="cta-arrow">→</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="view-all-deals">
                    <Link href="/special-deals" className="view-all-deals-btn">
                        View All Special Offers
                        <span className="btn-shine" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
