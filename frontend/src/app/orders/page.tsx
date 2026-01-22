'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Order {
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: Array<{
        product: {
            name: string;
            imageUrl?: string;
        };
        quantity: number;
    }>;
    invoiceNumber?: string;
}

export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/orders');
            return;
        }

        if (user) {
            fetchOrders();
        }
    }, [user, authLoading, router]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/orders/my-orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Order Placed': return 'bg-blue-100 text-blue-800';
            case 'Packed': return 'bg-yellow-100 text-yellow-800';
            case 'Assigned to Bus': return 'bg-purple-100 text-purple-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Inline styles for status badge simulation since I'm not sure if full Tailwind is available/configured everywhere
    // but the getStatusColor suggests string classes. I'll use inline styles to be safe matching the design of other pages.
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Order Placed': return { background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
            case 'Packed': return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
            case 'Assigned to Bus': return { background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' };
            case 'Delivered': return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
            case 'Cancelled': return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
            default: return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
        }
    };

    if (authLoading || (loading && user)) {
        return (
            <main>
                <Header />
                <div style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading your orders...</div>
                </div>
            </main>
        );
    }

    if (!user) return null; // Will redirect

    return (
        <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
            <Header />
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#1e293b' }}>My Orders</h1>

                {orders.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1e293b' }}>No orders yet</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Looks like you haven't placed any orders yet.</p>
                        <Link href="/products" className="btn btn-primary">Start Shopping</Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {orders.map((order) => (
                            <div key={order._id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', display: 'block', textDecoration: 'none' }}>
                                {/* Order Header */}
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', background: '#fff' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Order Placed</div>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatDate(order.createdAt)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total</div>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>₹{order.totalAmount.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Order ID</div>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>#{order.invoiceNumber || order._id.slice(-8).toUpperCase()}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <Link href={`/orders/${order._id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                            View Details
                                        </Link>
                                    </div>
                                </div>

                                {/* Order Body */}
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{
                                            ...getStatusStyle(order.status),
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            display: 'inline-block'
                                        }}>
                                            {order.status}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                        {order.items.slice(0, 4).map((item, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                {item.product?.imageUrl ? (
                                                    <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
                                                )}
                                                <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '1px 5px', borderTopLeftRadius: '4px' }}>
                                                    x{item.quantity}
                                                </div>
                                            </div>
                                        ))}
                                        {order.items.length > 4 && (
                                            <div style={{ width: '80px', height: '80px', flexShrink: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                                                +{order.items.length - 4} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
