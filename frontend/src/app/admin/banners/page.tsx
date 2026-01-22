'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import './banners.css';

interface Banner {
    _id: string;
    title: string;
    subtitle: string;
    image: string;
    position: string;
    isActive: boolean;
    order: number;
}

const POSITIONS = [
    { label: 'Top Left', value: 'top-left' },
    { label: 'Top Center', value: 'top-center' },
    { label: 'Top Right', value: 'top-right' },
    { label: 'Center Left', value: 'center-left' },
    { label: 'Center', value: 'center' },
    { label: 'Center Right', value: 'center-right' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Bottom Center', value: 'bottom-center' },
    { label: 'Bottom Right', value: 'bottom-right' },
];

export default function BannerManager() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image: '',
        position: 'center',
        order: 0
    });
    const [editId, setEditId] = useState<string | null>(null);
    const { modalState, hideModal, showSuccess, showError, showModal } = useModal();

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/banners/admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setBanners(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (banner: Banner) => {
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle,
            image: banner.image,
            position: banner.position,
            order: banner.order
        });
        setEditId(banner._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({ title: '', subtitle: '', image: '', position: 'center', order: 0 });
        setEditId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editId
                ? `http://localhost:5000/api/banners/${editId}`
                : 'http://localhost:5000/api/banners';
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
                fetchBanners();
                showSuccess(editId ? 'Banner updated successfully!' : 'Banner has been added successfully!');
            }
        } catch (error) {
            showError('Failed to add banner. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        showModal(
            'Delete Banner',
            'Are you sure you want to delete this banner? This action cannot be undone.',
            'warning',
            {
                showCancel: true,
                confirmText: 'Delete',
                onConfirm: async () => {
                    try {
                        const res = await fetch(`http://localhost:5000/api/banners/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            fetchBanners();
                            showSuccess('Banner deleted successfully!');
                        } else {
                            throw new Error('Failed');
                        }
                    } catch (error) {
                        showError('Failed to delete banner. Please try again.');
                    }
                }
            }
        );
    };

    return (
        <div className="banner-container">
            <header className="page-header">
                <h1 className="page-title">Banner Management</h1>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-card"
            >
                <h3 className="card-title">
                    <span style={{ color: 'var(--primary)' }}>✦</span> {editId ? 'Edit Banner Slide' : 'Add New Hero Slide'}
                </h3>
                <div className="form-preview-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem' }}>
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Premium Engine Parts"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Subtitle</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Quality you can trust for every mile"
                                required
                                value={formData.subtitle}
                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Image URL</label>
                            <input
                                className="form-input"
                                placeholder="Unsplash URL recommended"
                                required
                                value={formData.image}
                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Text Position</label>
                            <select
                                className="form-input"
                                value={formData.position}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                            >
                                {POSITIONS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Display Order</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.order}
                                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="submit-area">
                            <button type="submit" className="btn-add">
                                {editId ? 'Update Banner Slide' : 'Add Banner Slide'}
                            </button>
                            {editId && (
                                <button type="button" onClick={resetForm} className="btn-cancel" style={{ marginLeft: '1rem', padding: '0.75rem 1.5rem', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="preview-panel" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                        <label className="form-label" style={{ marginBottom: '1rem', display: 'block', color: 'var(--text-muted)' }}>Live Preview</label>
                        <div className="banner-item" style={{ width: '100%', pointerEvents: 'none', margin: 0 }}>
                            <div className="banner-preview" style={{ height: '160px' }}>
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="banner-img" />
                                ) : (
                                    <div style={{ background: '#f1f5f9', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>Image Preview</div>
                                )}
                                <div className="banner-overlay">
                                    <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{formData.title || 'Main Title'}</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>{formData.subtitle || 'Your subtitle here'}</p>
                                </div>
                                <span className="banner-pos-badge" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>{formData.position}</span>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: '1.4' }}>
                            <strong style={{ color: 'var(--primary)' }}>Note:</strong> This is a thumbnail preview. The actual banner will fill the homepage hero section.
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="banners-grid">
                <AnimatePresence>
                    {loading ? (
                        <div className="empty-state">
                            <h3>Loading...</h3>
                            <p>Fetching your billboard slides</p>
                        </div>
                    ) : Array.isArray(banners) && banners.length > 0 ? (
                        banners.map((banner, index) => (
                            <motion.div
                                key={banner._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1 }}
                                className="banner-item"
                            >
                                <div className="banner-preview">
                                    <div className="banner-order-badge">{banner.order}</div>
                                    <span className="banner-pos-badge">
                                        {banner.position}
                                    </span>
                                    <img src={banner.image} alt={banner.title} className="banner-img" />
                                    <div className="banner-overlay">
                                        <h4 style={{ color: 'white', marginBottom: '0.2rem' }}>{banner.title}</h4>
                                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>{banner.subtitle}</p>
                                    </div>
                                </div>
                                <div className="banner-content">
                                    <div className="banner-title">{banner.title}</div>
                                    <div className="banner-subtitle">{banner.subtitle}</div>
                                    <div className="banner-actions">
                                        <button onClick={() => handleDelete(banner._id)} className="btn-delete">
                                            <span>Remove Slide</span>
                                        </button>
                                        <button onClick={() => handleEdit(banner)} className="btn-edit" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>Edit</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <h3>No Banners Yet</h3>
                            <p>Capture your customer's attention with a stunning homepage banner.</p>
                        </div>
                    )}
                </AnimatePresence>
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
