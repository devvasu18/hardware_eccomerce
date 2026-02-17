'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductDetailsTabs({ product, brandName }: { product: any, brandName: any }) {
    const { getLocalized, t } = useLanguage();
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
                    {t('detail')}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'SIZE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SIZE')}
                >
                    {t('size_detail')}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'RETURN' ? 'active' : ''}`}
                    onClick={() => setActiveTab('RETURN')}
                >
                    {t('return_policy')}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'DELIVERY' ? 'active' : ''}`}
                    onClick={() => setActiveTab('DELIVERY')}
                >
                    {t('delivery_info')}
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'DETAIL' && (
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">{t('sku')}</span>
                            <span className="detail-value">IND-{product._id.slice(-6).toUpperCase()}</span>
                        </div>
                        {localizedBrand && (
                            <div className="detail-item">
                                <span className="detail-label">{t('brand')}</span>
                                <span className="detail-value">{localizedBrand}</span>
                            </div>
                        )}
                        <div className="detail-item">
                            <span className="detail-label">{t('country_of_origin')}</span>
                            <span className="detail-value">{localizedCountry || t('India')}</span>
                        </div>
                        {localizedMaterial && (
                            <div className="detail-item">
                                <span className="detail-label">{t('material')}</span>
                                <span className="detail-value">{localizedMaterial}</span>
                            </div>
                        )}
                        {localizedWarranty && (
                            <div className="detail-item">
                                <span className="detail-label">{t('warranty')}</span>
                                <span className="detail-value">{localizedWarranty}</span>
                            </div>
                        )}
                        {localizedDescription && (
                            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="detail-label">{t('description')}</span>
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
                        <p>{t('standard_sizing')}</p>
                    </div>
                )}
                {activeTab === 'RETURN' && (
                    <div style={{ padding: '1rem' }}>
                        <p>{t('return_policy_text')}</p>
                    </div>
                )}
                {activeTab === 'DELIVERY' && (
                    <div style={{ padding: '1rem' }}>
                        <p>{t('delivery_text')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
