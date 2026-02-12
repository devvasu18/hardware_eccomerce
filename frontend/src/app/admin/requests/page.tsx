'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
        models?: any[];
        variations?: any[];
    };
    requestedQuantity: number;
    customerContact: {
        name: string;
        mobile: string;
        address?: string;
    };
    status: string;
    createdAt: string;
    modelId?: string;
    variationId?: string;
    modelName?: string;
    variationText?: string;
    declaredBasePrice?: number;
}

interface CustomerGroup {
    key: string;
    name: string;
    mobile: string;
    totalRequests: number;
    lastRequestTime: string;
    requests: Request[];
    hasPending: boolean;
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<Request[]>([]);

    // View State
    const [viewCustomerKey, setViewCustomerKey] = useState<string | null>(null);

    // Child View Filters
    const [childFilter, setChildFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [childSort, setChildSort] = useState<'desc' | 'asc'>('desc');
    const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]); // For checkboxes

    // Quote/Response Form
    const [quoteModalOpen, setQuoteModalOpen] = useState(false);
    const [responseForm, setResponseForm] = useState({ priceQuote: '', estimatedDelivery: '', adminNotes: '' });
    const { modalState, hideModal, showSuccess, showError, showModal } = useModal();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/requests', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) setRequests(await res.json());
        } catch (error) {
            console.error("Failed to fetch requests", error);
        }
    };

    // Helper to resolve Spec Check
    const resolveSpec = (req: Request) => {
        if (req.modelName || req.variationText) {
            return `${req.modelName || ''} ${req.variationText ? `(${req.variationText})` : ''}`.trim();
        }
        let mName = '';
        let vText = '';
        if (req.modelId && req.product.models) {
            const m = req.product.models.find((m: any) => m._id === req.modelId);
            if (m) mName = m.name;
        }
        if (req.variationId) {
            if (req.modelId && req.product.models) {
                const m = req.product.models.find((m: any) => m._id === req.modelId);
                if (m && m.variations) {
                    const v = m.variations.find((v: any) => v._id === req.variationId);
                    if (v) vText = `${v.type}: ${v.value}`;
                }
            }
            if (!vText && req.product.variations) {
                const v = req.product.variations.find((v: any) => v._id === req.variationId);
                if (v) vText = `${v.type}: ${v.value}`;
            }
        }
        const result = `${mName} ${vText ? `(${vText})` : ''}`.trim();
        return result || null;
    };

    // Grouping Logic
    const groupedCustomers = useMemo(() => {
        const groups: Record<string, CustomerGroup> = {};
        requests.forEach(req => {
            const rawMobile = req.customerContact?.mobile;
            const mobile = rawMobile ? String(rawMobile).trim() : '';

            const rawName = req.customerContact?.name;
            const name = rawName ? String(rawName).trim() : 'Unknown Customer';

            let key = mobile;
            if (!key) {
                if (name !== 'Unknown Customer') {
                    key = `NAME_${name.toLowerCase()}`;
                } else {
                    key = `ID_${req._id}`;
                }
            }

            if (!groups[key]) {
                groups[key] = {
                    key,
                    name,
                    mobile,
                    totalRequests: 0,
                    lastRequestTime: req.createdAt,
                    requests: [],
                    hasPending: false
                };
            }
            groups[key].requests.push(req);
            groups[key].totalRequests++;

            if (req.status === 'Pending') groups[key].hasPending = true;

            if (new Date(req.createdAt) > new Date(groups[key].lastRequestTime)) {
                groups[key].lastRequestTime = req.createdAt;
            }
        });
        return Object.values(groups).sort((a, b) => new Date(b.lastRequestTime).getTime() - new Date(a.lastRequestTime).getTime());
    }, [requests]);

    // Active Customer Data
    const activeCustomer = useMemo(() => {
        if (!viewCustomerKey) return null;
        return groupedCustomers.find(g => g.key === viewCustomerKey) || null;
    }, [viewCustomerKey, groupedCustomers]);

    // Active Customer's Filtered Requests
    const activeCustomerRequests = useMemo(() => {
        if (!activeCustomer) return [];
        let filtered = [...activeCustomer.requests];

        // Filter
        if (childFilter !== 'All') {
            filtered = filtered.filter(r => r.status === childFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return childSort === 'asc' ? timeA - timeB : timeB - timeA;
        });

        return filtered;
    }, [activeCustomer, childFilter, childSort]);

    // Reset selection when changing filters or closing modal
    useEffect(() => {
        setSelectedRequestIds([]);
    }, [viewCustomerKey, childFilter]);

    // Actions
    const handleQuoteClick = () => {
        // Can be triggered for single or bulk
        // If bulk, we use the first selected item's price as base or just empty
        // We need to set initial form state
        // If single selection:
        if (selectedRequestIds.length === 1) {
            const req = activeCustomer?.requests.find(r => r._id === selectedRequestIds[0]);
            if (req) {
                const defaultPrice = req.declaredBasePrice || req.product.selling_price_a || req.product.mrp || req.product.basePrice || 0;
                setResponseForm({
                    priceQuote: defaultPrice.toString(),
                    estimatedDelivery: '',
                    adminNotes: ''
                });
            }
        } else {
            setResponseForm({
                priceQuote: '',
                estimatedDelivery: '',
                adminNotes: ''
            });
        }
        setQuoteModalOpen(true);
    };

    const totalSelectedSum = useMemo(() => {
        if (!activeCustomer || selectedRequestIds.length === 0) return 0;
        return selectedRequestIds.reduce((acc, id) => {
            const req = activeCustomer.requests.find(r => r._id === id);
            if (!req) return acc;
            const price = req.declaredBasePrice || req.product.selling_price_a || req.product.mrp || req.product.basePrice || 0;
            return acc + (price * req.requestedQuantity);
        }, 0);
    }, [selectedRequestIds, activeCustomer]);

    const submitQuote = async () => {
        const token = localStorage.getItem('token');
        try {
            const promises = selectedRequestIds.map(id => {
                const req = activeCustomer?.requests.find(r => r._id === id);
                let priceToUse = parseFloat(responseForm.priceQuote);

                // If bulk approval, use each item's individual price
                if (selectedRequestIds.length > 1 && req) {
                    priceToUse = req.declaredBasePrice || req.product.selling_price_a || req.product.mrp || req.product.basePrice || 0;
                }

                return fetch(`http://localhost:5000/api/requests/${id}/respond`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: 'Approved',
                        priceQuote: priceToUse,
                        estimatedDelivery: responseForm.estimatedDelivery,
                        adminNotes: responseForm.adminNotes
                    })
                });
            });

            await Promise.all(promises);
            showSuccess(`Successfully approved ${selectedRequestIds.length} request(s).`);
            setQuoteModalOpen(false);
            setSelectedRequestIds([]);
            fetchRequests();
        } catch (e) {
            showError('Failed to send quotes. Please try again.');
        }
    };

    const handleReject = async (id?: string) => {
        // If id provided, reject one. If not, reject selected.
        const targets = id ? [id] : selectedRequestIds;
        if (targets.length === 0) return;

        showModal(
            'Reject Request(s)',
            `Are you sure you want to reject ${targets.length} request(s)?`,
            'warning',
            {
                showCancel: true,
                confirmText: 'Reject',
                onConfirm: async () => {
                    const token = localStorage.getItem('token');
                    try {
                        const promises = targets.map(tid => {
                            return fetch(`http://localhost:5000/api/requests/${tid}/respond`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ status: 'Rejected' })
                            });
                        });
                        await Promise.all(promises);
                        showSuccess('Requests rejected.');
                        setSelectedRequestIds([]);
                        fetchRequests();
                    } catch (e) {
                        showError('Failed to reject.');
                    }
                }
            }
        );
    };

    const toggleSelection = (id: string) => {
        setSelectedRequestIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    const selectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all PENDING visible
            const pendingIds = activeCustomerRequests.filter(r => r.status === 'Pending').map(r => r._id);
            setSelectedRequestIds(pendingIds);
        } else {
            setSelectedRequestIds([]);
        }
    };

    const openProductPage = (req: Request) => {
        const url = `/products/${req.product._id}?model=${req.modelId || ''}&variant=${req.variationId || ''}`;
        window.open(url, '_blank');
    };

    return (
        <div>
            <h3 style={{ marginBottom: '2rem' }}>Procurement Requests</h3>

            {/* Parent Table View */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#64748B' }}>Customer Name</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#64748B' }}>Mobile</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#64748B' }}>Total Requests</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#64748B' }}>Last Activity</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#64748B' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#64748B', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedCustomers.map(group => (
                            <tr key={group.key} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} className="hover:bg-slate-50">
                                <td style={{ padding: '1rem' }}><strong>{group.name}</strong></td>
                                <td style={{ padding: '1rem' }}>{group.mobile}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        background: '#e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600
                                    }}>
                                        {group.totalRequests}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#64748B' }}>{new Date(group.lastRequestTime).toLocaleString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    {group.hasPending ? (
                                        <span style={{ color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }}></span>
                                            Pending Actions
                                        </span>
                                    ) : (
                                        <span style={{ color: '#10b981', fontWeight: 600 }}>All Processed</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => setViewCustomerKey(group.key)}
                                        className="btn btn-primary"
                                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                    >
                                        View All Requests
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {groupedCustomers.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Child Modal View */}
            {activeCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '220px' }}>
                    <div style={{ background: 'white', width: '95%', maxWidth: '1400px', height: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', position: 'relative' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{activeCustomer.name}</h2>
                                <p style={{ margin: '0.25rem 0 0 0', color: '#64748B' }}>{activeCustomer.mobile}</p>
                            </div>
                            <button onClick={() => setViewCustomerKey(null)} style={{ position: 'absolute', right: '1.5rem', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#64748B' }}>×</button>
                        </div>

                        {/* Controls Toolbar */}
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['All', 'Pending', 'Approved'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setChildFilter(status as any)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            border: childFilter === status ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                                            background: childFilter === status ? 'var(--primary)' : 'white',
                                            color: childFilter === status ? 'white' : '#64748B',
                                            cursor: 'pointer',
                                            fontWeight: 500
                                        }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span>Sort by Date:</span>
                                <select
                                    value={childSort}
                                    onChange={(e) => setChildSort(e.target.value as any)}
                                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        {/* Bulk Actions Bar */}
                        {selectedRequestIds.length > 0 && (
                            <div style={{ background: '#eff6ff', padding: '0.75rem 1.5rem', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#1e40af', fontWeight: 600 }}>{selectedRequestIds.length} items selected</span>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={handleQuoteClick} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Approve Selected</button>
                                    <button onClick={() => handleReject()} className="btn" style={{ padding: '0.5rem 1rem', background: '#ffe4e6', color: '#be123c', border: '1px solid #fda4af' }}>Reject Selected</button>
                                </div>
                            </div>
                        )}

                        {/* Scrolling List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f1f5f9' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                                <input
                                    type="checkbox"
                                    id="selectAll"
                                    onChange={selectAll}
                                    checked={activeCustomerRequests.length > 0 && activeCustomerRequests.filter(r => r.status === 'Pending').every(r => selectedRequestIds.includes(r._id))}
                                    disabled={activeCustomerRequests.filter(r => r.status === 'Pending').length === 0}
                                />
                                <label htmlFor="selectAll" style={{ fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>Select All Pending</label>
                            </div>

                            <div className="grid">
                                {activeCustomerRequests.map(req => {
                                    const specText = resolveSpec(req);
                                    const isPending = req.status === 'Pending';
                                    return (
                                        <div key={req._id} className="card" style={{
                                            borderLeft: isPending ? '4px solid #f59e0b' :
                                                (req.status === 'Rejected' || req.status === 'Cancelled' ? '4px solid #ef4444' : '4px solid #10b981'),
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            paddingTop: '2.5rem' // Added padding for the absolute eye button if needed, but centering helps
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: isPending ? '#b45309' : (req.status === 'Approved' ? '#065f46' : '#991b1b'),
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    {req.status}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {isPending && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRequestIds.includes(req._id)}
                                                            onChange={() => toggleSelection(req._id)}
                                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                        />
                                                    )}
                                                    <span className="badge" style={{ background: '#f1f5f9' }}>{new Date(req.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>

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

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
                                                <img
                                                    src={req.product.featured_image}
                                                    alt={req.product.title}
                                                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                />
                                                <div>
                                                    <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{req.product.title}</h3>
                                                    {specText && <p style={{ margin: '0.25rem 0 0 0', color: '#F37021', fontWeight: 600, fontSize: '1.1rem' }}>{specText}</p>}
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '1rem', color: '#64748B', fontSize: '0.95rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                    <div>Req Qty: <strong>{req.requestedQuantity}</strong></div>
                                                    <div>Base: <strong>₹{typeof req.declaredBasePrice === 'number' ? req.declaredBasePrice : (req.product.selling_price_a || req.product.mrp || req.product.basePrice)}</strong></div>
                                                </div>
                                                {req.customerContact?.address && (
                                                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', fontSize: '0.85rem' }}>
                                                        <strong style={{ color: '#334155' }}>Address:</strong> {req.customerContact.address}
                                                    </div>
                                                )}
                                            </div>

                                            {isPending && !selectedRequestIds.includes(req._id) && selectedRequestIds.length === 0 && (
                                                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequestIds([req._id]);
                                                            const defaultPrice = req.declaredBasePrice || req.product.selling_price_a || req.product.mrp || req.product.basePrice || 0;
                                                            setResponseForm({
                                                                priceQuote: defaultPrice.toString(),
                                                                estimatedDelivery: '',
                                                                adminNotes: ''
                                                            });
                                                            setQuoteModalOpen(true);
                                                        }}
                                                        className="btn btn-primary"
                                                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                                    >
                                                        Approve
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
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quote Modal */}
            {quoteModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <h3>{selectedRequestIds.length > 1 ? `Approve ${selectedRequestIds.length} Requests` : 'Approve Request'}</h3>
                        <p style={{ marginBottom: '1rem', color: '#64748B' }}>
                            {selectedRequestIds.length > 1 ? 'Individual item prices will be used. Total selected value shown below.' : 'Enter quote details for this customer.'}
                        </p>

                        {selectedRequestIds.length === 1 ? (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Quoted Price (Per Unit)</label>
                                <input
                                    type="number"
                                    placeholder="Enter Price"
                                    value={responseForm.priceQuote}
                                    onChange={(e) => setResponseForm({ ...responseForm, priceQuote: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                                <small style={{ color: '#64748B' }}>
                                    Original Base Price: ₹{activeCustomer?.requests.find(r => r._id === selectedRequestIds[0])?.declaredBasePrice || activeCustomer?.requests.find(r => r._id === selectedRequestIds[0])?.product.selling_price_a || 'N/A'}
                                </small>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.25rem' }}>Total Selected Value (Sum):</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>₹{totalSelectedSum.toLocaleString()}</div>
                            </div>
                        )}

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
                            <button onClick={() => setQuoteModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={submitQuote} className="btn btn-primary">Send Quote</button>
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
