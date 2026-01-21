'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import { useAuth } from '@/context/AuthContext'; // Client side fetching for now needs token

interface Order {
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: any[];
    tallyStatus: string;
    busDetails?: {
        busNumber: string;
        driverContact: string;
        busPhoto: string;
    };
}

export default function OrderSuccessPage({ params }: { params: { id: string } }) {
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        // Fetch order details
        fetch(`http://localhost:5000/api/orders/${params.id}`)
            .then(res => res.json())
            .then(data => setOrder(data))
            .catch(err => console.error(err));
    }, [params.id]);

    if (!order) return <div style={{ padding: '4rem' }}>Loading Order...</div>;

    return (
        <main>
            <Header />
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <span style={{ fontSize: '3rem', color: '#10b981' }}>✓</span>
                </div>

                <h1 style={{ marginBottom: '1rem' }}>Order Placed Successfully!</h1>
                <p style={{ fontSize: '1.2rem', color: '#64748B', marginBottom: '2rem' }}>Order ID: #{order._id}</p>

                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <strong>Status:</strong>
                        <span className="badge badge-new" style={{ background: '#3b82f6', color: 'white' }}>{order.status}</span>
                    </div>

                    {/* Logistics Tracker Placeholder */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🚛 Logistics Tracker
                        </h4>
                        {order.status === 'Order Placed' ? (
                            <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Your order is being packed. Once assigned to a bus, tracking details will appear here.</p>
                        ) : (
                            <div>
                                <p><strong>Bus No:</strong> {order.busDetails?.busNumber || 'Pending'}</p>
                                <p><strong>Driver:</strong> {order.busDetails?.driverContact || 'Pending'}</p>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <a
                            href={`/orders/${order._id}/invoice`}
                            target="_blank"
                            className="btn btn-outline"
                            style={{ width: '100%', display: 'inline-block', textDecoration: 'none', lineHeight: '2.5rem' }}
                        >
                            View & Print Invoice
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
