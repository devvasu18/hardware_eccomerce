'use client';

import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

interface Request {
    _id: string;
    product: {
        _id: string;
        title: string;
        basePrice: number;
        mrp: number;
        selling_price_a?: number;
        stock: number;
        featured_image: string;
    };
    requestedQuantity: number;
    customerContact: {
        name: string;
        mobile: string;
    };
    status: string;
    createdAt: string;
    modelId?: string;
    variationId?: string;
    declaredBasePrice?: number;
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

    // Response Form
    const [responseForm, setResponseForm] = useState({ priceQuote: '', estimatedDelivery: '', adminNotes: '' });
    const { modalState, hideModal, showSuccess, showError, showModal } = useModal();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) setRequests(await res.json());
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/requests/${selectedRequest._id}/respond`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: 'Approved',
                    priceQuote: parseFloat(responseForm.priceQuote),
                    estimatedDelivery: responseForm.estimatedDelivery,
                    adminNotes: responseForm.adminNotes
                })
            });
            if (res.ok) {
                showSuccess('Quote has been sent to the customer successfully!');
                setSelectedRequest(null);
                fetchRequests();
            }
        } catch (e) {
            showError('Failed to send quote. Please try again.');
        }
    };

    const handleReject = async (id: string) => {
        const token = localStorage.getItem('token');
        showModal(
            'Reject Request',
            'Are you sure you want to reject this request? The customer will be notified.',
            'warning',
            {
                showCancel: true,
                confirmText: 'Reject',
                onConfirm: async () => {
                    try {
                        await fetch(`http://localhost:5000/api/requests/${id}/respond`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: 'Rejected' })
                        });
                        fetchRequests();
                        showSuccess('Request has been rejected.');
                    } catch (error) {
                        showError('Failed to reject request. Please try again.');
                    }
                }
            }
        );
    };

    const openProductPage = (req: Request) => {
        const url = `/products/${req.product._id}?model=${req.modelId || ''}&variant=${req.variationId || ''}`;
        window.open(url, '_blank');
    };

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Procurement Requests</h1>

            <div className="grid">
                {requests.map(req => (
                    <div key={req._id} className="card" style={{
                        borderLeft: req.status === 'Pending' ? '4px solid #f59e0b' :
                            (req.status === 'Rejected' || req.status === 'Cancelled' ? '4px solid #ef4444' : '4px solid #10b981'),
                        position: 'relative'
                    }}>
                        {/* Eye Button */}
                        <button
                            onClick={() => openProductPage(req)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="View Product Configuration"
                        >
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"></path></svg>
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="badge" style={{ background: '#f1f5f9' }}>{req.createdAt.split('T')[0]}</span>
                            <span style={{
                                fontWeight: 600,
                                color: req.status === 'Pending' ? '#b45309' : (req.status === 'Approved' ? '#065f46' : '#991b1b'),
                                marginRight: '2.5rem' // Make space for eye button
                            }}>
                                {req.status}
                            </span>
                        </div>

                        {/* Product Image and Title */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                            <img
                                src={req.product.featured_image}
                                alt={req.product.title}
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                            />
                            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{req.product.title}</h3>
                        </div>

                        <div style={{ marginBottom: '1rem', color: '#64748B' }}>
                            <p>Request ID: <span style={{ fontFamily: 'monospace' }}>{req._id}</span></p>
                            <p>Requested Qty: <strong>{req.requestedQuantity}</strong></p>
                            <p>Current Stock: {req.product.stock}</p>
                            <p>Base Price (Excl. GST): <strong>₹{typeof req.declaredBasePrice === 'number' ? req.declaredBasePrice : (req.product.selling_price_a || req.product.mrp || req.product.basePrice)}</strong></p>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            <strong>Customer Details:</strong><br />
                            Name: {req.customerContact.name}<br />
                            Mobile: {req.customerContact.mobile}
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                Submitted: {new Date(req.createdAt).toLocaleString()}
                            </div>
                        </div>

                        {req.status === 'Pending' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => {
                                        setSelectedRequest(req);
                                        const defaultPrice = req.declaredBasePrice || req.product.selling_price_a || req.product.mrp || req.product.basePrice || 0;
                                        setResponseForm({
                                            priceQuote: defaultPrice.toString(),
                                            estimatedDelivery: '',
                                            adminNotes: ''
                                        });
                                    }}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                >
                                    Reply with Quote
                                </button>
                                <button
                                    onClick={() => handleReject(req._id)}
                                    className="btn btn-outline"
                                    style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.5rem' }}
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quote Modal */}
            {selectedRequest && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '450px' }}>
                        <h3>Draft Quote for {selectedRequest.product.title}</h3>
                        <p style={{ marginBottom: '1rem', color: '#64748B' }}>Customer asking for {selectedRequest.requestedQuantity} units.</p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Quoted Price (Per Unit)</label>
                            <input
                                type="number"
                                placeholder={`Customer saw ₹${selectedRequest.declaredBasePrice || selectedRequest.product.basePrice}`}
                                value={responseForm.priceQuote}
                                readOnly
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#e2e8f0', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Est. Delivery</label>
                            <input
                                type="text"
                                placeholder="e.g. 3-4 Days"
                                value={responseForm.estimatedDelivery}
                                onChange={(e) => setResponseForm({ ...responseForm, estimatedDelivery: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Admin Notes (Optional)</label>
                            <textarea
                                value={responseForm.adminNotes}
                                onChange={(e) => setResponseForm({ ...responseForm, adminNotes: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleApprove} className="btn btn-primary">Send Quote</button>
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
