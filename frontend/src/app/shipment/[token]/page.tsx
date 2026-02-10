'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPackage, FiTruck, FiClock, FiPhone, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function ShipmentTrackingPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();

    const [shipment, setShipment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const fetchShipment = async () => {
            try {
                const res = await fetch(`/api/shipment/track/${token}`);
                const data = await res.json();

                if (!res.ok) {
                    if (res.status === 410) {
                        setExpired(true);
                    } else {
                        setError(data.message || 'Failed to load shipment details');
                    }
                } else {
                    setShipment(data);
                }
            } catch (err) {
                setError('Network error. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchShipment();
    }, [token]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)' }}>
                <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading shipment details...</div>
            </div>
        );
    }

    if (expired) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)' }}>
                <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'white', borderRadius: '12px', textAlign: 'center' }}>
                    <FiAlertCircle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', marginBottom: '1rem' }}>Link Expired</h1>
                    <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>This shipment tracking link has expired. Shipment images are only available for 7 days.</p>
                    <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Go to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)' }}>
                <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'white', borderRadius: '12px', textAlign: 'center' }}>
                    <FiAlertCircle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', marginBottom: '1rem' }}>Error</h1>
                    <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>{error}</p>
                    <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Go to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)', padding: '2rem 1rem' }}>
            <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <FiTruck size={32} color="#F37021" />
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Shipment Tracking</h1>
                            <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>Order #{shipment.orderNumber}</p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: '1rem', background: '#ECFDF5', borderRadius: '8px' }}>
                        <FiCheckCircle size={24} color="#059669" />
                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#059669' }}>In Transit</span>
                    </div>

                    {/* Bus Details */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem' }}>🚍 Bus Details</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 0.5rem' }}>Bus Number</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>{shipment.busNumber}</p>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 0.5rem' }}>Driver Contact</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FiPhone size={16} />
                                    {shipment.driverContact}
                                </p>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 0.5rem' }}>Departure</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>{shipment.departureTime}</p>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>{shipment.departureDate}</p>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 0.5rem' }}>Expected Arrival</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>{shipment.arrivalTime}</p>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0' }}>{shipment.arrivalDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipment Items */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem' }}>📦 Items in Shipment</h2>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                            {shipment.items.map((item: any, index: number) => (
                                <div key={index} style={{ padding: '1rem', borderBottom: index < shipment.items.length - 1 ? '1px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#1E293B', margin: '0 0 0.25rem' }}>{item.name}</p>
                                        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>{item.model} • {item.variant}</p>
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: '#64748B' }}>Qty: {item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipment Photo */}
                    {shipment.busPhoto && (
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem' }}>📸 Shipment Photo</h2>
                            <img
                                src={shipment.busPhoto}
                                alt="Shipment"
                                style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiClock size={14} />
                                This image will expire on {shipment.expiryDate}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
