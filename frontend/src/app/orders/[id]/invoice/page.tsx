'use client';

import { useEffect, useState, use } from 'react';
import { getSystemSettings } from '../../../utils/systemSettings';
import Link from 'next/link';

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('Hardware Store');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyGstNumber, setCompanyGstNumber] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getSystemSettings();
            if (settings) {
                if (settings.companyName) setCompanyName(settings.companyName);
                if (settings.companyAddress) setCompanyAddress(settings.companyAddress);
                if (settings.companyGstNumber) setCompanyGstNumber(settings.companyGstNumber);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const headers: any = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`/api/orders/${id}`, { headers });
                const data = await res.json();

                if (data.success && data.order) {
                    setOrder(data.order);
                } else {
                    setError(data.message || 'Failed to fetch order details');
                }
            } catch (err: any) {
                console.error('Error fetching invoice:', err);
                setError(err.message || 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', fontFamily: 'Arial' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #0F172A', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <div>Loading Invoice...</div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', fontFamily: 'Arial', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h2 style={{ margin: 0 }}>Unable to Load Invoice</h2>
            <p style={{ color: '#666', maxWidth: '400px' }}>{error}</p>
            <Link href="/" style={{ padding: '0.75rem 1.5rem', background: '#0F172A', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Return Home</Link>
        </div>
    );

    if (!order) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <div style={{ background: 'white', minHeight: '100vh', padding: '2rem', fontFamily: 'Arial, sans-serif', color: '#000' }}>
            {/* Print Control */}
            <div className="no-print" style={{ textAlign: 'right', marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Link href={`/orders/${id}`} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', color: '#374151', textDecoration: 'none', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>← Back to Order</Link>
                <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: '#0F172A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>🖨️ Print Invoice</button>
            </div>

            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: '1px' }}>Tax Invoice</h1>
                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>{companyName}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{companyAddress}</p>
                    {companyGstNumber && <p style={{ margin: 0, fontSize: '0.9rem' }}>GSTIN: {companyGstNumber}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1.2rem' }}><strong>Original Copy</strong></p>
                    <h3 style={{ margin: '0.5rem 0', color: '#ef4444' }}>#{order.invoiceNumber || order._id?.slice(-8).toUpperCase() || 'DRAFT'}</h3>
                    <p style={{ margin: 0 }}>Date: {formatDate(order.invoiceDate || order.createdAt)}</p>
                </div>
            </div>

            {/* Addresses */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, border: '1px solid #ccc', padding: '1rem' }}>
                    <strong style={{ display: 'block', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Billed To:</strong>
                    <p style={{ margin: 0 }}>{order.user ? order.user.username : 'Guest Customer'}</p>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{order.shippingAddress}</p>
                    {order.user?.mobile && <p style={{ margin: 0 }}>Phone: {order.user.mobile}</p>}
                </div>
                <div style={{ flex: 1, border: '1px solid #ccc', padding: '1rem' }}>
                    <strong style={{ display: 'block', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Shipped To:</strong>
                    <p style={{ margin: 0 }}>{order.shippingAddress}</p>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}><strong>Dispatched Via:</strong> {order.busDetails?.busNumber || 'Pending Assignment'}</p>
                </div>
            </div>

            {/* Item Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                    <tr style={{ background: '#f3f4f6', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Product Description</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>HSN</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Rate</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Taxable</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>GST</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items?.map((item: any, idx: number) => {
                        const gstAmt = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
                        const taxable = item.priceAtBooking * item.quantity;
                        return (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                                <td style={{ padding: '0.5rem' }}>{item.product?.name || item.productTitle}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.product?.hsnCode || 'N/A'}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.quantity} {item.product?.unit || 'Nos'}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{item.priceAtBooking}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{taxable}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem' }}>
                                        {item.igst || item.gstRate > 0 ? (item.igst ? `IGST ${item.gstRate}%` : `CGST+SGST (${item.gstRate}%)`) : 'Zero Rated'}
                                    </div>
                                    ₹{Math.round(gstAmt)}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>₹{item.totalWithTax || taxable + gstAmt}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                        <span>Total Taxable Amount:</span>
                        <span>₹{order.totalAmount - (order.taxTotal || 0) + (order.discountAmount || 0)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#B91C1C' }}>
                            <span>Coupon Discount ({order.couponCode}):</span>
                            <span>-₹{order.discountAmount}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                        <span>Total Tax (GST):</span>
                        <span>₹{order.taxTotal || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '2px solid #000', borderBottom: '2px double #000', margin: '0.5rem 0' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Grand Total:</span>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>₹{order.totalAmount}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', textAlign: 'right', margin: 0 }}>Amount in Words: {order.totalAmount} Rupees Only</p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '4rem', fontSize: '0.8rem', textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
                <p>This is a Computer Generated Invoice.</p>
                <p>Subject to Vapi Jurisdiction.</p>
            </div>

            <style jsx global>{`
           @media print {
               .no-print { display: none !important; }
               body { background: white; }
           }
       `}</style>
        </div>
    );
}

