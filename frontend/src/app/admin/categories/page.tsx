'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormModal from '../../components/FormModal';
import api from '../../utils/api';
import DataTable from '../../components/DataTable';
import { useModal } from '../../hooks/useModal';
import { FiPlus, FiGrid, FiDownload } from 'react-icons/fi';
import ReorderModal from './ReorderModal';

interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    displayOrder: number;
    isActive: boolean;
    showInNav: boolean;
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
        isActive: true,
        showInNav: false
    });
    const [editId, setEditId] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const { modalState, hideModal, showSuccess, showError, showModal } = useModal();
    // Removed direct token usage as api utility handles it
    // const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            // Changed to use api utility and admin route
            const res = await api.get('/admin/categories');
            setCategories(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const startAdd = () => {
        resetForm();
        setIsFormModalOpen(true);
    };

    const handleAddFromReorder = () => {
        resetForm();
        setIsFormModalOpen(true);
        // We don't close reorder modal, so after adding it shows up there
    };

    const handleEdit = (category: Category) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description,
            imageUrl: category.imageUrl,
            displayOrder: category.displayOrder,
            gradient: category.gradient,
            isActive: category.isActive,
            showInNav: category.showInNav
        });
        setEditId(category._id);
        setFilePreview(category.imageUrl ? (category.imageUrl.startsWith('http') ? category.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${category.imageUrl}`) : null);
        setIsFormModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            imageUrl: '',
            displayOrder: 0,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            isActive: true,
            showInNav: false
        });
        setEditId(null);
        setSelectedFile(null);
        setFilePreview(null);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        resetForm();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData({ ...formData, name, slug });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value.toString());
            });
            if (selectedFile) {
                data.append('image', selectedFile);
            }

            if (editId) {
                await api.put(`/admin/categories/${editId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Category updated successfully!');
            } else {
                await api.post('/admin/categories', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Category created successfully!');
            }

            resetForm();
            fetchCategories();
            setIsFormModalOpen(false);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Operation failed';
            showError(msg);
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
                        await api.delete(`/admin/categories/${id}`);
                        fetchCategories();
                        showSuccess('Category deleted successfully!');
                    } catch (error: any) {
                        const msg = error.response?.data?.message || 'Failed to delete category';
                        showError(msg);
                    }
                }
            }
        );
    };

    const handleExport = async (format: 'csv' | 'excel') => {
        try {
            const res = await api.get('/admin/categories/export', {
                params: { format },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `categories_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            showError("Failed to export categories");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: 0 }}>Category Management</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="btn-group" style={{ display: 'flex', gap: '0.2rem' }}>
                        <button
                            onClick={() => handleExport('csv')}
                            className="btn"
                            style={{
                                background: 'white',
                                border: '2px solid #e2e8f0',
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                color: '#475569',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <FiDownload /> CSV
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="btn"
                            style={{
                                background: 'white',
                                border: '2px solid #e2e8f0',
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                color: '#475569',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <FiDownload /> Excel
                        </button>
                    </div>

                    <div style={{ borderLeft: '1px solid #eee', margin: '0 0.5rem' }}></div>

                    <button
                        onClick={() => setIsReorderModalOpen(true)}
                        className="btn"
                        style={{
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            color: '#475569',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                        <FiGrid /> Reorder
                    </button>
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
                        <FiPlus /> Add Category
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <DataTable
                    title="All Categories"
                    data={categories}
                    loading={loading}
                    columns={[
                        {
                            header: 'Image',
                            accessor: (item) => (
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '6px',
                                    background: item.gradient || '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl.startsWith('http') ? item.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${item.imageUrl}`}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                            ),
                            sortable: false
                        },
                        { header: 'Name', accessor: 'name', sortable: true, className: "font-semibold" },
                        { header: 'Slug', accessor: 'slug', sortable: true, className: "text-muted" },
                        {
                            header: 'Products',
                            accessor: (item) => <span className="badge" style={{ background: '#eff6ff', color: '#3b82f6' }}>{item.productCount}</span>,
                            sortable: true
                        },
                        { header: 'Order', accessor: 'displayOrder', sortable: true },
                        {
                            header: 'In Nav',
                            accessor: (item) => (
                                <span style={{
                                    color: item.showInNav ? '#16a34a' : '#94a3b8',
                                    background: item.showInNav ? '#dcfce7' : '#f1f5f9',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {item.showInNav ? 'Visible' : 'Hidden'}
                                </span>
                            ),
                            sortable: true
                        }
                    ]}
                    searchKeys={['name', 'slug']}
                    onEdit={handleEdit}
                    onDelete={(item) => handleDelete(item._id)}
                    itemsPerPage={10}
                />
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

            <FormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                title={editId ? 'Edit Category' : 'Add New Category'}
                maxWidth="800px"
            >
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
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Category Image</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    id="category-image-upload"
                                />
                                <label
                                    htmlFor="category-image-upload"
                                    style={{
                                        display: 'block',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        border: '2px dashed #cbd5e1',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.borderColor = '#94a3b8';
                                        e.currentTarget.style.background = '#f8fafc';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {selectedFile ? selectedFile.name : 'Click to upload image'}
                                </label>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    Or provide an external URL:
                                </div>
                                <input
                                    className="input"
                                    value={formData.imageUrl}
                                    onChange={e => {
                                        setFormData({ ...formData, imageUrl: e.target.value });
                                        if (e.target.value) {
                                            setFilePreview(e.target.value);
                                            setSelectedFile(null);
                                        }
                                    }}
                                    placeholder="https://..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', marginTop: '0.25rem' }}
                                />
                            </div>
                            {filePreview && (
                                <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <img src={filePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>
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

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            checked={formData.showInNav}
                            onChange={e => setFormData({ ...formData, showInNav: e.target.checked })}
                            style={{ width: '20px', height: '20px', marginRight: '10px', cursor: 'pointer' }}
                        />
                        <label style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600, color: '#475569' }}>
                            Show in Header Navigation (Max 10)
                        </label>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={handleCloseFormModal}
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
                            {editId ? 'Update Category' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </FormModal>
            <ReorderModal
                isOpen={isReorderModalOpen}
                onClose={() => setIsReorderModalOpen(false)}
                initialCategories={categories}
                onSaveSuccess={() => {
                    fetchCategories();
                    showSuccess('Categories reordered successfully!');
                }}
                onAddCategory={handleAddFromReorder}
            />
        </div >
    );
}
