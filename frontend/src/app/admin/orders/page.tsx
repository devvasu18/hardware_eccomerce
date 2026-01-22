'use client';

import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

interface Order {
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: any[];
    user: any;
    guestCustomer?: any;
    isGuestOrder: boolean;
    busDetails: any;
    paymentMethod: string;
    invoiceNumber?: string;
}

interface ShipmentForm {
    busNumber: string;
    driverContact: string;
    departureTime: string;
    expectedArrival: string;
    dispatchDate: string;
    liveStatus: string;
    notes: string;
    busPhoto: File | null;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [shipmentForm, setShipmentForm] = useState<ShipmentForm>({
        busNumber: '',
        driverContact: '',
        departureTime: '',
        expectedArrival: '',
        dispatchDate: new Date().toISOString().slice(0, 16),
        liveStatus: 'Preparing',
        notes: '',
        busPhoto: null
    });
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const { modalState, hideModal, showSuccess, showError } = useModal();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/orders/admin/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            showError('Failed to load orders.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/status/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId, status: newStatus })
            });

            const data = await res.json();

            if (data.success) {
                showSuccess(`Order status updated to ${newStatus}`);
                fetchOrders();
            } else {
                showError(data.message || 'Failed to update status');
            }
        } catch (e) {
            console.error('Status update error:', e);
            showError('Failed to update status.');
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showError('Please select an image file');
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showError('Image size must be less than 5MB');
                return;
            }

            setShipmentForm({ ...shipmentForm, busPhoto: file });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAssignShipment = async () => {
        if (!selectedOrder) return;

        // Validation
        if (!shipmentForm.busNumber || !shipmentForm.driverContact ||
            !shipmentForm.departureTime || !shipmentForm.expectedArrival) {
            showError('Please fill all required fields');
            return;
        }

        if (!shipmentForm.busPhoto) {
            showError('Please upload a bus photo');
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('orderId', selectedOrder._id);
            formData.append('busNumber', shipmentForm.busNumber);
            formData.append('driverContact', shipmentForm.driverContact);
            formData.append('departureTime', shipmentForm.departureTime);
            formData.append('expectedArrival', shipmentForm.expectedArrival);
            formData.append('dispatchDate', shipmentForm.dispatchDate);
            formData.append('liveStatus', shipmentForm.liveStatus);
            formData.append('notes', shipmentForm.notes);
            formData.append('busPhoto', shipmentForm.busPhoto);

            const res = await fetch('http://localhost:5000/api/shipments/assign', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                showSuccess('Shipment assigned successfully!');
                setSelectedOrder(null);
                resetForm();
                fetchOrders();
            } else {
                showError(data.message || 'Failed to assign shipment');
            }
        } catch (e) {
            console.error('Assign shipment error:', e);
            showError('Failed to assign shipment.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setShipmentForm({
            busNumber: '',
            driverContact: '',
            departureTime: '',
            expectedArrival: '',
            dispatchDate: new Date().toISOString().slice(0, 16),
            liveStatus: 'Preparing',
            notes: '',
            busPhoto: null
        });
        setPhotoPreview('');
    };

    const openShipmentModal = (order: Order) => {
        setSelectedOrder(order);
        // Pre-fill if shipment already exists
        if (order.busDetails?.busNumber) {
            setShipmentForm({
                busNumber: order.busDetails.busNumber || '',
                driverContact: order.busDetails.driverContact || '',
                departureTime: order.busDetails.departureTime ?
                    new Date(order.busDetails.departureTime).toISOString().slice(0, 16) : '',
                expectedArrival: order.busDetails.expectedArrival ?
                    new Date(order.busDetails.expectedArrival).toISOString().slice(0, 16) : '',
                dispatchDate: order.busDetails.dispatchDate ?
                    new Date(order.busDetails.dispatchDate).toISOString().slice(0, 16) :
                    new Date().toISOString().slice(0, 16),
                liveStatus: 'Preparing',
                notes: '',
                busPhoto: null
            });
        } else {
            resetForm();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Order Placed': return '#3b82f6';
            case 'Packed': return '#f59e0b';
            case 'Assigned to Bus': return '#8b5cf6';
            case 'Delivered': return '#10b981';
            case 'Cancelled': return '#ef4444';
            default: return '#64748b';
        }
    };

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading Orders...</div>
        </div>
    );

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Order Delivery Management</h1>
                <button
                    onClick={fetchOrders}
                    className="btn btn-outline"
                    style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
                >
                    🔄 Refresh
                </button>
            </div>

            {orders.length === 0 ? (
                <div style={{
                    background: 'white',
                    padding: '3rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#64748b'
                }}>
                    No orders found
                </div>
            ) : (
                <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Order Info</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Customer</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Amount</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Shipment</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                            #{order.invoiceNumber || order._id.slice(-6).toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {order.isGuestOrder ? (
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{order.guestCustomer?.name}</div>
                                                <div style={{
                                                    fontSize: '0.7rem',
                                                    color: '#F37021',
                                                    fontWeight: 700,
                                                    marginTop: '0.25rem'
                                                }}>
                                                    GUEST ORDER
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {order.guestCustomer?.phone}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{order.user?.username}</div>
                                                <div style={{
                                                    fontSize: '0.7rem',
                                                    color: '#3b82f6',
                                                    fontWeight: 700,
                                                    marginTop: '0.25rem'
                                                }}>
                                                    REGISTERED
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {order.user?.mobile}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                            ₹{order.totalAmount.toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {order.paymentMethod}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '6px',
                                                border: '2px solid #e2e8f0',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                color: getStatusColor(order.status),
                                                cursor: 'pointer',
                                                background: 'white'
                                            }}
                                        >
                                            <option value="Order Placed">Order Placed</option>
                                            <option value="Packed">Packed</option>
                                            <option value="Assigned to Bus">Assigned to Bus</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {order.busDetails?.busNumber ? (
                                            <div>
                                                <div style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    color: '#8b5cf6'
                                                }}>
                                                    🚌 {order.busDetails.busNumber}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                    📞 {order.busDetails.driverContact}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                                Not assigned
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => openShipmentModal(order)}
                                            className="btn btn-primary"
                                            style={{
                                                fontSize: '0.85rem',
                                                padding: '0.5rem 1rem',
                                                background: order.busDetails?.busNumber ? '#8b5cf6' : '#3b82f6'
                                            }}
                                        >
                                            {order.busDetails?.busNumber ? '✏️ Update' : '➕ Assign'} Shipment
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Shipment Assignment Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '600px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                            🚌 Assign Shipment
                        </h2>
                        <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                            Order #{selectedOrder.invoiceNumber || selectedOrder._id.slice(-6)}
                        </p>

                        {/* Bus Photo Upload */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.95rem'
                            }}>
                                Bus Photo <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    border: '2px dashed #cbd5e1',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            />
                            {photoPreview && (
                                <div style={{ marginTop: '1rem' }}>
                                    <img
                                        src={photoPreview}
                                        alt="Bus preview"
                                        style={{
                                            width: '100%',
                                            maxHeight: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            border: '2px solid #e2e8f0'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Bus Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    Bus Number <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={shipmentForm.busNumber}
                                    onChange={e => setShipmentForm({ ...shipmentForm, busNumber: e.target.value })}
                                    placeholder="e.g. RJ14 AB 4521"
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        border: '2px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    Driver Contact <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={shipmentForm.driverContact}
                                    onChange={e => setShipmentForm({ ...shipmentForm, driverContact: e.target.value })}
                                    placeholder="+91 9XXXXXXXXX"
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        border: '2px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Timing Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    Departure Time <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={shipmentForm.departureTime}
                                    onChange={e => setShipmentForm({ ...shipmentForm, departureTime: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        border: '2px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    Expected Arrival <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={shipmentForm.expectedArrival}
                                    onChange={e => setShipmentForm({ ...shipmentForm, expectedArrival: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        border: '2px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Dispatch Date and Live Status */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    Dispatch Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={shipmentForm.dispatchDate}
                                    onChange={e => setShipmentForm({ ...shipmentForm, dispatchDate: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        border: '2px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    Live Status
                                </label>
                                <select
                                    value={shipmentForm.liveStatus}
                                    onChange={e => setShipmentForm({ ...shipmentForm, liveStatus: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        border: '2px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    <option value="Preparing">Preparing</option>
                                    <option value="On the way">On the way</option>
                                    <option value="Arrived at destination">Arrived at destination</option>
                                    <option value="Out for delivery">Out for delivery</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                Notes (Optional)
                            </label>
                            <textarea
                                value={shipmentForm.notes}
                                onChange={e => setShipmentForm({ ...shipmentForm, notes: e.target.value })}
                                placeholder="Any additional information..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '0.7rem',
                                    border: '2px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: '0.95rem',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setSelectedOrder(null);
                                    resetForm();
                                }}
                                style={{
                                    background: 'none',
                                    border: '2px solid #e2e8f0',
                                    padding: '0.7rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    fontWeight: 600,
                                    fontSize: '0.95rem'
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignShipment}
                                className="btn btn-primary"
                                style={{
                                    padding: '0.7rem 1.5rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 600
                                }}
                                disabled={submitting}
                            >
                                {submitting ? 'Assigning...' : '✓ Assign Shipment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}
