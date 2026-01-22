'use client';

import { useEffect, useState, use } from 'react';
import Header from '@/app/components/Header';
import Link from 'next/link';

interface StatusLog {
    _id: string;
    status: string;
    updatedByName: string;
    updatedByRole: string;
    timestamp: string;
    notes?: string;
    isSystemGenerated: boolean;
}

interface Shipment {
    busNumber: string;
    busPhotoUrl: string;
    driverContact: string;
    departureTime: string;
    expectedArrival: string;
    dispatchDate: string;
    liveStatus: string;
    currentLocation?: string;
    notes?: string;
}

interface Order {
    _id: string;
    totalAmount: number;
    taxTotal: number;
    status: string;
    createdAt: string;
    items: any[];
    invoiceNumber?: string;
    shippingAddress: string;
    paymentMethod: string;
    busDetails?: any;
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params); // Unwrap params
    const [order, setOrder] = useState<Order | null>(null);
    const [statusHistory, setStatusHistory] = useState<StatusLog[]>([]);
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Fetch order
            const orderRes = await fetch(`http://localhost:5000/api/orders/${id}`, { headers });
            const orderData = await orderRes.json();

            if (orderData.success) {
                setOrder(orderData.order);

                // Fetch status history
                const historyRes = await fetch(`http://localhost:5000/api/status/history/${id}`, { headers });
                const historyData = await historyRes.json();
                if (historyData.success) {
                    setStatusHistory(historyData.statusHistory);
                }

                // Fetch shipment if assigned
                try {
                    const shipmentRes = await fetch(`http://localhost:5000/api/shipments/order/${id}`, { headers });
                    const shipmentData = await shipmentRes.json();
                    if (shipmentData.success) {
                        setShipment(shipmentData.shipment);
                    }
                } catch (err) {
                    // Shipment not assigned yet
                    console.log('No shipment assigned yet');
                }
            }
        } catch (err) {
            console.error('Failed to fetch order details:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Order Placed': return '✔️';
            case 'Packed': return '📦';
            case 'Assigned to Bus': return '🚌';
            case 'Delivered': return '🎯';
            case 'Cancelled': return '❌';
            default: return '⏳';
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

    const isStatusCompleted = (status: string, currentStatus: string) => {
        const statusOrder = ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered'];
        const statusIndex = statusOrder.indexOf(status);
        const currentIndex = statusOrder.indexOf(currentStatus);
        return statusIndex <= currentIndex;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDateTime = (dateString: string) => {
        return `${formatDate(dateString)}, ${formatTime(dateString)}`;
    };

    if (loading) {
        return (
            <main>
                <Header />
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading order details...</div>
                </div>
            </main>
        );
    }

    if (!order) {
        return (
            <main>
                <Header />
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', color: '#ef4444', marginBottom: '1rem' }}>Order not found</div>
                    <Link href="/products" className="btn btn-primary">Continue Shopping</Link>
                </div>
            </main>
        );
    }

    const statusFlow = ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered'];

    return (
        <main>
            <Header />
            <div className="container" style={{ padding: '3rem 0', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/products" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
                        ← Back to Products
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
                        Order Tracking
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                        Order #{order.invoiceNumber || order._id.slice(-8).toUpperCase()}
                    </p>
                </div>

                {/* Progress Tracker */}
                <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '2rem' }}>Order Status</h2>

                    {/* Horizontal Progress Bar */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        marginBottom: '3rem'
                    }}>
                        {/* Progress Line */}
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            left: '0',
                            right: '0',
                            height: '4px',
                            background: '#e2e8f0',
                            zIndex: 0
                        }}>
                            <div style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                width: `${(statusFlow.indexOf(order.status) / (statusFlow.length - 1)) * 100}%`,
                                transition: 'width 0.5s ease'
                            }} />
                        </div>

                        {/* Status Points */}
                        {statusFlow.map((status, index) => {
                            const isCompleted = isStatusCompleted(status, order.status);
                            const isCurrent = status === order.status;

                            return (
                                <div
                                    key={status}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        zIndex: 1,
                                        flex: 1
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: isCompleted ? getStatusColor(status) : '#e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        marginBottom: '0.75rem',
                                        border: isCurrent ? '3px solid white' : 'none',
                                        boxShadow: isCurrent ? `0 0 0 3px ${getStatusColor(status)}` : 'none',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {isCompleted ? getStatusIcon(status) : '⏳'}
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: isCurrent ? 700 : 600,
                                        color: isCompleted ? '#1e293b' : '#94a3b8',
                                        textAlign: 'center',
                                        maxWidth: '100px'
                                    }}>
                                        {status}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Current Status Badge */}
                    <div style={{
                        background: `${getStatusColor(order.status)}15`,
                        border: `2px solid ${getStatusColor(order.status)}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>
                            Current Status
                        </div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: getStatusColor(order.status)
                        }}>
                            {getStatusIcon(order.status)} {order.status}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                    {/* Left Column: Timeline and Items */}
                    <div style={{ flex: '1 1 500px' }}>
                        {/* Status Timeline */}
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                                📋 Status History
                            </h3>

                            {statusHistory.length === 0 ? (
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No status updates yet</p>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    {/* Timeline Line */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '15px',
                                        top: '10px',
                                        bottom: '10px',
                                        width: '2px',
                                        background: '#e2e8f0'
                                    }} />

                                    {/* Timeline Items */}
                                    {statusHistory.map((log, index) => (
                                        <div
                                            key={log._id}
                                            style={{
                                                position: 'relative',
                                                paddingLeft: '3rem',
                                                paddingBottom: index < statusHistory.length - 1 ? '1.5rem' : '0'
                                            }}
                                        >
                                            {/* Timeline Dot */}
                                            <div style={{
                                                position: 'absolute',
                                                left: '8px',
                                                top: '5px',
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                background: getStatusColor(log.status),
                                                border: '3px solid white',
                                                boxShadow: '0 0 0 2px #e2e8f0'
                                            }} />

                                            {/* Content */}
                                            <div>
                                                <div style={{
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem',
                                                    color: '#1e293b',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {getStatusIcon(log.status)} {log.status}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: '#64748b',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {formatDateTime(log.timestamp)}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    Updated by: {log.updatedByName} ({log.updatedByRole})
                                                </div>
                                                {log.notes && (
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: '#475569',
                                                        marginTop: '0.5rem',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        Note: {log.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="card">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                                📦 Order Items
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {order.items.map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            paddingBottom: '1rem',
                                            borderBottom: idx < order.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                background: '#f1f5f9',
                                                borderRadius: '6px',
                                                overflow: 'hidden'
                                            }}>
                                                {item.product?.imageUrl && (
                                                    <img
                                                        src={item.product.imageUrl}
                                                        alt={item.product.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                    {item.product?.name || 'Product'}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                            ₹{item.totalWithTax?.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Shipment Details and Summary */}
                    <div style={{ flex: '1 1 400px' }}>
                        {/* Shipment Details Card */}
                        {shipment ? (
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                                    🚌 Shipment Details
                                </h3>

                                {/* Bus Photo */}
                                {shipment.busPhotoUrl && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <img
                                            src={`http://localhost:5000${shipment.busPhotoUrl}`}
                                            alt="Bus"
                                            style={{
                                                width: '100%',
                                                height: '200px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Shipment Info Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            Bus Number
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                                            {shipment.busNumber}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            Driver Contact
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                                            {shipment.driverContact}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            Dispatch Date
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                                            {formatDate(shipment.dispatchDate)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            Live Status
                                        </div>
                                        <div style={{
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            color: '#8b5cf6',
                                            background: '#8b5cf615',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            display: 'inline-block'
                                        }}>
                                            {shipment.liveStatus}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            Departure Time
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                                            {formatDateTime(shipment.departureTime)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            Expected Arrival
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                                            {formatDateTime(shipment.expectedArrival)}
                                        </div>
                                    </div>
                                </div>

                                {shipment.currentLocation && (
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '1rem',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            Current Location
                                        </div>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                            📍 {shipment.currentLocation}
                                        </div>
                                    </div>
                                )}

                                {shipment.notes && (
                                    <div style={{
                                        background: '#fffbeb',
                                        padding: '1rem',
                                        borderRadius: '6px',
                                        border: '1px solid #fef3c7',
                                        marginTop: '1rem'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.25rem' }}>
                                            Note
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#78350f' }}>
                                            {shipment.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : order.status === 'Order Placed' || order.status === 'Packed' ? (
                            <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Preparing Your Order
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                    Shipment details will be available once your order is assigned to a bus
                                </p>
                            </div>
                        ) : null}

                        {/* Order Summary */}
                        <div className="card">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                                💰 Order Summary
                            </h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.75rem',
                                    fontSize: '0.95rem'
                                }}>
                                    <span style={{ color: '#64748b' }}>Subtotal</span>
                                    <span style={{ fontWeight: 600 }}>
                                        ₹{(order.totalAmount - order.taxTotal).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.75rem',
                                    fontSize: '0.95rem'
                                }}>
                                    <span style={{ color: '#64748b' }}>Tax (GST)</span>
                                    <span style={{ fontWeight: 600 }}>
                                        ₹{order.taxTotal?.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div style={{
                                    borderTop: '2px solid #e2e8f0',
                                    paddingTop: '0.75rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '1.2rem',
                                    fontWeight: 700
                                }}>
                                    <span>Total</span>
                                    <span style={{ color: '#F37021' }}>
                                        ₹{order.totalAmount.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                background: '#f8fafc',
                                padding: '1rem',
                                borderRadius: '6px',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                    Payment Method
                                </div>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                    {order.paymentMethod}
                                </div>
                            </div>

                            <div style={{
                                background: '#f8fafc',
                                padding: '1rem',
                                borderRadius: '6px',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                    Delivery Address
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                                    {order.shippingAddress}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <a
                                    href={`/orders/${order._id}/invoice`}
                                    target="_blank"
                                    className="btn btn-primary"
                                    style={{ textAlign: 'center', textDecoration: 'none' }}
                                >
                                    📄 Download Invoice
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
