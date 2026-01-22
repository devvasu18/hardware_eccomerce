'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import Link from 'next/link';
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
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch order details
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`http://localhost:5000/api/orders/${params.id}`, { headers })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setOrder(data.order);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Order...</div>;
    if (!order) return <div style={{ padding: '4rem', textAlign: 'center' }}>Order not found.</div>;

    return (
        <main>
            <Header />
            <div className="container" style={{ padding: '4rem 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ width: '80px', height: '80px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <span style={{ fontSize: '3rem', color: '#10b981' }}>✓</span>
                    </div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Order Placed Successfully!</h1>
                    <p style={{ fontSize: '1.2rem', color: '#64748B' }}>Invoice Number: <strong>{order.invoiceNumber}</strong></p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                    {/* Left: Order Items */}
                    <div>
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Order Items</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: idx < order.items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                {item.product?.imageUrl && <img src={item.product.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{item.product?.name || 'Product'}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ''}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 600 }}>₹{item.totalWithTax}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Delivery Address</h3>
                            <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{order.shippingAddress}</p>
                        </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div>
                        <div className="card">
                            <h3 style={{ marginBottom: '1rem' }}>Order Status</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>{order.status}</span>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>🚚 Logistics Details</h4>
                                {order.status === 'Pending' || order.status === 'Processing' || order.status === 'Packed' ? (
                                    <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Your order is being prepared. Tracking details will be available once shipped.</p>
                                ) : (
                                    <div style={{ fontSize: '0.9rem' }}>
                                        <p style={{ marginBottom: '0.5rem' }}><strong>Bus No:</strong> {order.busDetails?.busNumber || 'Allocating...'}</p>
                                        <p><strong>Driver Contact:</strong> {order.busDetails?.driverContact || 'N/A'}</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem' }}>
                                    <span>Total Paid</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#64748B', textAlign: 'right' }}>
                                    Incl. Tax ₹{order.taxTotal}
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <a
                                    href={`/orders/${order._id}/invoice`}
                                    target="_blank"
                                    className="btn btn-primary"
                                    style={{ textAlign: 'center', textDecoration: 'none' }}
                                >
                                    Download GST Invoice
                                </a>
                                <Link
                                    href="/products"
                                    className="btn btn-outline"
                                    style={{ textAlign: 'center' }}
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
