'use client';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FiTrendingUp, FiBox, FiAlertCircle, FiActivity, FiDollarSign } from 'react-icons/fi';

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Green, Orange, Red

export default function AdminDashboard() {
    const [revenueData, setRevenueData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [inventory, setInventory] = useState<any>(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7days'); // 7days, 30days

    useEffect(() => {
        const fetchAllStats = async () => {
            setLoading(true);
            try {
                const [revRes, topRes, invRes, actRes] = await Promise.all([
                    api.get(`/admin/analytics/revenue?range=${range}`),
                    api.get('/admin/analytics/top-products'),
                    api.get('/admin/analytics/inventory'),
                    api.get('/admin/analytics/activity')
                ]);

                setRevenueData(revRes.data);
                setTopProducts(topRes.data);
                setInventory(invRes.data);
                setActivity(actRes.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllStats();
    }, [range]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Pie Chart Data
    const inventoryData = inventory ? [
        { name: 'Healthy', value: inventory.healthyStock },
        { name: 'Low Stock', value: inventory.lowStock },
        { name: 'Out of Stock', value: inventory.outOfStock }
    ] : [];

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Admin Dashboard</h1>
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="form-select"
                    style={{ width: '150px' }}
                >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid desktop-grid-4" style={{ marginBottom: '2rem', gap: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', background: '#DEF7EC', color: '#03543F' }}>
                        <FiDollarSign size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Total Revenue ({range})</p>
                        <h3 style={{ margin: 0 }}>₹{revenueData.reduce((acc: number, cur: any) => acc + cur.totalSales, 0).toLocaleString()}</h3>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', background: '#E1EFFE', color: '#1E429F' }}>
                        <FiBox size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Total Products</p>
                        <h3 style={{ margin: 0 }}>{inventory?.total || 0}</h3>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', background: '#FEECDC', color: '#8A2C0D' }}>
                        <FiAlertCircle size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Low Stock Items</p>
                        <h3 style={{ margin: 0 }}>{inventory?.lowStock || 0}</h3>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', background: '#FDE8E8', color: '#9B1C1C' }}>
                        <FiTrendingUp size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Out of Stock</p>
                        <h3 style={{ margin: 0 }}>{inventory?.outOfStock || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Main Grid: Revenue & Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Revenue Chart */}
                <div className="card" style={{ minHeight: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Sales Overview</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: number) => [`₹${value}`, 'Sales']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="totalSales" stroke="#F37021" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="card" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiActivity /> Recent Activity
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activity.map((act: any) => (
                            <div key={act.id} style={{ display: 'flex', gap: '0.8rem', alignItems: 'start', paddingBottom: '0.8rem', borderBottom: '1px solid #f3f4f6' }}>
                                <div style={{
                                    minWidth: '8px', height: '8px', borderRadius: '50%', marginTop: '6px',
                                    background: act.type === 'ORDER' ? '#10B981' : '#3B82F6'
                                }}></div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>{act.message}</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                                        {new Date(act.date).toLocaleDateString()} • {act.user}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Secondary Grid: Top Products & Inventory */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Top Products */}
                <div className="card" style={{ minHeight: '350px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Top Selling Products</h3>
                    <div style={{ height: '250px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="totalSold" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Health */}
                <div className="card" style={{ minHeight: '350px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Inventory Health</h3>
                    <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {inventoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
