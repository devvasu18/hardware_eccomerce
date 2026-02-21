'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiSend, FiEye, FiSmartphone, FiSettings, FiPlay } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [confirmSendId, setConfirmSendId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        ctaText: 'View Deal',
        targetScreen: 'PRODUCT',
        targetId: '',
        targetAudience: 'ALL',
        segment: 'NEW_USER',
        sound: 'default'
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounced search logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 2) {
                searchProducts(searchTerm);
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const searchProducts = async (term: string) => {
        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?keyword=${encodeURIComponent(term)}&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setSearchResults(data);
            } else if (data && data.products) {
                setSearchResults(data.products);
            }
        } catch (error) {
            console.error('Failed to search products', error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchCampaigns();
        }
    }, []);

    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/campaigns`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setCampaigns(data.data);
            }
        } catch (error) {
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Campaign created successfully');
                setShowModal(false);
                setFormData({
                    title: '', description: '', imageUrl: '', ctaText: 'View Deal',
                    targetScreen: 'PRODUCT', targetId: '', targetAudience: 'ALL', segment: 'NEW_USER', sound: 'default'
                });
                fetchCampaigns();
            } else {
                toast.error(data.message || 'Failed to create campaign');
            }
        } catch (error) {
            toast.error('Something went wrong');
        }
    };

    const handleSend = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/campaigns/${id}/send`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchCampaigns();
                setConfirmSendId(null);
            } else {
                toast.error(data.message || 'Failed to send campaign');
            }
        } catch (error) {
            toast.error('Something went wrong');
        }
    };

    const playSoundPreview = (soundUrl: string) => {
        if (!soundUrl || soundUrl === 'default') {
            toast('Default device sound will play', { icon: '🔔' });
            return;
        }
        try {
            const audio = new Audio(soundUrl);
            audio.play().catch(e => {
                console.error('Audio preview failed:', e);
                toast.error('Failed to play preview');
            });
        } catch (err) {
            console.error('Audio creation failed:', err);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        fontSize: '1rem',
        background: '#fff',
        color: '#1e293b'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.9rem',
        fontWeight: 600,
        marginBottom: '0.5rem',
        color: '#475569'
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>
                        Push Campaigns
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '0.95rem', margin: 0 }}>
                        Manage and send targeted push notifications
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FiPlus /> Create Campaign
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                    Loading campaigns...
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Campaign</th>
                                <th>Audience</th>
                                <th>Status</th>
                                <th>Stats</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map(camp => (
                                <tr key={camp._id}>
                                    <td>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            {camp.imageUrl ? (
                                                <img src={camp.imageUrl} alt="banner" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                                    <FiSmartphone size={24} />
                                                </div>
                                            )}
                                            <div>
                                                <p style={{ fontWeight: 600, color: '#1e293b', margin: '0 0 0.25rem 0' }}>{camp.title}</p>
                                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{camp.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                                            {camp.targetAudience === 'ALL' ? 'All Users' :
                                                camp.targetAudience === 'LOGGED_IN' ? 'Logged In Users' :
                                                    `Segment: ${camp.segment}`}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${camp.status === 'SENT' ? 'badge-success' :
                                            camp.status === 'SCHEDULED' ? 'badge-warning' :
                                                ''
                                            }`} style={{ background: camp.status === 'DRAFT' ? '#f1f5f9' : undefined, color: camp.status === 'DRAFT' ? '#475569' : undefined }}>
                                            {camp.status}
                                        </span>
                                        {camp.sentAt && <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>{new Date(camp.sentAt).toLocaleDateString()}</p>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '1rem', color: '#475569', fontSize: '0.9rem' }}>
                                            <span title="Delivered" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <FiSend /> {camp.stats?.delivered || 0}
                                            </span>
                                            <span title="Opened" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <FiEye /> {camp.stats?.opened || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        {camp.status === 'DRAFT' && (
                                            <button
                                                onClick={() => setConfirmSendId(camp._id)}
                                                style={{ border: 'none', background: 'none', color: '#F37021', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                <FiSend /> Send Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {campaigns.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        No campaigns found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '900px', borderRadius: '16px', display: 'flex', overflow: 'hidden', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>

                        {/* Form Section */}
                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#1e293b' }}>Create Campaign</h2>
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Push Title *</label>
                                    <input
                                        type="text" required
                                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        style={inputStyle}
                                        placeholder="e.g. Flash Sale Live Now!"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Message Body *</label>
                                    <textarea
                                        required rows={3}
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                        placeholder="Grab flat 50% off on all items..."
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Banner/Image URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        style={inputStyle}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Notification Sound</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select
                                            value={formData.sound}
                                            onChange={(e) => setFormData({ ...formData, sound: e.target.value })}
                                            style={{ ...inputStyle, flex: 1 }}
                                        >
                                            <option value="default">Default</option>
                                            <option value="/sounds/payment_success_chime.mp3">Modern Payment Chime</option>
                                            <option value="/sounds/order_alert.mp3">Cash Register (Cha-Ching)</option>
                                            <option value="/sounds/payment_success.mp3">Payment Success</option>
                                            <option value="/sounds/notification.mp3">Subtle Chime</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => playSoundPreview(formData.sound)}
                                            style={{
                                                padding: '0 1rem',
                                                backgroundColor: '#f1f5f9',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#475569',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            title="Play Sound Preview"
                                        >
                                            <FiPlay size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={labelStyle}>Link Target</label>
                                        <select
                                            value={formData.targetScreen} onChange={e => {
                                                setFormData({ ...formData, targetScreen: e.target.value, targetId: '' });
                                                setSearchTerm('');
                                                setSearchResults([]);
                                            }}
                                            style={inputStyle}
                                        >
                                            <option value="PRODUCT">Product Page</option>
                                            <option value="OFFER">Offer Page</option>
                                            <option value="DEAL">Deal Campaign</option>
                                        </select>
                                    </div>
                                    <div>
                                        {formData.targetScreen === 'PRODUCT' ? (
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Search & Link Product</label>
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    style={inputStyle}
                                                    placeholder="Type product name..."
                                                />
                                                {isSearching && <div style={{ position: 'absolute', right: '10px', top: '35px', fontSize: '0.8rem', color: '#94a3b8' }}>Searching...</div>}

                                                {searchResults.length > 0 && !formData.targetId && (
                                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '250px', overflowY: 'auto', zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
                                                        {searchResults.map((product) => {
                                                            const displayTitle = typeof product.title === 'object' ? (product.title?.en || product.title?.hi) : product.title;
                                                            return (
                                                                <div
                                                                    key={product._id}
                                                                    onClick={() => {
                                                                        const imgUrl = product.featured_image || product.images?.[0]?.url || formData.imageUrl;
                                                                        setFormData({
                                                                            ...formData,
                                                                            targetId: product._id,
                                                                            imageUrl: imgUrl,
                                                                            title: formData.title || `Special Offer on ${displayTitle}`
                                                                        });
                                                                        setSearchTerm(displayTitle);
                                                                        setSearchResults([]);
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                                                    style={{ padding: '0.85rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'center', transition: 'background-color 0.15s ease' }}
                                                                >
                                                                    {(product.featured_image || product.images?.[0]?.url) && <img src={product.featured_image || product.images?.[0]?.url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />}
                                                                    <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 500, lineHeight: 1.2 }}>{displayTitle}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {formData.targetId && formData.targetScreen === 'PRODUCT' && (
                                                    <small style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                                                        <span>✓ Linked: {formData.targetId.substring(0, 8)}...</span>
                                                        <span onClick={() => { setFormData({ ...formData, targetId: '' }); setSearchTerm(''); }} style={{ cursor: 'pointer', color: '#ef4444' }}>Clear</span>
                                                    </small>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <label style={labelStyle}>Reference ID</label>
                                                <input
                                                    type="text" required
                                                    value={formData.targetId} onChange={e => setFormData({ ...formData, targetId: e.target.value })}
                                                    style={inputStyle}
                                                    placeholder="e.g. prd_12345"
                                                />
                                                <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748B', fontSize: '0.8rem' }}>
                                                    Enter the exact Offer/Deal ID
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={labelStyle}>Target Audience</label>
                                        <select
                                            value={formData.targetAudience} onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                                            style={inputStyle}
                                        >
                                            <option value="ALL">All Users</option>
                                            <option value="LOGGED_IN">Logged In Only</option>
                                            <option value="SEGMENT">Specific Segment</option>
                                        </select>
                                    </div>
                                    {formData.targetAudience === 'SEGMENT' && (
                                        <div>
                                            <label style={labelStyle}>Segment</label>
                                            <select
                                                value={formData.segment} onChange={e => setFormData({ ...formData, segment: e.target.value })}
                                                style={inputStyle}
                                            >
                                                <option value="NEW_USER">New Users (Last 30 Days)</option>
                                                <option value="RETURNING_USER">Returning Users</option>
                                                <option value="PREVIOUS_BUYERS">Previous Buyers</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Save Campaign</button>
                                </div>
                            </form>
                        </div>

                        {/* Preview Section */}
                        <div style={{ width: '360px', background: '#f8fafc', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Preview</div>

                            <div style={{ width: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
                                {/* Mock Android Header */}
                                <div style={{ background: '#1e293b', padding: '0.25rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#f1f5f9' }}>
                                    <span>12:00</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <span>LTE</span>
                                        <span>100%</span>
                                    </div>
                                </div>

                                {/* Notification Mock */}
                                <div style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div style={{ width: '20px', height: '20px', background: '#F37021', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>H</div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hardware App &bull; Now</span>
                                    </div>
                                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b', margin: '0 0 0.25rem 0', lineHeight: 1.2 }}>{formData.title || 'Notification Title'}</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{formData.description || 'Notification message will appear here. Try adding some text.'}</p>

                                    {formData.imageUrl && (
                                        <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', height: '120px', background: '#f1f5f9' }}>
                                            <img src={formData.imageUrl} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}

                                    {/* CTA Mock */}
                                    {formData.targetScreen && formData.targetId && (
                                        <div style={{ marginTop: '0.75rem', background: 'rgba(243, 112, 33, 0.1)', color: '#F37021', fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                                            {formData.ctaText} &rarr;
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
            {confirmSendId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 1.5rem auto' }}>
                            <FiSend size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>Are you sure you want to send this campaign now?</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                            This push notification will be instantly sent to user devices based on your targeted audience rules. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmSendId(null)}
                                style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', flex: 1 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmSendId) handleSend(confirmSendId);
                                }}
                                style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer', flex: 1, boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                            >
                                Yes, Send Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
