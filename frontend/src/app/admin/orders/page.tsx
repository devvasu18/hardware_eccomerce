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
    busDetails: any;
    paymentDetails: any;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    // Bus Assignment Form State
    const [busForm, setBusForm] = useState({ busNumber: '', driverContact: '', departureTime: '', expectedArrival: '' });
    const { modalState, hideModal, showSuccess, showError, showInfo } = useModal();

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

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/orders/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                showSuccess(`Order status updated to ${newStatus}`);
                fetchOrders();
            }
        } catch (e) {
            showError('Failed to update status.');
        }
    };

    const handleAssignBus = async () => {
        if (!selectedOrder) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/orders/${selectedOrder._id}/logistics`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(busForm)
            });
            if (res.ok) {
                showSuccess('Logistics updated and order marked as Shipped!');
                setSelectedOrder(null);
                fetchOrders();
            }
        } catch (e) {
            showError('Failed to update logistics.');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Orders...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Order & Logistics Management</h1>
                <button onClick={fetchOrders} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Refresh List</button>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Order Info</th>
                            <th style={{ padding: '1rem' }}>Customer</th>
                            <th style={{ padding: '1rem' }}>Amount</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Logistics</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>#{order.invoiceNumber || order._id.slice(-6).toUpperCase()}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {order.isGuestOrder ? (
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{order.guestCustomer?.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#F37021', fontWeight: 600 }}>GUEST</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{order.guestCustomer?.phone}</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{order.user?.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>REGISTERED</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{order.user?.mobile}</div>
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>₹{order.totalAmount}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{order.paymentMethod}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Packed">Packed</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {order.busDetails?.busNumber ? (
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{order.busDetails.busNumber}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{order.busDetails.driverContact}</div>
                                        </div>
                                    ) : <span style={{ color: '#94a3b8' }}>Not Shipped</span>}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={() => { setSelectedOrder(order); setBusForm({ busNumber: order.busDetails?.busNumber || '', driverContact: order.busDetails?.driverContact || '', departureTime: '', expectedArrival: '' }); }}
                                        className="btn btn-outline"
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                    >
                                        Update Logistics
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Logistics Assignment Modal */}
            {selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Update Shipment Details</h3>
                        <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>Order #{selectedOrder.invoiceNumber || selectedOrder._id}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Bus Number</label>
                                <input
                                    type="text"
                                    value={busForm.busNumber}
                                    onChange={e => setBusForm({ ...busForm, busNumber: e.target.value })}
                                    placeholder="e.g. GJ 01 XX 1234"
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Driver Contact</label>
                                <input
                                    type="text"
                                    value={busForm.driverContact}
                                    onChange={e => setBusForm({ ...busForm, driverContact: e.target.value })}
                                    placeholder="Mobile Number"
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Departure</label>
                                <input
                                    type="datetime-local"
                                    value={busForm.departureTime}
                                    onChange={e => setBusForm({ ...busForm, departureTime: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Exp. Arrival</label>
                                <input
                                    type="datetime-local"
                                    value={busForm.expectedArrival}
                                    onChange={e => setBusForm({ ...busForm, expectedArrival: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>Cancel</button>
                            <button onClick={handleAssignBus} className="btn btn-primary">Update & mark as Shipped</button>
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
