'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice?: number;
}

interface SpecialOffer {
    _id: string;
    productId: Product | string;
    title: string;
    badge: string;
    discountPercent: number;
    originalPrice: number;
    offerPrice: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export default function SpecialDealsManager() {
    const [offers, setOffers] = useState<SpecialOffer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        productId: '',
        title: '',
        badge: 'HOT DEAL',
        discountPercent: 0,
        originalPrice: 0,
        offerPrice: 0,
        startDate: '',
        endDate: '',
        isActive: true
    });

    const { modalState, hideModal, showSuccess, showError, showModal } = useModal();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [offerRes, productRes] = await Promise.all([
                fetch('http://localhost:5000/api/special-offers/admin/all', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/products')
            ]);

            const offersData = await offerRes.json();
            const productsData = await productRes.json();

            setOffers(offersData);
            setProducts(productsData);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pId = e.target.value;
        const product = products.find(p => p._id === pId);

        if (product) {
            const price = product.basePrice || 0;
            setFormData(prev => ({
                ...prev,
                productId: pId,
                originalPrice: price,
                title: product.name, // meaningful default
                offerPrice: prev.discountPercent ? price - (price * prev.discountPercent / 100) : price
            }));
        } else {
            setFormData(prev => ({ ...prev, productId: pId }));
        }
    };

    const calculateOfferPrice = (original: number, discount: number) => {
        return Math.round(original - (original * discount / 100));
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const disc = parseFloat(e.target.value) || 0;
        setFormData(prev => ({
            ...prev,
            discountPercent: disc,
            offerPrice: calculateOfferPrice(prev.originalPrice, disc)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/special-offers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setFormData({
                    productId: '',
                    title: '',
                    badge: 'HOT DEAL',
                    discountPercent: 0,
                    originalPrice: 0,
                    offerPrice: 0,
                    startDate: '',
                    endDate: '',
                    isActive: true
                });
                fetchData();
                showSuccess('Special Offer created successfully!');
            } else {
                const err = await res.json();
                showError(err.message || 'Failed to create offer');
            }
        } catch (error) {
            showError('Failed to create offer. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        showModal(
            'Delete Offer',
            'Are you sure you want to delete this special offer?',
            'warning',
            {
                showCancel: true,
                confirmText: 'Delete',
                onConfirm: async () => {
                    try {
                        const res = await fetch(`http://localhost:5000/api/special-offers/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        if (res.ok) {
                            fetchData();
                            showSuccess('Offer deleted successfully!');
                        } else {
                            showError('Failed to delete offer');
                        }
                    } catch (error) {
                        showError('Failed to delete offer. Please try again.');
                    }
                }
            }
        );
    };

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Special Deals Management</h1>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Add Special Offer</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Select Product</label>
                        <select
                            className="input"
                            required
                            value={formData.productId}
                            onChange={handleProductChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
                        >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                                <option key={p._id} value={p._id}>{p.name} (₹{p.basePrice})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Offer Title</label>
                        <input
                            className="input"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Monsoon Sale"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Badge Text</label>
                        <input
                            className="input"
                            required
                            value={formData.badge}
                            onChange={e => setFormData({ ...formData, badge: e.target.value })}
                            placeholder="e.g. HOT DEAL"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Original Price (₹)</label>
                        <input
                            type="number"
                            className="input"
                            readOnly
                            value={formData.originalPrice}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Discount (%)</label>
                        <input
                            type="number"
                            className="input"
                            min="0"
                            max="100"
                            value={formData.discountPercent}
                            onChange={handleDiscountChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Offer Price (Calculated)</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.offerPrice}
                            onChange={e => setFormData({ ...formData, offerPrice: parseFloat(e.target.value) })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 'bold', color: '#16a34a' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Start Date</label>
                        <input
                            type="date"
                            className="input"
                            required
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>End Date</label>
                        <input
                            type="date"
                            className="input"
                            required
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                background: '#F37021',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '6px',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#e65e0d'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#F37021'}
                        >
                            Create Offer
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid">
                {loading ? (
                    <p>Loading offers...</p>
                ) : Array.isArray(offers) && offers.length > 0 ? (
                    offers.map(offer => (
                        <div key={offer._id} className="card" style={{ position: 'relative' }}>
                            <span className="badge" style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white' }}>
                                {offer.discountPercent}% OFF
                            </span>
                            <h4>{offer.title}</h4>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                Product: {typeof offer.productId === 'object' ? (offer.productId as Product).name : 'Unknown Product'}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>₹{offer.originalPrice}</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#F37021' }}>₹{offer.offerPrice}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Ends: {new Date(offer.endDate).toLocaleDateString()}</p>

                            <button onClick={() => handleDelete(offer._id)} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', borderColor: 'red', color: 'red' }}>Delete</button>
                        </div>
                    ))
                ) : (
                    <p>No special offers found.</p>
                )}
            </div>

            <Modal
                isOpen={modalState.isOpen}
                onClose={hideModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
                showCancel={modalState.showCancel}
            />
        </div>
    );
}
