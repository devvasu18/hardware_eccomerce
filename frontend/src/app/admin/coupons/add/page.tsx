"use client";

import { useForm } from "react-hook-form";
import api from "../../../../utils/api";
import { useRouter } from "next/navigation";
import { FiSave, FiTag } from "react-icons/fi";
import { useState } from "react";

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
            statusBool: "true" // For radio group
        }
    });

    const discountType = watch("discount_type");

    const onSubmit = async (data: any) => {
        try {
            const payload = { ...data, status: data.statusBool === "true" };
            await api.post('/coupons', payload);
            alert('Coupon created!');
            router.push('/admin/coupons');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to create coupon');
        }
    };

    return (
        <div className="container">
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
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uppercase letters and numbers only.</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <input {...register("description", { required: true })} className="form-input" placeholder="e.g. Get 50% off on all items" />
                        </div>

                        {/* Discount Logic */}
                        <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
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
