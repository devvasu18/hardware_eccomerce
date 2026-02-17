"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiUploadCloud, FiFilter } from "react-icons/fi";
import Image from "next/image";
import FormModal from "../../../components/FormModal";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { useModal } from "../../../hooks/useModal";
import BilingualInput from "../../../../components/forms/BilingualInput";
import LanguageToggle from "../../../../components/LanguageToggle";
import { useLanguage } from "../../../../context/LanguageContext";

interface Offer {
    _id: string;
    title: string | { en: string; hi: string };
    slug: string;
    percentage: number;
    banner_image: string;
    isActive: boolean;
}

interface FormData {
    title: { en: string; hi: string };
    slug: string;
    percentage: number;
    isActive: boolean;
}

export default function OfferMaster() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [image, setImage] = useState<File | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [percentageFilter, setPercentageFilter] = useState<string>('all');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            isActive: true
        }
    });
    const { language } = useLanguage();
    const title = watch('title');

    useEffect(() => {
        fetchOffers();
    }, [statusFilter]);

    useEffect(() => {
        if (title?.en && !editingOffer) {
            setValue('slug', title.en.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [title?.en, setValue, editingOffer]);

    const fetchOffers = async () => {
        try {
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const res = await api.get('/admin/offers', { params });
            setOffers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (data: FormData): boolean => {
        const errors: Record<string, string> = {};

        // Validate percentage
        if (data.percentage < 0 || data.percentage > 100) {
            errors.percentage = 'Percentage must be between 0 and 100';
        }

        // Validate image (only for new offers or when changing image)
        if (image) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(image.type)) {
                errors.image = 'Only JPEG, PNG, and WebP images are allowed';
            }
            if (image.size > 5 * 1024 * 1024) {
                errors.image = 'Image size must be less than 5MB';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const onSubmit = async (data: FormData) => {
        if (!validateForm(data)) {
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', JSON.stringify(data.title));
            formData.append('slug', data.slug);
            formData.append('percentage', data.percentage.toString());
            formData.append('isActive', data.isActive.toString());
            if (image) formData.append('banner_image', image);

            if (editingOffer) {
                await api.put(`/admin/offers/${editingOffer._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Offer Updated Successfully');
            } else {
                await api.post('/admin/offers', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Offer Created Successfully');
            }

            handleCloseModal();
            fetchOffers();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.error || 'Operation failed';
            showError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdd = () => {
        setEditingOffer(null);
        reset({
            title: { en: '', hi: '' },
            slug: '',
            percentage: 0,
            isActive: true
        });
        setImage(null);
        setPreviewImage(null);
        setValidationErrors({});
        setIsModalOpen(true);
    };

    const handleEdit = (offer: Offer) => {
        setEditingOffer(offer);
        const titleVal = typeof offer.title === 'string' ? { en: offer.title, hi: '' } : offer.title;
        reset({
            title: titleVal,
            slug: offer.slug,
            percentage: offer.percentage,
            isActive: offer.isActive
        });
        setPreviewImage(offer.banner_image ?
            (offer.banner_image.startsWith('http') ? offer.banner_image : `/api/${offer.banner_image}`)
            : null
        );
        setImage(null);
        setValidationErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOffer(null);
        reset();
        setImage(null);
        setPreviewImage(null);
        setValidationErrors({});
    };

    const handleDelete = async (id: string) => {
        showModal(
            'Delete Offer',
            'Delete this Offer? This action cannot be undone.',
            'warning',
            {
                showCancel: true,
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.delete(`/admin/offers/${id}`);
                        fetchOffers();
                        showSuccess("Offer deleted successfully");
                    } catch (error) {
                        showError('Delete failed');
                    }
                }
            }
        );
    };

    const handleToggleStatus = async (offer: Offer) => {
        try {
            await api.put(`/admin/offers/${offer._id}`, {
                isActive: !offer.isActive
            });
            fetchOffers();
            showSuccess(`Offer ${!offer.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            showError('Status update failed');
        }
    };

    // Filter offers by percentage range
    const filteredOffers = offers.filter(offer => {
        if (percentageFilter === 'all') return true;
        if (percentageFilter === '0-25') return offer.percentage >= 0 && offer.percentage <= 25;
        if (percentageFilter === '26-50') return offer.percentage >= 26 && offer.percentage <= 50;
        if (percentageFilter === '51-75') return offer.percentage >= 51 && offer.percentage <= 75;
        if (percentageFilter === '76-100') return offer.percentage >= 76 && offer.percentage <= 100;
        return true;
    });

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Offers & Discounts</h1>
                <button onClick={handleAdd} className="btn btn-primary">
                    <FiPlus /> Create New Offer
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiFilter style={{ color: '#64748b' }} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 2rem 0.5rem 0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: '#334155',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
                <div>
                    <select
                        value={percentageFilter}
                        onChange={(e) => setPercentageFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 2rem 0.5rem 0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: '#334155',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Percentages</option>
                        <option value="0-25">0% - 25%</option>
                        <option value="26-50">26% - 50%</option>
                        <option value="51-75">51% - 75%</option>
                        <option value="76-100">76% - 100%</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <DataTable
                    title="Active Offers"
                    data={filteredOffers}
                    columns={[
                        {
                            header: 'Banner',
                            accessor: (item) => (
                                <div className="img-preview" style={{ width: '80px', height: '45px', position: 'relative', overflow: 'hidden', borderRadius: '4px', background: '#f3f4f6' }}>
                                    {item.banner_image ? (
                                        <Image
                                            src={item.banner_image.startsWith('http') ? item.banner_image : `/api/${item.banner_image}`}
                                            alt={typeof item.title === 'string' ? item.title : item.title.en}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: '0.75rem' }}>N/A</span>
                                    )}
                                </div>
                            ),
                            sortable: false
                        },
                        {
                            header: 'Title',
                            accessor: (item) => (
                                <span className="font-medium">
                                    {typeof item.title === 'string' ? item.title : (item.title[language] || item.title.en)}
                                </span>
                            ),
                            sortable: true
                        },
                        {
                            header: 'Percentage',
                            accessor: (item) => (
                                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{item.percentage}% OFF</span>
                            ),
                            sortable: true
                        },
                        {
                            header: 'Status',
                            accessor: (item) => (
                                <button
                                    onClick={() => handleToggleStatus(item)}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        background: item.isActive ? '#dcfce7' : '#fee2e2',
                                        color: item.isActive ? '#166534' : '#991b1b'
                                    }}
                                >
                                    {item.isActive ? 'Active' : 'Inactive'}
                                </button>
                            ),
                            sortable: false
                        }
                    ]}
                    searchKeys={['title', 'slug']}
                    onEdit={(item) => handleEdit(item)}
                    onDelete={(item) => handleDelete(item._id)}
                    itemsPerPage={10}
                />
            )}

            <FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingOffer ? "Edit Offer" : "Create New Offer Bucket"}
            >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <LanguageToggle />
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <BilingualInput
                                label="Offer Title *"
                                registerEn={register("title.en", { required: "English title is required" })}
                                registerHi={register("title.hi")}
                                errorEn={errors.title?.en}
                                errorHi={errors.title?.hi}
                                placeholderEn="e.g. Monsoon Sale"
                                placeholderHi="e.g. मानसून सेल"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Discount Percentage (%) *</label>
                            <input
                                type="number"
                                {...register("percentage", {
                                    required: true,
                                    min: 0,
                                    max: 100
                                })}
                                className="form-input"
                                placeholder="10"
                                min="0"
                                max="100"
                                step="0.01"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: (errors.percentage || validationErrors.percentage) ? '1px solid #ef4444' : '1px solid #e2e8f0'
                                }}
                            />
                            {(errors.percentage || validationErrors.percentage) && (
                                <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                                    {validationErrors.percentage || 'Percentage must be between 0 and 100'}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Slug *</label>
                            <input
                                {...register("slug", { required: true })}
                                className="form-input"
                                readOnly={!editingOffer}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: !editingOffer ? '#f9fafb' : 'white',
                                    border: errors.slug ? '1px solid #ef4444' : '1px solid #e2e8f0'
                                }}
                            />
                            {errors.slug && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Slug is required</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    {...register("isActive")}
                                    style={{ width: 'auto' }}
                                />
                                Active
                            </label>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Inactive offers won't be displayed in the system
                            </span>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Banner Image {!editingOffer && '*'}</label>
                            <div className="upload-box" style={{
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                alignItems: 'flex-start',
                                border: validationErrors.image ? '1px dashed #ef4444' : '1px dashed #ccc',
                                borderRadius: '4px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                setImage(file);
                                                setPreviewImage(URL.createObjectURL(file));
                                                setValidationErrors(prev => ({ ...prev, image: '' }));
                                            }
                                        }}
                                    />
                                </div>
                                {validationErrors.image && (
                                    <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                                        {validationErrors.image}
                                    </span>
                                )}
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    Accepted: JPEG, PNG, WebP • Max size: 5MB
                                </span>
                                {previewImage && (
                                    <div style={{ marginTop: '0.5rem', width: '200px', height: '100px', position: 'relative', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
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
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="btn"
                            style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : (
                                <>
                                    <FiPlus /> {editingOffer ? 'Update Offer' : 'Add Offer'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
