"use client";

import { useForm } from "react-hook-form";
import api from "../../../../utils/api";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { useState, useEffect } from "react";

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [couponId, setCouponId] = useState<string | null>(null);

    const { register, handleSubmit, watch, setValue, reset } = useForm({
        defaultValues: {
            code: '',
            description: '',
            discount_type: 'Percentage',
            discount_value: 0,
            max_discount_amount: 0,
            min_cart_value: 0,
            usage_limit: 0,
            statusBool: "true"
        }
    });

    const discountType = watch("discount_type");

    useEffect(() => {
        params.then(p => {
            setCouponId(p.id);
            fetchCoupon(p.id);
        });
    }, [params]);

    const fetchCoupon = async (id: string) => {
        try {
            // My route getCoupons returns ALL. I don't have getById.
            // I'll just fetch all and find it. Not efficient but works for now as per my controller.
            const res = await api.get('/coupons');
            const found = res.data.find((c: any) => c._id === id);

            if (found) {
                reset({
                    code: found.code,
                    description: found.description,
                    discount_type: found.discount_type,
                    discount_value: found.discount_value,
                    max_discount_amount: found.max_discount_amount,
                    min_cart_value: found.min_cart_value,
                    usage_limit: found.usage_limit,
                    statusBool: found.status ? "true" : "false"
                });
            }
        } catch (error) {
            console.error('Failed to load coupon', error);
        }
    };

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

        // Add image if selected (assuming input type="file" is added later or handled)
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }

        try {
            await api.put(`/coupons/${couponId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Coupon updated!');
            router.push('/admin/coupons');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to update coupon');
        }
    };

    if (!couponId) return <div className="p-10">Loading...</div>;

    return (
        <div className="container">
            <h1 className="page-title">Edit Coupon</h1>

            <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '800px' }}>
                <div className="card">
                    <div className="card-header">Coupon Details</div>
                    <div className="form-grid">

                        <div className="form-group">
                            <label className="form-label">Coupon Code *</label>
                            <input
                                {...register("code", { required: true, pattern: /^[A-Z0-9]+$/ })}
                                className="form-input"
                                style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}
                                onChange={(e) => setValue('code', e.target.value.toUpperCase())}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <input {...register("description", { required: true })} className="form-input" />
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
                                    <input type="number" {...register("discount_value", { required: true, min: 1 })} className="form-input" />
                                </div>
                                {discountType === 'Percentage' && (
                                    <div className="form-group">
                                        <label className="form-label">Max Discount Amount (₹)</label>
                                        <input type="number" {...register("max_discount_amount")} className="form-input" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Constraints */}
                        <div className="form-group">
                            <label className="form-label">Minimum Cart Value (₹)</label>
                            <input type="number" {...register("min_cart_value")} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Total Usage Limit</label>
                            <input type="number" {...register("usage_limit")} className="form-input" />
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

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary">
                            <FiSave /> Update Coupon
                        </button>
                        <button type="button" onClick={() => router.push('/admin/coupons')} className="btn btn-secondary">
                            Cancel
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}
