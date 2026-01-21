'use client';

import { useEffect, useState } from 'react';

export default function InvoicePage({ params }: { params: { id: string } }) {
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        fetch(`http://localhost:5000/api/orders/${params.id}`)
            .then(res => res.json())
            .then(data => setOrder(data));
    }, [params.id]);

    if (!order) return <div>Loading Invoice...</div>;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <div style={{ background: 'white', minHeight: '100vh', padding: '2rem', fontFamily: 'Arial, sans-serif', color: '#000' }}>
            {/* Print Control */}
            <div className="no-print" style={{ textAlign: 'right', marginBottom: '2rem' }}>
                <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: '#0F172A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🖨️ Print Invoice</button>
            </div>

            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: '1px' }}>Tax Invoice</h1>
                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>Selfmade Industrial Systems</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>123, GIDC Industrial Estate, Vapi, Gujarat - 396195</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>GSTIN: 24ABCDE1234F1Z5</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1.2rem' }}><strong>Original Copy</strong></p>
                    <h3 style={{ margin: '0.5rem 0', color: '#ef4444' }}>#{order.invoiceNumber || 'DRAFT'}</h3>
                    <p style={{ margin: 0 }}>Date: {formatDate(order.invoiceDate || order.createdAt)}</p>
                </div>
            </div>

            {/* Addresses */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, border: '1px solid #ccc', padding: '1rem' }}>
                    <strong style={{ display: 'block', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Billed To:</strong>
                    <p style={{ margin: 0 }}>{order.user ? 'Registered Customer' : 'Unregistered User'}</p>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{order.shippingAddress}</p>
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
                    {order.items.map((item: any, idx: number) => {
                        const gstAmt = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
                        const taxable = item.priceAtBooking * item.quantity;
                        return (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                                <td style={{ padding: '0.5rem' }}>{item.product?.name}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.product?.hsnCode || 'N/A'}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.quantity} {item.product?.unit || 'Nos'}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{item.priceAtBooking}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{taxable}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem' }}>
                                        {item.igst ? `IGST ${item.gstRate}%` : `CGST+SGST`}
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
                        <span>₹{order.totalAmount - order.taxTotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                        <span>Total Tax (GST):</span>
                        <span>₹{order.taxTotal}</span>
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
