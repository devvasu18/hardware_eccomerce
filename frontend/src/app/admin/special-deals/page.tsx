'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormModal from '../../components/FormModal';
import DataTable from '../../components/DataTable';
import { useModal } from '../../hooks/useModal';
import { FiPlus } from 'react-icons/fi';

interface Product {
    _id: string;
    name?: string;
    title?: string;
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
    const [editId, setEditId] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');

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

            setOffers(Array.isArray(offersData) ? offersData : []);
            setProducts(Array.isArray(productsData) ? productsData : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setOffers([]);
            setProducts([]);
            setLoading(false);
        }
    };

    const startAdd = () => {
        resetForm();
        setIsFormModalOpen(true);
    };

    const handleEdit = (offer: SpecialOffer) => {
        const pId = offer.productId && typeof offer.productId === 'object'
            ? (offer.productId as Product)._id
            : (offer.productId as string) || '';

        let startDateStr = '';
        let endDateStr = '';
        try {
            startDateStr = new Date(offer.startDate).toISOString().split('T')[0];
            endDateStr = new Date(offer.endDate).toISOString().split('T')[0];
        } catch (e) {
            console.error("Date parsing error", e);
        }

        setFormData({
            productId: pId,
            title: offer.title,
            badge: offer.badge,
            discountPercent: offer.discountPercent,
            originalPrice: offer.originalPrice,
            offerPrice: offer.offerPrice,
            startDate: startDateStr,
            endDate: endDateStr,
            isActive: offer.isActive
        });
        setEditId(offer._id);
        setIsFormModalOpen(true);
    };

    const resetForm = () => {
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
        setEditId(null);
    };

    const handleCloseForm = () => {
        setIsFormModalOpen(false);
        setProductSearch('');
        resetForm();
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
                title: product.name || product.title || '',
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

    const handleOfferPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newOfferPrice = parseFloat(e.target.value) || 0;
        const original = formData.originalPrice;

        let newDiscount = 0;
        if (original > 0) {
            newDiscount = ((original - newOfferPrice) / original) * 100;
            newDiscount = Math.round(newDiscount * 10) / 10;
        }

        setFormData(prev => ({
            ...prev,
            offerPrice: newOfferPrice,
            discountPercent: newDiscount
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editId
                ? `http://localhost:5000/api/special-offers/${editId}`
                : 'http://localhost:5000/api/special-offers';
            const method = editId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                resetForm();
                fetchData();
                showSuccess(editId ? 'Special Offer updated successfully!' : 'Special Offer created successfully!');
                setIsFormModalOpen(false);
            } else {
                const err = await res.json();
                showError(err.message || (editId ? 'Failed to update offer' : 'Failed to create offer'));
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: 0 }}>Special Deals Management</h3>
                <button
                    onClick={startAdd}
                    className="btn btn-primary"
                    style={{
                        background: '#F37021',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <FiPlus /> Add Special Offer
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <DataTable
                    title="Active Special Deals"
                    data={offers}
                    columns={[
                        {
                            header: 'Deal Info',
                            accessor: (item) => (
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                                    <span className="badge badge-success" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{item.badge}</span>
                                </div>
                            ),
                            sortable: true
                        },
                        {
                            header: 'Product',
                            accessor: (item) => {
                                const prodName = item.productId && typeof item.productId === 'object'
                                    ? ((item.productId as Product).name || (item.productId as Product).title || 'Unnamed Product')
                                    : (item.productId as string) || 'Unknown Product';
                                return <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prodName}>{prodName}</div>
                            },
                            sortable: false
                        },
                        {
                            header: 'Price',
                            accessor: (item) => (
                                <div>
                                    <div style={{ fontWeight: 700, color: '#F37021' }}>₹{item.offerPrice}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{item.originalPrice}</div>
                                </div>
                            ),
                            sortable: true
                        },
                        { header: 'Discount', accessor: (item) => <span style={{ fontWeight: 600, color: '#16a34a' }}>{item.discountPercent}% OFF</span>, sortable: true },
                        {
                            header: 'Validity',
                            accessor: (item) => (
                                <div style={{ fontSize: '0.85rem' }}>
                                    <div>Start: {new Date(item.startDate).toLocaleDateString()}</div>
                                    <div>End: {new Date(item.endDate).toLocaleDateString()}</div>
                                </div>
                            ),
                            sortable: true
                        }
                    ]}
                    searchKeys={['title', 'badge']}
                    onEdit={handleEdit}
                    onDelete={(item) => handleDelete(item._id)}
                    itemsPerPage={10}
                />
            )}

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

            <FormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseForm}
                title={editId ? 'Edit Special Offer' : 'Add Special Offer'}
                maxWidth="800px"
            >
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                            Select Product {products.length > 0 && `(${products.length} products)`}
                        </label>
                        <input
                            type="text"
                            placeholder="🔍 Search product by name..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#F37021'}
                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        />
                        <select
                            className="input"
                            required
                            value={formData.productId}
                            onChange={handleProductChange}
                            disabled={loading}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
                        >
                            <option value="">
                                {loading ? '⏳ Loading products...' : products.length === 0 ? '⚠️ No products found' : '-- Select Product --'}
                            </option>
                            {products
                                .filter(p => (p.name || p.title || '').toLowerCase().includes(productSearch.toLowerCase()))
                                .map(p => (
                                    <option key={p._id} value={p._id}>{p.name || p.title || 'Unnamed Product'}</option>
                                ))
                            }
                            {/* Keep selected product in list even if filtered out */}
                            {formData.productId && !products
                                .filter(p => (p.name || p.title || '').toLowerCase().includes(productSearch.toLowerCase()))
                                .find(p => p._id === formData.productId) && (
                                    <option key={formData.productId} value={formData.productId}>
                                        {products.find(p => p._id === formData.productId)?.name || products.find(p => p._id === formData.productId)?.title || 'Selected Product'}
                                    </option>
                                )}
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
                            onChange={handleOfferPriceChange}
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

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={handleCloseForm}
                            className="btn"
                            style={{
                                background: '#cbd5e1',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                color: '#475569',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
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
                            {editId ? 'Update Offer' : 'Create Offer'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
