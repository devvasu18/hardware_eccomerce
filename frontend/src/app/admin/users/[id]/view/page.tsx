"use client";

import { useState, useEffect } from "react";
import api from "../../../../utils/api";
import Image from "next/image";
import { FiUser, FiShoppingBag, FiMapPin, FiHeart, FiStar, FiGrid } from "react-icons/fi";

// Components for tabs
const OrdersTab = ({ orders }: { orders: any[] }) => (
    <div>
        <h3 className="text-lg font-bold mb-4">Order History</h3>
        {orders.length === 0 ? <p className="text-gray-500">No orders found.</p> : (
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id}>
                                <td>{order._id}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="font-bold">₹{order.totalAmount}</td>
                                <td>
                                    <span className={`badge ${order.status === 'Delivered' ? 'badge-success' : 'badge-warning'}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const AddressTab = ({ addresses }: { addresses: any[] }) => (
    <div>
        <h3 className="text-lg font-bold mb-4">Saved Addresses</h3>
        {addresses.length === 0 ? <p className="text-gray-500">No addresses saved.</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr, idx) => (
                    <div key={idx} className="card p-4">
                        <div className="font-bold">{addr.street}</div>
                        <div>{addr.landmark}</div>
                        <div>{addr.city}, {addr.state} - {addr.pincode}</div>
                        {addr.isDefault && <span className="badge badge-success mt-2">Default</span>}
                    </div>
                ))}
            </div>
        )}
    </div>
);

// Main View Page
export default function UserProfileView({ params }: { params: Promise<{ id: string }> }) {
    const [data, setData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        params.then(p => {
            setUserId(p.id);
            fetchData(p.id);
        });
    }, [params]);

    const fetchData = async (id: string) => {
        try {
            const res = await api.get(`/users/${id}/related-data`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching user 360 view', error);
        }
    };

    if (!data) return <div className="p-10">Loading Profile...</div>;

    const { user, orders } = data;

    const TabButton = ({ id, label, icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '1rem',
                borderBottom: activeTab === id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === id ? 600 : 400,
                background: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            {/* Header Profile Card */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#F1F5F9', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    {user.image ? (
                        <Image src={`http://localhost:5000/${user.image}`} alt={user.username} fill style={{ objectFit: 'cover' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem', color: '#CBD5E1' }}>
                            <FiUser />
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
                    <div className="flex items-center gap-4 text-gray-500">
                        <span>{user.email}</span>
                        <span>•</span>
                        <span>{user.mobile}</span>
                        <span>•</span>
                        <span className="badge badge-success">{user.role}</span>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem', overflowX: 'auto' }}>
                <TabButton id="profile" label="Overview" icon={<FiUser />} />
                <TabButton id="orders" label={`Orders (${orders.length})`} icon={<FiShoppingBag />} />
                <TabButton id="addresses" label={`Addresses (${user.savedAddresses?.length || 0})`} icon={<FiMapPin />} />
                <TabButton id="wishlist" label="Wishlist" icon={<FiHeart />} />
            </div>

            {/* Tab Content */}
            <div className="fade-in">
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="card-header">Account Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Member Since</span>
                                    <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Total Spent</span>
                                    <span className="font-bold text-primary">₹{orders.reduce((acc: number, o: any) => acc + o.totalAmount, 0)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Customer Type</span>
                                    <span className="font-medium capitalize">{user.customerType || 'Regular'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && <OrdersTab orders={orders} />}
                {activeTab === 'addresses' && <AddressTab addresses={user.savedAddresses || []} />}

                {activeTab === 'wishlist' && (
                    <div className="p-10 text-center text-gray-500 bg-white rounded-lg border border-dashed">
                        Wishlist integration pending...
                    </div>
                )}
            </div>
        </div>
    );
}
