"use client";

import { useForm } from "react-hook-form";
import api from "../../../utils/api";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { useState } from "react";

export default function AddUserPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await api.post('/users', data);
            alert('User created successfully!');
            router.push('/admin/users');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="page-title">Register New User</h1>

            <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
                <div className="card">
                    <div className="card-header">Account Details</div>
                    <div className="form-grid">

                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input {...register("username", { required: "Name is required" })} className="form-input" placeholder="John Doe" />
                            {errors.username && <span style={{ color: 'red', fontSize: '0.8rem' }}>{String(errors.username.message)}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" {...register("email")} className="form-input" placeholder="john@example.com" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mobile Number *</label>
                            <input {...register("mobile", { required: "Mobile is required" })} className="form-input" placeholder="9876543210" />
                            {errors.mobile && <span style={{ color: 'red', fontSize: '0.8rem' }}>{String(errors.mobile.message)}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password *</label>
                            <input type="password" {...register("password", { required: "Password is required", minLength: 6 })} className="form-input" placeholder="******" />
                            {errors.password && <span style={{ color: 'red', fontSize: '0.8rem' }}>Min 6 characters</span>}
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

                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <FiSave /> {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}
