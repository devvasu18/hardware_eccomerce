"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiDownload } from "react-icons/fi";
import Image from "next/image";
import FormModal from "../../../components/FormModal";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import ErrorState from "../../../components/ErrorState";
import Loader from "../../../components/Loader";
import { useModal } from "../../../hooks/useModal";
import BilingualInput from "../../../../components/forms/BilingualInput";
import LanguageToggle from "../../../../components/LanguageToggle";
import { useLanguage } from "../../../../context/LanguageContext";

interface Category {
    _id: string;
    name: string | { en: string; hi: string };
}

interface SubCategory {
    _id: string;
    name: string | { en: string; hi: string }; // Handle both for now
    slug: string;
    category_id: Category | string;
    image: string;
}

interface FormInputs {
    name_en: string;
    name_hi: string;
    slug: string;
    category_id: string;
}

export default function SubCategoryMaster() {
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categorySearch, setCategorySearch] = useState('');

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();
    const { language } = useLanguage();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormInputs>();
    const nameEn = watch('name_en');

    useEffect(() => {
        fetchSubCategories();
        fetchCategories();
    }, []);

    // Slug generation from English name
    useEffect(() => {
        if (nameEn && !editingId) {
            setValue('slug', nameEn.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [nameEn, editingId, setValue]);

    const filteredSubCategories = useMemo(() => {
        if (selectedCategory === 'all') return subCategories;
        return subCategories.filter(sc => {
            const catId = typeof sc.category_id === 'string' ? sc.category_id : (sc.category_id as any)?._id;
            return catId === selectedCategory;
        });
    }, [subCategories, selectedCategory]);

    const fetchSubCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/sub-categories');
            setSubCategories(res.data);
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to load sub-categories");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const onSubmit = async (data: FormInputs) => {
        try {
            const formData = new FormData();

            // Construct name object and stringify for backend parsing
            const nameObj = {
                en: data.name_en,
                hi: data.name_hi
            };
            formData.append('name', JSON.stringify(nameObj));

            formData.append('slug', data.slug);
            formData.append('category_id', data.category_id);
            if (image) formData.append('image', image);

            if (editingId) {
                await api.put(`/admin/sub-categories/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Updated successfully');
            } else {
                await api.post('/admin/sub-categories', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Created successfully');
            }

            handleCloseModal();
            fetchSubCategories();
        } catch (error) {
            console.error(error);
            showError('Operation failed');
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        reset({
            name_en: '',
            name_hi: '',
            slug: '',
            category_id: ''
        });
        setImage(null);
        setPreviewImage(null);
        setIsModalOpen(true);
    };

    const handleEdit = (sc: SubCategory) => {
        setEditingId(sc._id);

        // Handle name object
        const nameEnVal = typeof sc.name === 'object' ? sc.name.en : sc.name;
        const nameHiVal = typeof sc.name === 'object' ? sc.name.hi || '' : '';

        setValue('name_en', nameEnVal);
        setValue('name_hi', nameHiVal);
        setValue('slug', sc.slug);

        // Handle case where category_id might be populated object or ID string based on API response
        setValue('category_id', (sc.category_id as any)?._id || (typeof sc.category_id === 'string' ? sc.category_id : ''));

        setImage(null);
        setPreviewImage(sc.image ? (sc.image.startsWith('http') ? sc.image : `/api/${sc.image}`) : null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setCategorySearch('');
        reset();
        setImage(null);
        setPreviewImage(null);
    };

    const handleDelete = async (id: string) => {
        showModal(
            'Delete Sub-Category',
            'Delete this Sub-Category?',
            'warning',
            {
                showCancel: true,
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.delete(`/admin/sub-categories/${id}`);
                        fetchSubCategories();
                        showSuccess("Deleted successfully");
                    } catch (error) {
                        showError('Delete failed');
                    }
                }
            }
        );
    };

    const handleExport = async (format: 'csv' | 'excel') => {
        try {
            const res = await api.get('/admin/sub-categories/export', {
                params: { format },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sub_categories_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            showError("Failed to export sub-categories");
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <h1 className="page-title" style={{ margin: 0, color: 'var(--text-primary)' }}>Sub-Category Manager</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter by Category:</span>
                        <select
                            className="form-select"
                            style={{ padding: '0.4rem 2rem 0.4rem 0.8rem', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>
                                    {typeof cat.name === 'string' ? cat.name : (cat.name[language] || cat.name.en)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="btn-group" style={{ display: 'flex', gap: '0.2rem' }}>
                        <button
                            onClick={() => handleExport('csv')}
                            className="btn btn-outline"
                            title="Export as CSV"
                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiDownload /> CSV
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="btn btn-outline"
                            title="Export as Excel"
                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiDownload /> Excel
                        </button>
                    </div>
                    <button onClick={handleAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiPlus /> Add Sub-Category
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '5rem 0' }}><Loader /></div>
            ) : error ? (
                <div style={{ padding: '2rem 0' }}>
                    <ErrorState message={error} onRetry={fetchSubCategories} />
                </div>
            ) : (
                <DataTable
                    title="Sub-Category List"
                    data={filteredSubCategories}
                    columns={[
                        {
                            header: 'Image',
                            accessor: (item) => (
                                <div className="img-preview" style={{ width: '50px', height: '50px', position: 'relative', overflow: 'hidden', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                    {item.image ? (
                                        <Image
                                            src={item.image.startsWith('http') ? item.image : `/api/${item.image}`}
                                            alt={typeof item.name === 'string' ? item.name : item.name?.en || 'Sub-Category'}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.75rem' }}>N/A</span>
                                    )}
                                </div>
                            ),
                            sortable: false
                        },
                        {
                            header: 'Name',
                            accessor: (item) => (
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {typeof item.name === 'object'
                                            ? (item.name[language] || item.name['en'])
                                            : item.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.slug}</div>
                                </div>
                            ),
                            sortable: true
                        },
                        {
                            header: 'Parent Category',
                            accessor: (item) => {
                                const catName = (item.category_id as any)?.name;
                                const display = typeof catName === 'object'
                                    ? (catName[language] || catName['en'])
                                    : (catName || 'Unknown');
                                return (
                                    <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        {display}
                                    </span>
                                );
                            },
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
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '2rem' }}>
                        <span>{editingId ? 'Edit Sub-Category' : 'Add New Sub-Category'}</span>
                        <LanguageToggle />
                    </div>
                }
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <select
                                {...register("category_id", { required: "Category is required" })}
                                className="form-select"
                                style={{ width: '100%', padding: '0.5rem', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}
                            >
                                <option value="">-- Select Category --</option>
                                {categories
                                    .filter(c => {
                                        const name = typeof c.name === 'string' ? c.name : c.name.en;
                                        return name.toLowerCase().includes(categorySearch.toLowerCase());
                                    })
                                    .map(c => (
                                        <option key={c._id} value={c._id}>
                                            {typeof c.name === 'string' ? c.name : (c.name[language] || c.name.en)}
                                        </option>
                                    ))
                                }
                                {/* Ensure selected category is always visible */}
                                {watch('category_id') && !categories
                                    .find(c => c._id === watch('category_id')) && (
                                        <option key={watch('category_id')} value={watch('category_id')}>
                                            Selected Category
                                        </option>
                                    )}
                            </select>
                            {errors.category_id && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.category_id.message}</span>}
                        </div>

                        {/* Bilingual Name Input */}
                        <BilingualInput
                            label="Sub-Category Name"
                            registerEn={register("name_en", { required: "English name is required" })}
                            registerHi={register("name_hi")}
                            errorEn={errors.name_en}
                            errorHi={errors.name_hi}
                            placeholderEn="e.g. Cordless Drills"
                            placeholderHi="उदा. बिना तार वाली ड्रिल"
                            required
                        />

                        <div className="form-group">
                            <label className="form-label">Slug</label>
                            <input
                                {...register("slug", { required: true })}
                                className="form-input"
                                readOnly
                                style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--background)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cover Image</label>
                            <div className="upload-box" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', border: '1px dashed var(--border)', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                setImage(file);
                                                setPreviewImage(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>
                                {previewImage && (
                                    <div style={{ marginTop: '0.5rem', width: '200px', height: '120px', position: 'relative', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <Image
                                            src={previewImage}
                                            alt="Preview"
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            {editingId ? 'Update Sub-Category' : 'Create Sub-Category'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
