"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiDownload, FiGrid } from "react-icons/fi";
import Image from "next/image";
import FormModal from "../../components/FormModal";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ErrorState from "../../components/ErrorState";
import Loader from "../../components/Loader";
import { useModal } from "../../hooks/useModal";
import BilingualInput from "../../../components/forms/BilingualInput";
import LanguageToggle from "../../../components/LanguageToggle";
import { useLanguage } from "../../../context/LanguageContext";
import ReorderModal from "./ReorderModal";

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

interface Category {
    _id: string;
    name: string | { en: string; hi: string };
    slug: string;
    description: string | { en: string; hi: string };
    imageUrl: string;
    displayOrder: number;
    isActive: boolean;
    showInNav: boolean;
    gradient: string;
    productCount: number;
}

interface FormInputs {
    name_en: string;
    name_hi: string;
    slug: string;
    description_en: string;
    description_hi: string;
    displayOrder: number;
    showInNav: boolean;
    imageUrl: string; // For manual URL
}

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();
    const { language } = useLanguage();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormInputs>();
    const nameEn = watch('name_en');

    useEffect(() => {
        fetchCategories();
    }, []);

    // Slug generation from English name
    useEffect(() => {
        if (nameEn && !editingId) {
            setValue('slug', nameEn.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [nameEn, editingId, setValue]);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data);
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormInputs) => {
        try {
            const formData = new FormData();

            const nameObj = {
                en: data.name_en,
                hi: data.name_hi
            };
            const descriptionObj = {
                en: data.description_en,
                hi: data.description_hi
            };
            formData.append('name', JSON.stringify(nameObj));
            formData.append('slug', data.slug);
            formData.append('description', JSON.stringify(descriptionObj));
            formData.append('displayOrder', data.displayOrder.toString());
            formData.append('showInNav', data.showInNav.toString());

            // Image handling
            if (selectedFile) {
                formData.append('image', selectedFile);
            } else if (data.imageUrl) {
                formData.append('imageUrl', data.imageUrl);
            }

            if (editingId) {
                await api.put(`/admin/categories/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Category updated successfully');
            } else {
                await api.post('/admin/categories', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Category created successfully');
            }

            handleCloseFormModal();
            fetchCategories();
        } catch (error: any) {
            console.error(error);
            showError(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        reset({
            name_en: '',
            name_hi: '',
            slug: '',
            description_en: '',
            description_hi: '',
            displayOrder: 0,
            showInNav: false,
            imageUrl: ''
        });
        setSelectedFile(null);
        setFilePreview(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (cat: Category) => {
        setEditingId(cat._id);

        const nameEnVal = typeof cat.name === 'object' ? cat.name.en : cat.name;
        const nameHiVal = typeof cat.name === 'object' ? cat.name.hi || '' : '';

        const descEnVal = typeof cat.description === 'object' ? cat.description?.en || '' : cat.description || '';
        const descHiVal = typeof cat.description === 'object' ? cat.description?.hi || '' : '';

        setValue('name_en', nameEnVal);
        setValue('name_hi', nameHiVal);
        setValue('slug', cat.slug);
        setValue('description_en', descEnVal);
        setValue('description_hi', descHiVal);
        setValue('displayOrder', cat.displayOrder);
        setValue('showInNav', cat.showInNav);
        setValue('imageUrl', cat.imageUrl);

        setSelectedFile(null);
        setFilePreview(cat.imageUrl ? (cat.imageUrl.startsWith('http') ? cat.imageUrl : `/api/${cat.imageUrl}`) : null);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setEditingId(null);
        reset();
        setSelectedFile(null);
        setFilePreview(null);
    };

    const handleDelete = async (id: string) => {
        showModal(
            'Delete Category',
            'Are you sure you want to delete this category? This might affect products linked to it.',
            'warning',
            {
                showCancel: true,
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.delete(`/admin/categories/${id}`);
                        fetchCategories();
                        showSuccess("Category deleted successfully");
                    } catch (error: any) {
                        showError(error.response?.data?.message || 'Delete failed');
                    }
                }
            }
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setValue('imageUrl', ''); // Clear manual URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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
        <div className="container">
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h1 className="page-title" style={{ margin: 0, color: 'var(--text-primary)' }}>Category Manager</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="btn-group" style={{ display: 'flex', gap: '0.2rem' }}>
                        <button onClick={() => handleExport('csv')} className="btn btn-outline" title="Export as CSV"><FiDownload /> CSV</button>
                        <button onClick={() => handleExport('excel')} className="btn btn-outline" title="Export as Excel"><FiDownload /> Excel</button>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border)', margin: '0 0.5rem' }}></div>
                    <button onClick={() => setIsReorderModalOpen(true)} className="btn btn-outline"><FiGrid /> Reorder</button>
                    <button onClick={handleAdd} className="btn btn-primary"><FiPlus /> Add Category</button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '5rem 0' }}><Loader /></div>
            ) : error ? (
                <div style={{ padding: '2rem 0' }}>
                    <ErrorState message={error} onRetry={fetchCategories} />
                </div>
            ) : (
                <DataTable
                    title="All Categories"
                    data={categories}
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
                                        <Image
                                            src={item.imageUrl.startsWith('http') ? item.imageUrl : `/api/${item.imageUrl}`}
                                            alt={typeof item.name === 'string' ? item.name : item.name?.en || 'Category'}
                                            width={40}
                                            height={40}
                                            style={{ objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                            ),
                            sortable: false
                        },
                        {
                            header: 'Name',
                            accessor: (item) => (
                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {typeof item.name === 'object'
                                        ? (item.name[language] || item.name['en'])
                                        : item.name}
                                </div>
                            ),
                            sortable: true
                        },
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
            )}

            <FormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '2rem' }}>
                        <span>{editingId ? 'Edit Category' : 'Add New Category'}</span>
                        <LanguageToggle />
                    </div>
                }
                maxWidth="800px"
            >
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    {/* Bilingual Name Input */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <BilingualInput
                            label="Category Name"
                            registerEn={register("name_en", { required: "English name is required" })}
                            registerHi={register("name_hi")}
                            errorEn={errors.name_en}
                            errorHi={errors.name_hi}
                            placeholderEn="e.g. Safety Gear"
                            placeholderHi="उदा. सुरक्षा उपकरण"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Slug</label>
                        <input
                            {...register("slug", { required: true })}
                            className="form-input"
                            readOnly
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--background)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Display Order</label>
                        <input
                            type="number"
                            {...register("displayOrder")}
                            className="form-input"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <BilingualInput
                            label="Description"
                            registerEn={register("description_en")}
                            registerHi={register("description_hi")}
                            multiline
                            rows={3}
                            placeholderEn="Brief description..."
                            placeholderHi="संक्षिप्त विवरण..."
                        />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Category Image</label>
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
                                        border: '2px dashed var(--border)',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {selectedFile ? selectedFile.name : 'Click to upload image'}
                                </label>
                                <input
                                    {...register("imageUrl")}
                                    className="form-input"
                                    placeholder="Or provide external URL..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '0.5rem' }}
                                    onChange={(e) => {
                                        setValue('imageUrl', e.target.value);
                                        if (e.target.value) {
                                            setFilePreview(e.target.value);
                                            setSelectedFile(null);
                                        }
                                    }}
                                />
                            </div>
                            {filePreview && (
                                <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                                    <Image
                                        src={filePreview}
                                        alt="Preview"
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            {...register("showInNav")}
                            id="showInNav"
                            style={{ width: '20px', height: '20px', marginRight: '10px', cursor: 'pointer' }}
                        />
                        <label htmlFor="showInNav" style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Show in Header Navigation (Max 10)
                        </label>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={handleCloseFormModal}
                            className="btn"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1.5rem', borderRadius: '6px' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 2rem', borderRadius: '6px' }}
                        >
                            {editingId ? 'Update Category' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </FormModal>

            <ReorderModal
                isOpen={isReorderModalOpen}
                onClose={() => setIsReorderModalOpen(false)}
                initialCategories={categories.filter(c => typeof c.name === 'string' || (c.name && c.name.en))} // Type safety
                onSaveSuccess={() => {
                    fetchCategories();
                    showSuccess('Categories reordered successfully!');
                }}
                onAddCategory={handleAdd} // Helper to open add modal
            />
        </div>
    );
}
