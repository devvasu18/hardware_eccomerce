'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './SpecialDealsPage.css';

interface Product {
    _id: string;
    name: string;
    category: string;
    images: string[];
    imageUrl: string;
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

export default function SpecialDealsPage() {
    const [offers, setOffers] = useState<SpecialOffer[]>([]);
    const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'ending-soon'>('all');

    useEffect(() => {
        async function fetchOffers() {
            try {
                const res = await fetch('http://localhost:5000/api/special-offers');
                if (res.ok) {
                    const data = await res.json();
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

    const getFilteredOffers = () => {
        const now = new Date().getTime();

        switch (filter) {
            case 'active':
                return offers.filter(offer => new Date(offer.endDate).getTime() > now);
            case 'ending-soon':
                const twoDaysFromNow = now + (2 * 24 * 60 * 60 * 1000);
                return offers.filter(offer => {
                    const endTime = new Date(offer.endDate).getTime();
                    return endTime > now && endTime <= twoDaysFromNow;
                });
            default:
                return offers;
        }
    };

    const filteredOffers = getFilteredOffers();

    if (loading) {
        return (
            <div className="special-deals-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading special deals...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="special-deals-page">
            <div className="container">
                {/* Page Header */}
                <div className="page-header">
                    <div className="breadcrumb">
                        <Link href="/">Home</Link>
                        <span className="separator">›</span>
                        <span className="current">Special Deals</span>
                    </div>

                    <h1 className="page-title">
                        <span className="title-icon">🔥</span>
                        Special Deals This Week
                    </h1>
                    <p className="page-subtitle">
                        Grab these exclusive deals before they're gone. Wholesale prices slashed even further!
                    </p>

                    {/* Filter Buttons */}
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Deals ({offers.length})
                        </button>
                        <button
                            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                            onClick={() => setFilter('active')}
                        >
                            Active Deals
                        </button>
                        <button
                            className={`filter-btn ${filter === 'ending-soon' ? 'active' : ''}`}
                            onClick={() => setFilter('ending-soon')}
                        >
                            Ending Soon ⏰
                        </button>
                    </div>
                </div>

                {/* Deals Grid */}
                {filteredOffers.length === 0 ? (
                    <div className="no-deals">
                        <div className="no-deals-icon">📦</div>
                        <h3>No deals found</h3>
                        <p>Check back later for amazing offers!</p>
                        <Link href="/" className="back-home-btn">
                            Back to Home
                        </Link>
                    </div>
                ) : (
                    <div className="deals-grid">
                        {filteredOffers.map((offer) => (
                            <div key={offer._id} className="deal-card">
                                <div className="deal-badge-container">
                                    {offer.isLimitedStock && (
                                        <div className="limited-badge">
                                            <span className="pulse-dot"></span>
                                            Limited Stock
                                        </div>
                                    )}
                                </div>

                                <div className="deal-image-container">
                                    <div className="discount-circle">
                                        <div className="discount-percent">{offer.discountPercent}%</div>
                                        <div className="discount-text">OFF</div>
                                    </div>
                                    {offer.productId?.imageUrl || offer.productId?.images?.[0] ? (
                                        <Image
                                            src={(offer.productId.imageUrl || offer.productId.images?.[0])?.startsWith('http')
                                                ? (offer.productId.imageUrl || offer.productId.images?.[0])
                                                : `http://localhost:5000/${(offer.productId.imageUrl || offer.productId.images?.[0])?.startsWith('/')
                                                    ? (offer.productId.imageUrl || offer.productId.images?.[0]).slice(1)
                                                    : (offer.productId.imageUrl || offer.productId.images?.[0])}`
                                            }
                                            alt={offer.title}
                                            width={240}
                                            height={130}
                                            className="deal-product-image"
                                            unoptimized={true}
                                        />
                                    ) : (
                                        <div className="deal-image-placeholder">
                                            <span className="image-icon">📦</span>
                                        </div>
                                    )}
                                </div>

                                <div className="deal-content">
                                    <div className="deal-category">{offer.productId?.category || 'Auto Parts'}</div>
                                    <h3 className="deal-product-name">{offer.title}</h3>

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
                )}
            </div>
        </div>
    );
}
