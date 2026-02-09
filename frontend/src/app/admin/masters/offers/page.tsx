"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiUploadCloud } from "react-icons/fi";
import Image from "next/image";
import FormModal from "../../../components/FormModal";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { useModal } from "../../../hooks/useModal";

interface Offer {
    _id: string;
    title: string;
    slug: string;
    percentage: number;
    banner_image: string;
}

export default function OfferMaster() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [image, setImage] = useState<File | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<{ title: string; slug: string; percentage: number }>();
    const title = watch('title');

    useEffect(() => {
        fetchOffers();
    }, []);

    useEffect(() => {
        if (title) {
            setValue('slug', title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [title, setValue]);

    const fetchOffers = async () => {
        try {
            const res = await api.get('/admin/offers');
            setOffers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: { title: string; slug: string; percentage: number }) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('slug', data.slug);
            formData.append('percentage', data.percentage.toString());
            if (image) formData.append('banner_image', image);

            await api.post('/admin/offers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showSuccess('Offer Created Successfully');
            handleCloseModal();
            fetchOffers();
        } catch (error) {
            console.error(error);
            showError('Operation failed');
        }
    };

    const handleAdd = () => {
        reset();
        setImage(null);
        setPreviewImage(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        reset();
        setImage(null);
        setPreviewImage(null);
    };

    const handleDelete = async (id: string) => {
        showModal(
            'Delete Offer',
            'Delete this Offer?',
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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <DataTable
                    title="Active Offers"
                    data={offers}
                    columns={[
                        {
                            header: 'Banner',
                            accessor: (item) => (
                                <div className="img-preview" style={{ width: '80px', height: '45px', position: 'relative', overflow: 'hidden', borderRadius: '4px', background: '#f3f4f6' }}>
                                    {item.banner_image ? (
                                        <Image
                                            src={item.banner_image.startsWith('http') ? item.banner_image : `/api/${item.banner_image}`}
                                            alt={item.title}
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
                        { header: 'Title', accessor: 'title', sortable: true, className: "font-medium" },
                        {
                            header: 'Percentage',
                            accessor: (item) => (
                                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{item.percentage}% OFF</span>
                            ),
                            sortable: true
                        }
                    ]}
                    searchKeys={['title', 'slug']}
                    onDelete={(item) => handleDelete(item._id)}
                    itemsPerPage={10}
                />
            )}

            <FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Create New Offer Bucket"
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Offer Title</label>
                            <input
                                {...register("title", { required: true })}
                                className="form-input"
                                placeholder="e.g. Monsoon Sale"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Discount Percentage (%)</label>
                            <input
                                type="number"
                                {...register("percentage", { required: true })}
                                className="form-input"
                                placeholder="10"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Slug</label>
                            <input
                                {...register("slug", { required: true })}
                                className="form-input"
                                readOnly
                                style={{ width: '100%', padding: '0.5rem', background: '#f9fafb' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Banner Image</label>
                            <div className="upload-box" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', border: '1px dashed #ccc', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                        <button type="button" onClick={handleCloseModal} className="btn" style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                            <FiPlus /> Add Offer
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}
