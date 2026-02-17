"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import Image from "next/image";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

interface Banner {
    _id: string;
    title: string;
    image: string;
    offer_id?: {
        title: string;
        percentage: number;
    };
    product_ids?: any[];
}

export default function BannerList() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await api.get('/banners');
            setBanners(res.data);
        } catch (error) {
            console.error('Failed to fetch banners', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        showModal(
            'Delete Banner',
            'Are you sure you want to delete this banner?',
            'warning',
            {
                showCancel: true,
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    try {
                        await api.delete(`/banners/${id}`);
                        setBanners(prev => prev.filter(b => b._id !== id));
                        showSuccess("Banner deleted successfully");
                    } catch (error) {
                        showError('Failed to delete banner');
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Banner Manager</h1>

                </div>
                <Link href="/admin/banners/add" className="btn btn-primary">
                    <FiPlus /> Add New Banner
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <DataTable
                    title="Active Banners"
                    data={banners}
                    columns={[
                        {
                            header: 'Image',
                            accessor: (item) => (
                                <div style={{ width: '120px', height: '60px', position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <Image
                                        src={item.image.startsWith('http') ? item.image : `http://localhost:5000/${item.image}`}
                                        alt={item.title}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                            ),
                            sortable: false
                        },
                        { header: 'Title', accessor: 'title', sortable: true, className: "font-semibold" },
                        {
                            header: 'Linked To',
                            accessor: (item) => (
                                item.offer_id ? (
                                    <span className="badge badge-success">Offer: {item.offer_id.title} ({item.offer_id.percentage}%)</span>
                                ) : (
                                    <span className="badge badge-warning">Products: {item.product_ids?.length || 0}</span>
                                )
                            ),
                            sortable: false
                        }
                    ]}
                    searchKeys={['title']}
                    onEdit={(item) => window.location.href = `/admin/banners/${item._id}/edit`}
                    onDelete={(item) => handleDelete(item._id)}
                    itemsPerPage={5}
                />
            )}
        </div>
    );
}
