'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiXCircle } from 'react-icons/fi';

export default function PaymentFailurePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const status = searchParams.get('status');
    const txnid = searchParams.get('txnid');
    const amount = searchParams.get('amount');

    return (
        <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                <FiXCircle style={{ fontSize: '4rem', color: '#ef4444', margin: '0 auto 2rem' }} />
                <h1 style={{ marginBottom: '1rem', color: '#ef4444' }}>Payment Failed</h1>
                <p style={{ color: '#64748B', marginBottom: '2rem' }}>
                    Your payment could not be processed. Please try again or use a different payment method.
                </p>

                {status && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '2rem',
                        textAlign: 'left'
                    }}>
                        <p style={{ fontSize: '0.9rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                            <strong>Status:</strong> {status}
                        </p>
                        {txnid && (
                            <p style={{ fontSize: '0.9rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                                <strong>Transaction ID:</strong> {txnid}
                            </p>
                        )}
                        {amount && (
                            <p style={{ fontSize: '0.9rem', color: '#991b1b', marginBottom: 0 }}>
                                <strong>Amount:</strong> ₹{amount}
                            </p>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => router.push('/cart')}
                        className="btn btn-secondary"
                    >
                        Back to Cart
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="btn btn-primary"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
