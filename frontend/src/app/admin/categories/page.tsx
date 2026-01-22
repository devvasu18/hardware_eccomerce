'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    displayOrder: number;
    isActive: boolean;
    gradient: string;
    productCount: number;
}

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        displayOrder: 0,
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        isActive: true
    });
    const [editId, setEditId] = useState<string | null>(null);

    const { modalState, hideModal, showSuccess, showError, showModal } = useModal();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCategories(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleEdit = (category: Category) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description,
            imageUrl: category.imageUrl,
            displayOrder: category.displayOrder,
            gradient: category.gradient,
            isActive: category.isActive
        });
        setEditId(category._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            imageUrl: '',
            displayOrder: 0,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            isActive: true
        });
        setEditId(null);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData({ ...formData, name, slug });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editId
                ? `http://localhost:5000/api/categories/${editId}`
                : 'http://localhost:5000/api/categories';
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
                fetchCategories();
                showSuccess(editId ? 'Category updated successfully!' : 'Category created successfully!');
            } else {
                const err = await res.json();
                showError(err.message || 'Failed to create category');
            }
        } catch (error) {
            showError('Failed to create category. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        showModal(
            'Delete Category',
            'Are you sure you want to delete this category? This might affect products linked to it.',
            'warning',
            {
                showCancel: true,
                confirmText: 'Delete',
                onConfirm: async () => {
                    try {
                        const res = await fetch(`http://localhost:5000/api/categories/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        if (res.ok) {
                            fetchCategories();
                            showSuccess('Category deleted successfully!');
                        } else {
                            showError('Failed to delete category');
                        }
                    } catch (error) {
                        showError('Failed to delete category. Please try again.');
                    }
                }
            }
        );
    };

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Category Management</h1>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{editId ? 'Edit Category' : 'Add New Category'}</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Category Name</label>
                        <input
                            className="input"
                            required
                            value={formData.name}
                            onChange={handleNameChange}
                            placeholder="e.g. Safety Gear"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Slug (URL Friendly)</label>
                        <input
                            className="input"
                            required
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Description</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the category..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Image URL</label>
                        <input
                            className="input"
                            required
                            value={formData.imageUrl}
                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Gradient CSS</label>
                        <input
                            className="input"
                            value={formData.gradient}
                            onChange={e => setFormData({ ...formData, gradient: e.target.value })}
                            placeholder="linear-gradient(...)"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Display Order</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.displayOrder}
                            onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
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
                            {editId ? 'Update Category' : 'Create Category'}
                        </button>
                        {editId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="btn"
                                style={{
                                    marginLeft: '1rem',
                                    background: '#cbd5e1',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    color: '#475569',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="grid">
                {loading ? (
                    <p>Loading categories...</p>
                ) : Array.isArray(categories) && categories.length > 0 ? (
                    categories.map(cat => (
                        <div key={cat._id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                            <div style={{
                                height: '100px',
                                background: cat.gradient || '#f1f5f9',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                marginBottom: '1rem',
                                position: 'relative'
                            }}>
                                <img src={cat.imageUrl} alt={cat.name} style={{ height: '80%', objectFit: 'contain', zIndex: 1 }} />
                            </div>
                            <h4>{cat.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{cat.slug}</p>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{cat.productCount} Products</p>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => handleEdit(cat)}
                                    className="btn btn-outline"
                                    style={{ flex: 1, borderColor: '#3b82f6', color: '#3b82f6' }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(cat._id)}
                                    className="btn btn-outline"
                                    style={{ flex: 1, borderColor: 'red', color: 'red' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No categories found.</p>
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
