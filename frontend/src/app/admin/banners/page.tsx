'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/banners', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormData({ title: '', subtitle: '', image: '', position: 'center', order: 0 });
                fetchBanners();
                showSuccess('Banner has been added successfully!');
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
                        await fetch(`http://localhost:5000/api/banners/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        fetchBanners();
                        showSuccess('Banner deleted successfully!');
                    } catch (error) {
                        showError('Failed to delete banner. Please try again.');
                    }
                }
            }
        );
    };

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Banner Management</h1>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>Add New Slide</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                        <label>Title</label>
                        <input className="input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Subtitle</label>
                        <input className="input" required value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Image URL (Unsplash recommended)</label>
                        <input className="input" required value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Text Position</label>
                        <select className="input" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}>
                            {POSITIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Order (0 = First)</label>
                        <input type="number" className="input" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })} />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <button type="submit" className="btn btn-primary">Add Banner</button>
                    </div>
                </form>
            </div>

            <div className="grid">
                {loading ? (
                    <p>Loading banners...</p>
                ) : Array.isArray(banners) && banners.length > 0 ? (
                    banners.map(banner => (
                        <div key={banner._id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                            <span className="badge" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                                Pos: {banner.position}
                            </span>
                            <div style={{ height: '150px', background: `url(${banner.image}) center/cover`, borderRadius: '4px', marginBottom: '1rem' }}></div>
                            <h4>{banner.title}</h4>
                            <p>{banner.subtitle}</p>
                            <button onClick={() => handleDelete(banner._id)} className="btn btn-outline" style={{ marginTop: '1rem', width: '100%', borderColor: 'red', color: 'red' }}>Delete</button>
                        </div>
                    ))
                ) : (
                    <p>No banners found. Add your first banner above!</p>
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
