'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductDetailsTabs({ product, brandName }: { product: any, brandName: any }) {
    const { getLocalized } = useLanguage();
    const [activeTab, setActiveTab] = useState('DETAIL');

    const localizedBrand = getLocalized(brandName);
    const localizedWarranty = getLocalized(product.warranty);
    const localizedMaterial = getLocalized(product.material);
    const localizedCountry = getLocalized(product.countryOfOrigin);
    const localizedDescription = getLocalized(product.description);

    return (
        <div className="product-tabs">
            <div className="tabs-header">
                <button
                    className={`tab-btn ${activeTab === 'DETAIL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('DETAIL')}
                >
                    DETAIL
                </button>
                <button
                    className={`tab-btn ${activeTab === 'SIZE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SIZE')}
                >
                    SIZE DETAIL
                </button>
                <button
                    className={`tab-btn ${activeTab === 'RETURN' ? 'active' : ''}`}
                    onClick={() => setActiveTab('RETURN')}
                >
                    RETURN POLICY
                </button>
                <button
                    className={`tab-btn ${activeTab === 'DELIVERY' ? 'active' : ''}`}
                    onClick={() => setActiveTab('DELIVERY')}
                >
                    DELIVERY INFO
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'DETAIL' && (
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">SKU</span>
                            <span className="detail-value">IND-{product._id.slice(-6).toUpperCase()}</span>
                        </div>
                        {localizedBrand && (
                            <div className="detail-item">
                                <span className="detail-label">Brand</span>
                                <span className="detail-value">{localizedBrand}</span>
                            </div>
                        )}
                        <div className="detail-item">
                            <span className="detail-label">Country of Origin</span>
                            <span className="detail-value">{localizedCountry || 'India'}</span>
                        </div>
                        {localizedMaterial && (
                            <div className="detail-item">
                                <span className="detail-label">Material</span>
                                <span className="detail-value">{localizedMaterial}</span>
                            </div>
                        )}
                        {localizedWarranty && (
                            <div className="detail-item">
                                <span className="detail-label">Warranty</span>
                                <span className="detail-value">{localizedWarranty}</span>
                            </div>
                        )}
                        {localizedDescription && (
                            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="detail-label">Description</span>
                                <div
                                    className="detail-value ck-content"
                                    dangerouslySetInnerHTML={{ __html: localizedDescription }}
                                    style={{ lineHeight: '1.6' }}
                                />
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'SIZE' && (
                    <div style={{ padding: '1rem' }}>
                        <p>Standard sizing applies. Please refer to our size chart.</p>
                    </div>
                )}
                {activeTab === 'RETURN' && (
                    <div style={{ padding: '1rem' }}>
                        <p>7-day return policy for standard items. Customized items are non-returnable.</p>
                    </div>
                )}
                {activeTab === 'DELIVERY' && (
                    <div style={{ padding: '1rem' }}>
                        <p>Standard delivery: 3-5 business days across India.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
