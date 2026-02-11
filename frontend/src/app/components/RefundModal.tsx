'use client';

import { useState } from 'react';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    itemName: string;
    maxQuantity: number;
    itemPrice: number;
    orderPaymentMethod: string;
    loading: boolean;
}

export default function RefundModal({
    isOpen,
    onClose,
    onSubmit,
    itemName,
    maxQuantity,
    itemPrice,
    orderPaymentMethod,
    loading
}: RefundModalProps) {
    const [reason, setReason] = useState('Defective or Damaged Product');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(maxQuantity);
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        ifscCode: '',
        accountName: '',
        bankName: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            reason,
            description,
            quantity,
            amount: quantity * itemPrice,
            bankDetails: orderPaymentMethod === 'COD' ? bankDetails : undefined
        });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '500px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Request Return</h2>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>For: <strong>{itemName}</strong></p>

                <form onSubmit={handleSubmit}>
                    {maxQuantity > 1 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Quantity to Return</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="range"
                                    min="1"
                                    max={maxQuantity}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontWeight: 700, minWidth: '3rem', textAlign: 'center', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                    {quantity} / {maxQuantity}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                Refund Amount: <strong>₹{(quantity * itemPrice).toLocaleString('en-IN')}</strong>
                            </p>
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Reason for Return</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                            <option>Defective or Damaged Product</option>
                            <option>Wrong Item Received</option>
                            <option>Product Description Mismatch</option>
                            <option>Changed Mind</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Additional Comments (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            placeholder="Please provide more details..."
                        />
                    </div>

                    {/* Conditional Bank Details for COD */}
                    {orderPaymentMethod === 'COD' && (
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Bank Details for Refund</h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>Since you paid via Cash on Delivery, please provide your bank account details to receive the refund.</p>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <input
                                    placeholder="Account Number"
                                    value={bankDetails.accountNumber}
                                    onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <input
                                    placeholder="IFSC Code"
                                    value={bankDetails.ifscCode}
                                    onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }}
                                />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <input
                                    placeholder="Account Holder Name"
                                    value={bankDetails.accountName}
                                    onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div>
                                <input
                                    placeholder="Bank Name"
                                    value={bankDetails.bankName}
                                    onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '0.75rem 1.5rem', border: 'none', background: '#e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem', border: 'none', background: '#3b82f6', color: 'white',
                                borderRadius: '6px', cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
