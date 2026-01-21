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
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Bus Assignment Form State
    const [busForm, setBusForm] = useState({ busNumber: '', driverContact: '' });
    const { modalState, hideModal, showSuccess, showError, showInfo } = useModal();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const res = await fetch('http://localhost:5000/api/orders');
        if (res.ok) setOrders(await res.json());
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        // In real app, we use a separate endpoint or PATCH
        // For now, assuming we might build a specific action endpoint
        showInfo(`Status update to ${newStatus} is pending API implementation.`, 'API Not Implemented');
    };

    const handleAssignBus = async () => {
        if (!selectedOrder) return;
        try {
            const res = await fetch(`http://localhost:5000/api/orders/${selectedOrder._id}/logistics`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(busForm)
            });
            if (res.ok) {
                showSuccess('Bus has been assigned successfully!');
                setSelectedOrder(null);
                fetchOrders(); // Refresh
            }
        } catch (e) {
            showError('Failed to update logistics. Please try again.');
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Logistics Management</h1>

            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Order ID</th>
                            <th style={{ padding: '1rem' }}>Customer</th>
                            <th style={{ padding: '1rem' }}>Amount</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Logistics</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem' }}>{order._id.slice(-6).toUpperCase()}</td>
                                <td style={{ padding: '1rem' }}>{order.user || 'Guest'}</td>
                                <td style={{ padding: '1rem' }}>₹{order.totalAmount}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span className="badge" style={{
                                        background: order.status === 'Order Placed' ? '#fef3c7' : '#ecfdf5',
                                        color: order.status === 'Order Placed' ? '#92400e' : '#065f46'
                                    }}>
                                        {order.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {order.busDetails?.busNumber ? (
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{order.busDetails.busNumber}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{order.busDetails.driverContact}</div>
                                        </div>
                                    ) : <span style={{ color: '#94a3b8' }}>Not Assigned</span>}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {order.status === 'Order Placed' && (
                                        <button
                                            onClick={() => { setSelectedOrder(order); setBusForm({ busNumber: '', driverContact: '' }); }}
                                            className="btn btn-primary"
                                            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                                        >
                                            Assign Bus
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bus Assignment Modal */}
            {selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Assign Logistics</h3>
                        <p style={{ marginBottom: '1rem', color: '#64748B' }}>Order #{selectedOrder._id.slice(-6)}</p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Bus Number</label>
                            <input
                                type="text"
                                value={busForm.busNumber}
                                onChange={e => setBusForm({ ...busForm, busNumber: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Driver Contact</label>
                            <input
                                type="text"
                                value={busForm.driverContact}
                                onChange={e => setBusForm({ ...busForm, driverContact: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleAssignBus} className="btn btn-primary">Save & Dispatch</button>
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
