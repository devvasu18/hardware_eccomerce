"use client";

import { useForm } from "react-hook-form";
import api from "../../../utils/api";
import { useRouter } from "next/navigation";
import { FiSave, FiTag } from "react-icons/fi";
import { useState } from "react";
import Modal from "../../../components/Modal";
import { useModal } from "../../../hooks/useModal";

export default function AddCouponPage() {
    const router = useRouter();
    const { register, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            code: '',
            description: '',
            discount_type: 'Percentage',
            discount_value: 0,
            max_discount_amount: 0,
            min_cart_value: 0,
            usage_limit: 0,
            status: true,
            statusBool: "true", // For radio group
            expiry_date: '',
            image: null
        }
    });



    const discountType = watch("discount_type");
    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

    const onSubmit = async (data: any) => {
        const formData = new FormData();
        formData.append('code', data.code);
        formData.append('description', data.description);
        formData.append('discount_type', data.discount_type);
        formData.append('discount_value', data.discount_value.toString());
        formData.append('max_discount_amount', data.max_discount_amount?.toString() || '0');
        formData.append('min_cart_value', data.min_cart_value?.toString() || '0');
        formData.append('usage_limit', data.usage_limit?.toString() || '0');
        formData.append('status', data.statusBool); // Backend handles string 'true'/'false'
        if (data.expiry_date) {
            formData.append('expiry_date', data.expiry_date);
        }

        try {
            await api.post('/coupons', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSuccess('Coupon created!', 'Success', {
                onConfirm: () => router.push('/admin/coupons')
            });
        } catch (error: any) {
            console.error(error);
            showError(error.response?.data?.message || 'Failed to create coupon');
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
            <h1 className="page-title">Create New Coupon</h1>

            <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '800px' }}>
                <div className="card">
                    <div className="card-header">Coupon Details</div>
                    <div className="form-grid">

                        <div className="form-group">
                            <label className="form-label">Coupon Code *</label>
                            <input
                                {...register("code", { required: true, pattern: /^[A-Z0-9]+$/ })}
                                className="form-input"
                                placeholder="e.g. SUMMER50"
                                style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}
                                onChange={(e) => {
                                    setValue('code', e.target.value.toUpperCase());
                                }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Uppercase letters and numbers only.</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <input {...register("description", { required: true })} className="form-input" placeholder="e.g. Get 50% off on all items" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Coupon Banner Image (Optional)</label>
                            <input type="file" {...register("image")} className="form-input" accept="image/*" />
                        </div>

                        {/* Discount Logic */}
                        <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Discount Type</label>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" value="Percentage" {...register("discount_type")} /> Percentage (%)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" value="Fixed Amount" {...register("discount_type")} /> Fixed Amount (₹)
                                </label>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Discount Value * {discountType === 'Percentage' ? '(%)' : '(₹)'}</label>
                                    <input type="number" {...register("discount_value", { required: true, min: 1 })} className="form-input" placeholder="0" />
                                </div>
                                {discountType === 'Percentage' && (
                                    <div className="form-group">
                                        <label className="form-label">Max Discount Amount (₹)</label>
                                        <input type="number" {...register("max_discount_amount")} className="form-input" placeholder="0 (No Limit)" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Constraints */}
                        <div className="form-group">
                            <label className="form-label">Minimum Cart Value (₹)</label>
                            <input type="number" {...register("min_cart_value")} className="form-input" placeholder="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Total Usage Limit</label>
                            <input type="number" {...register("usage_limit")} className="form-input" placeholder="0 (Unlimited)" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="radio" value="true" {...register("statusBool")} /> Active
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="radio" value="false" {...register("statusBool")} /> Inactive
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Expiry Date</label>
                            <input type="date" {...register("expiry_date")} className="form-input" />
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Leave blank for no expiry.</p>
                        </div>

                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <button type="submit" className="btn btn-primary">
                            <FiSave /> Create Coupon
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}
