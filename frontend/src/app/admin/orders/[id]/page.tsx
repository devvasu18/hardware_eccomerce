"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "../../../utils/api";
import Image from "next/image";
import { FiArrowLeft, FiPrinter, FiCheckCircle, FiXCircle, FiTruck, FiInfo, FiUploadCloud, FiPackage, FiMapPin, FiClock, FiCalendar, FiEye } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [id, setId] = useState<string | null>(null);
    const [order, setOrder] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);

    // Action State
    const [processing, setProcessing] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    // Bus Modal State
    const [showBusModal, setShowBusModal] = useState(false);
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
    const [busPhotoPreview, setBusPhotoPreview] = useState<string | null>(null);

    // Watch file for preview
    const busPhotoFile = watch('busPhoto');
    useEffect(() => {
        if (busPhotoFile && busPhotoFile[0]) {
            setBusPhotoPreview(URL.createObjectURL(busPhotoFile[0]));
        }
    }, [busPhotoFile]);

    useEffect(() => {
        params.then(p => {
            setId(p.id);
            fetchOrder(p.id);
        });
    }, [params]);

    const fetchOrder = async (orderId: string) => {
        try {
            const res = await api.get(`/orders/${orderId}`);
            setOrder(res.data.order);
            setTimeline(res.data.timeline);
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusClick = (status: string) => {
        if (status === 'Assigned to Bus') {
            setShowBusModal(true);
        } else {
            updateStatus(status);
        }
    }

    const updateStatus = async (newStatus: string, extraData?: any) => {
        if (!extraData && !confirm(`Update status to ${newStatus}?`)) return;
        setProcessing(true);
        try {
            let payload = { status: newStatus, ...extraData };

            if (extraData instanceof FormData) {
                extraData.append('status', newStatus);
                await api.put(`/orders/${id}/status`, extraData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.put(`/orders/${id}/status`, payload);
            }

            fetchOrder(id!);
            alert('Status updated successfully');
            setShowBusModal(false);
            setBusPhotoPreview(null);
            reset();
        } catch (error) {
            alert('Failed to update status');
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const onBusSubmit = (data: any) => {
        // Validation
        const dispatchDateStr = data.dispatchDate;
        const departureTimeStr = data.departureTime;
        const arrivalDateStr = data.expectedArrival;

        if (dispatchDateStr && departureTimeStr && arrivalDateStr) {
            const departureDateTime = new Date(`${dispatchDateStr}T${departureTimeStr}`);
            const arrivalDateTime = new Date(arrivalDateStr);
            const now = new Date();

            if (arrivalDateTime <= now) {
                alert("Expected Arrival time cannot be in the past.");
                return;
            }

            if (arrivalDateTime <= departureDateTime) {
                alert("Expected Arrival time must be after the Departure time.");
                return;
            }
        }

        const formData = new FormData();
        // Send busDetails as a single JSON string for reliable parsing on backend with Multer
        const busDetailsPayload = {
            busNumber: data.busNumber,
            driverContact: data.driverContact,
            dispatchDate: data.dispatchDate,
            departureTime: data.departureTime,
            expectedArrival: data.expectedArrival
        };
        formData.append('busDetails', JSON.stringify(busDetailsPayload));

        if (data.busPhoto && data.busPhoto[0]) {
            formData.append('busPhoto', data.busPhoto[0]);
        }

        updateStatus('Assigned to Bus', formData);
    };

    const handleCancel = async () => {
        if (!cancelReason) return alert('Please provide a reason');
        if (!confirm('Are you surely wanting to Cancel this order?')) return;
        setProcessing(true);
        try {
            await api.post(`/orders/${id}/cancel`, { reason: cancelReason });
            fetchOrder(id!);
            alert('Order Cancelled');
            setCancelReason("");
        } catch (error) {
            alert('Failed to cancel order');
        } finally {
            setProcessing(false);
        }
    };

    // --- Components ---

    const StatusStepper = ({ currentStatus }: { currentStatus: string }) => {
        const steps = ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered'];
        const isCancelled = currentStatus === 'Cancelled';
        const currentIndex = steps.indexOf(currentStatus);

        return (
            <div style={{ width: '100%', padding: '1.5rem 0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>

                    {/* Background Line */}
                    <div style={{ position: 'absolute', top: '15px', left: 0, width: '100%', height: '4px', background: '#E2E8F0', zIndex: 0 }}></div>

                    {/* Active Line (Calculated Width) */}
                    <div style={{
                        position: 'absolute', top: '15px', left: 0, height: '4px', zIndex: 0, transition: 'all 0.5s',
                        background: isCancelled ? 'var(--danger)' : 'var(--primary)',
                        width: isCancelled ? '100%' : `${(currentIndex / (steps.length - 1)) * 100}%`
                    }}></div>

                    {steps.map((step, idx) => {
                        const isCompleted = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;

                        return (
                            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid', transition: 'all 0.3s',
                                    borderColor: isCancelled ? 'var(--danger)' : (isCompleted ? 'var(--primary)' : '#E2E8F0'),
                                    background: isCancelled ? 'var(--danger)' : (isCompleted ? 'var(--primary)' : 'white'),
                                    color: isCancelled || isCompleted ? 'white' : '#94A3B8',
                                    fontWeight: 700
                                }}>
                                    {isCompleted ? <FiCheckCircle /> : idx + 1}
                                </div>
                                <span style={{
                                    marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                                    color: isCurrent ? (isCancelled ? 'var(--danger)' : 'var(--primary)') : 'var(--text-muted)'
                                }}>{step}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };

    if (!order) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Order Details...</div>;

    return (
        <div className="container" style={{ paddingBottom: '4rem', position: 'relative' }}>

            {/* --- Bus Details Modal (Fixed Overlay) --- */}
            {showBusModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '12px',
                        width: '100%', maxWidth: '750px',
                        maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', borderRadius: '12px 12px 0 0' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FiTruck style={{ color: 'var(--primary)' }} /> Logistics Assignment
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Transport details for Order #{order._id.slice(-6).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setShowBusModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                                <FiXCircle size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit(onBusSubmit)} style={{ padding: '1.5rem' }}>
                            <div className="form-grid">

                                {/* Col 1: Vehicle */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '1px', marginBottom: '0.5rem' }}>Vehicle Info</h4>

                                    <div className="form-group">
                                        <label className="form-label">Bus Number *</label>
                                        <div style={{ position: 'relative' }}>
                                            <FiTruck style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                            <input {...register("busNumber", { required: true })} className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="e.g. GJ-01-XX-1234" />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Driver Contact *</label>
                                        <div style={{ position: 'relative' }}>
                                            <FiPackage style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                            <input
                                                {...register("driverContact", {
                                                    required: "Contact number is required",
                                                    pattern: {
                                                        value: /^\d{10}$/,
                                                        message: "Must be exactly 10 digits"
                                                    }
                                                })}
                                                className="form-input"
                                                style={{ paddingLeft: '2.5rem', borderColor: errors.driverContact ? 'var(--danger)' : undefined }}
                                                placeholder="10 digit Driver Number"
                                                maxLength={10}
                                                onInput={(e: any) => {
                                                    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                                }}
                                            />
                                        </div>
                                        {errors.driverContact && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.driverContact.message as string}</span>}
                                    </div>
                                </div>

                                {/* Col 2: Schedule */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '1px', marginBottom: '0.5rem' }}>Schedule</h4>

                                    <div className="form-group">
                                        <label className="form-label">Dispatch Date *</label>
                                        <div style={{ position: 'relative' }}>
                                            <FiCalendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                            <input type="date" {...register("dispatchDate", { required: true })} className="form-input" style={{ paddingLeft: '2.5rem' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Departure</label>
                                            <input type="time" {...register("departureTime")} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Est. Arrival</label>
                                            <input type="datetime-local" {...register("expectedArrival")} className="form-input" style={{ fontSize: '0.8rem' }} />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div style={{ margin: '1.5rem 0' }}>
                                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Upload Bus Photo / Receipt</label>
                                <label
                                    style={{
                                        height: '200px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '12px',
                                        backgroundColor: '#f8fafc',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                                >
                                    {busPhotoPreview ? (
                                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                            <Image src={busPhotoPreview} fill style={{ objectFit: 'contain', padding: '12px' }} alt="Preview" />
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                className="hover-overlay"
                                            >
                                                <span className="badge" style={{ background: 'white', color: 'black', padding: '8px 16px', borderRadius: '20px', fontWeight: 600 }}>Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                                            }}>
                                                <FiUploadCloud size={24} />
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#334155' }}>Click to Upload Receipt</span>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>JPG, PNG (Max 5MB)</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        {...register("busPhoto")}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                <button type="button" onClick={() => setShowBusModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={processing}>
                                    {processing ? 'Saving...' : 'Confirm Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* --- Main Page Content --- */}

            {/* Header */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <div style={{ background: 'white', padding: '0.5rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', display: 'flex' }}><FiArrowLeft /></div>
                    Back to Orders
                </button>
                <button onClick={() => window.print()} className="btn btn-secondary">
                    <FiPrinter /> Print Invoice
                </button>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: 0 }}>

                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Order Status Card */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Order #{order._id.slice(-6).toUpperCase()}</h1>
                                <p style={{ color: 'var(--text-muted)' }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`badge ${order.status === 'Cancelled' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                {order.status}
                            </span>
                        </div>
                        <StatusStepper currentStatus={order.status} />
                    </div>

                    {/* Logistics Card (If Active) */}
                    {order.status === 'Assigned to Bus' && order.busDetails && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: '4px solid var(--info)' }}>
                            <div style={{ padding: '1rem 1.5rem', background: '#F0F9FF', borderBottom: '1px solid #E0F2FE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FiTruck /> Logistics Details
                                </h3>
                                <span className="badge" style={{ background: 'white', color: '#0284C7', border: '1px solid #BAE6FD' }}>Active Shipment</span>
                            </div>
                            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Bus Info</label>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{order.busDetails.busNumber}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>Driver: {order.busDetails.driverContact}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Schedule</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                            <div style={{ background: '#F8FAFC', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Departure</div>
                                                <div style={{ fontWeight: 600 }}>
                                                    {order.busDetails.departureTime
                                                        ? new Date(order.busDetails.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : '--:--'}
                                                </div>
                                            </div>
                                            <div style={{ color: '#CBD5E1' }}>➜</div>
                                            <div style={{ background: '#F8FAFC', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Arrival</div>
                                                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                    {order.busDetails.expectedArrival ? new Date(order.busDetails.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Photo Proof */}
                                <div style={{ height: '100%', minHeight: '120px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                                    {order.busDetails.busPhoto ? (
                                        (() => {
                                            const isAbsolute = order.busDetails.busPhoto.startsWith('http');
                                            const imageUrl = isAbsolute ? order.busDetails.busPhoto : `http://localhost:5000/${order.busDetails.busPhoto}`;
                                            return (
                                                <a href={imageUrl} target="_blank" style={{ display: 'block', height: '100%', width: '100%' }}>
                                                    <Image src={imageUrl} fill style={{ objectFit: 'cover' }} alt="Proof" />
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', opacity: 0, transition: '0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                                                        <FiEye style={{ color: 'white', fontSize: '2rem' }} />
                                                    </div>
                                                </a>
                                            )
                                        })()
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '0.8rem' }}>No Image</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customer Info */}
                    <div className="card">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><FiPackage /> Customer Details</h3>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{order.user?.username || order.guestCustomer?.name || 'Guest'}</div>
                                <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{order.user?.email || order.guestCustomer?.email}</div>
                                <div style={{ color: 'var(--text-muted)' }}>{order.user?.mobile || order.guestCustomer?.phone}</div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><FiMapPin /> Shipping Address</h3>
                                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                                    {order.shippingAddress}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Items ({order.items.length})</h3>
                        </div>
                        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th style={{ textAlign: 'right' }}>Price</th>
                                        <th style={{ textAlign: 'center' }}>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item: any) => (
                                        <tr key={item._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: '40px', height: '40px', position: 'relative', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                                        {item.product?.image && <Image src={`http://localhost:5000/${item.product.image}`} fill style={{ objectFit: 'contain' }} alt="prod" />}
                                                    </div>
                                                    <span style={{ fontWeight: 500 }}>{item.product?.title || 'Unknown Product'}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>₹{item.priceAtBooking}</td>
                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.totalWithTax || (item.priceAtBooking * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Subtotal</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{order.totalAmount}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Column: Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div className="card no-print" style={{ position: 'sticky', top: '1rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {['Packed', 'Assigned to Bus', 'Delivered'].map(status => {
                                const isDisabled = processing || order.status === 'Cancelled' || order.status === status ||
                                    (status === 'Packed' && order.status !== 'Order Placed') ||
                                    (status === 'Assigned to Bus' && order.status !== 'Packed') ||
                                    (status === 'Delivered' && order.status !== 'Assigned to Bus');

                                return (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusClick(status)}
                                        disabled={isDisabled}
                                        style={{
                                            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem',
                                            background: order.status === status ? '#ECFDF5' : 'white',
                                            border: order.status === status ? '1px solid #10B981' : '1px solid var(--border)',
                                            color: order.status === status ? '#047857' : 'var(--text-main)',
                                            borderRadius: '8px',
                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            opacity: (isDisabled && order.status !== status) ? 0.5 : 1
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{status}</span>
                                        {order.status === status ? <FiCheckCircle /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E2E8F0' }}></div>}
                                    </button>
                                )
                            })}
                        </div>

                        {order.status !== 'Cancelled' && (
                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--danger)', letterSpacing: '1px', marginBottom: '0.5rem' }}>Danger Zone</h4>
                                <textarea
                                    className="form-input"
                                    placeholder="Reason for cancellation..."
                                    rows={2}
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    style={{ marginBottom: '0.5rem', borderColor: '#FECACA' }}
                                ></textarea>
                                <button
                                    onClick={handleCancel}
                                    disabled={processing}
                                    className="btn btn-danger"
                                    style={{ width: '100%' }}
                                >
                                    <FiXCircle /> Confirm Cancellation
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Order Timeline</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {timeline.map((log, index) => (
                                    <div key={index} style={{ position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute', left: '-31px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: index === 0 ? 'var(--primary)' : '#CBD5E1',
                                            border: '3px solid white', boxShadow: '0 0 0 1px #E2E8F0'
                                        }}></div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{log.status}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                                                {log.notes}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>By: {log.updatedByName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                .hover-overlay { opacity: 0; }
                .hover-overlay:hover { opacity: 1; }
                @media print {
                    .no-print { display: none !important; }
                    .card { box-shadow: none !important; border: 1px solid #ccc !important; }
                    body { background: white; }
                    .container { max-width: 100%; padding: 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
