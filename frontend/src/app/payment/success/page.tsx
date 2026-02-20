'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiLoader } from 'react-icons/fi';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            // Get all PayU response parameters
            const isBypass = searchParams.get('bypass') === 'true';
            const payuData = {
                mihpayid: searchParams.get('mihpayid') || (isBypass ? 'BYPASS_ID' : null),
                status: searchParams.get('status') || (isBypass ? 'success' : 'failed'),
                txnid: searchParams.get('txnid'),
                amount: searchParams.get('amount'),
                productinfo: searchParams.get('productinfo'),
                firstname: searchParams.get('firstname'),
                email: searchParams.get('email'),
                hash: searchParams.get('hash'),
                udf1: searchParams.get('udf1'), // Our orderId
                bypass: isBypass
            };

            try {
                const response = await fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payuData)
                });

                const data = await response.json();

                if (data.success) {
                    setVerified(true);
                    setOrderId(data.orderId);

                    // Redirect to order page after 3 seconds
                    setTimeout(() => {
                        if (data.orderId) {
                            router.push(`/orders/${data.orderId}`);
                        } else {
                            router.push('/');
                        }
                    }, 3000);
                } else if (payuData.status === 'pending') {
                    // Bypass Testing specifically for 'pending' simulation
                    setVerified(false);
                    setVerifying(false);
                    // Redirect to order page anyway so user can see their pending order
                    setTimeout(() => {
                        if (payuData.udf1) {
                            router.push(`/orders/${payuData.udf1}`);
                        } else {
                            router.push('/');
                        }
                    }, 3000);
                } else {
                    setVerified(false);
                    setVerifying(false);
                }
            } catch (error) {
                console.error('Verification error:', error);
                setVerified(false);
                setVerifying(false);
            }
        };

        verifyPayment();
    }, [searchParams, router]);

    return (
        <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                {verifying ? (
                    <>
                        <FiLoader style={{ fontSize: '4rem', color: '#F37021', margin: '0 auto 2rem', animation: 'spin 1s linear infinite' }} />
                        <h1 style={{ marginBottom: '1rem' }}>Verifying Payment...</h1>
                        <p style={{ color: '#64748B' }}>Please wait while we confirm your payment.</p>
                    </>
                ) : verified ? (
                    <>
                        <FiCheckCircle style={{ fontSize: '4rem', color: '#10b981', margin: '0 auto 2rem' }} />
                        <h1 style={{ marginBottom: '1rem', color: '#10b981' }}>Payment Successful!</h1>
                        <p style={{ color: '#64748B', marginBottom: '2rem' }}>
                            Your payment has been confirmed. Redirecting to your order...
                        </p>
                        {orderId && (
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                Order ID: {orderId}
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '4rem', color: '#ef4444', margin: '0 auto 2rem' }}>⚠️</div>
                        <h1 style={{ marginBottom: '1rem', color: '#ef4444' }}>Verification Failed</h1>
                        <p style={{ color: '#64748B', marginBottom: '2rem' }}>
                            We couldn't verify your payment. Please contact support.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="btn btn-primary"
                        >
                            Go to Home
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
