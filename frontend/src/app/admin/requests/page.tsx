'use client';

import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

interface Request {
    _id: string;
    product: {
        name: string;
        basePrice: number;
        stock: number;
    };
    requestedQuantity: number;
    customerContact: {
        name: string;
        mobile: string;
    };
    status: string;
    createdAt: string;
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
        const res = await fetch('http://localhost:5000/api/requests');
        if (res.ok) setRequests(await res.json());
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        try {
            const res = await fetch(`http://localhost:5000/api/requests/${selectedRequest._id}/respond`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
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
                            headers: { 'Content-Type': 'application/json' },
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

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Procurement Requests</h1>

            <div className="grid">
                {requests.map(req => (
                    <div key={req._id} className="card" style={{ borderLeft: req.status === 'Pending' ? '4px solid #f59e0b' : '4px solid #10b981' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="badge" style={{ background: '#f1f5f9' }}>{req.createdAt.split('T')[0]}</span>
                            <span style={{
                                fontWeight: 600,
                                color: req.status === 'Pending' ? '#b45309' : (req.status === 'Approved' ? '#065f46' : '#991b1b')
                            }}>
                                {req.status}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{req.product.name}</h3>
                        <p style={{ color: '#64748B', marginBottom: '1rem' }}>Qty Requested: <strong>{req.requestedQuantity}</strong> (Stock: {req.product.stock})</p>

                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            <strong>Customer:</strong> {req.customerContact.name}<br />
                            <strong>Mobile:</strong> {req.customerContact.mobile}
                        </div>

                        {req.status === 'Pending' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => { setSelectedRequest(req); setResponseForm({ priceQuote: '', estimatedDelivery: '', adminNotes: '' }); }}
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
                        <h3>Draft Quote for {selectedRequest.product.name}</h3>
                        <p style={{ marginBottom: '1rem', color: '#64748B' }}>Customer asking for {selectedRequest.requestedQuantity} units.</p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Quoted Price (Per Unit)</label>
                            <input
                                type="number"
                                placeholder={`Base Price is ₹${selectedRequest.product.basePrice}`}
                                value={responseForm.priceQuote}
                                onChange={(e) => setResponseForm({ ...responseForm, priceQuote: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
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
