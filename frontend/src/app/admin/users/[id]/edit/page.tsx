"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../../../utils/api";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { register, handleSubmit, setValue } = useForm();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        params.then(p => {
            setUserId(p.id);
            fetchUser(p.id);
        });
    }, [params]);

    const fetchUser = async (id: string) => {
        try {
            const res = await api.get(`/users/${id}`);
            const user = res.data;
            setValue("username", user.username);
            setValue("email", user.email);
            setValue("mobile", user.mobile);
            setValue("role", user.role);
            setValue("customerType", user.customerType);
            setValue("wholesaleDiscount", user.wholesaleDiscount);
            // Don't set password
        } catch (error) {
            console.error(error);
        }
    }

    const onSubmit = async (data: any) => {
        try {
            // Remove empty password if not changing
            if (!data.password) delete data.password;

            await api.put(`/users/${userId}`, data);
            alert('User updated!');
            router.push('/admin/users');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Update failed');
        }
    };

    if (!userId) return <div className="p-10">Loading...</div>;

    return (
        <div className="container">
            <h1 className="page-title">Edit User</h1>

            <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
                <div className="card">
                    <div className="card-header">Edit Details</div>
                    <div className="form-grid">

                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input {...register("username")} className="form-input" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" {...register("email")} className="form-input" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mobile</label>
                            <input {...register("mobile")} className="form-input" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select {...register("role")} className="form-select">
                                <option value="customer">Customer</option>
                                <option value="support_staff">Support Staff</option>
                                <option value="logistics_admin">Logistics Admin</option>
                                <option value="ops_admin">Ops Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reset Password (Optional)</label>
                            <input type="password" {...register("password")} className="form-input" placeholder="Leave blank to keep current" />
                        </div>

                        <div className="form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            <label className="form-label">Wholesale Logic</label>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Setting a discount &gt; 0 automatically makes them a &apos;Wholesale&apos; customer.</div>
                            <label className="form-label" style={{ fontSize: '0.85rem' }}>Fixed Discount %</label>
                            <input type="number" {...register("wholesaleDiscount")} className="form-input" placeholder="0" />
                        </div>

                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary">
                            <FiSave /> Save Changes
                        </button>
                        <button type="button" onClick={() => router.push('/admin/users')} className="btn btn-secondary">
                            Cancel
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}
