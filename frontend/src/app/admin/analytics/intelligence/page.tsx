"use client";

import { useEffect, useState } from "react";
import api from "../../../utils/api";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { FiTrendingUp, FiPackage, FiShoppingBag, FiUsers, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsIntelligence() {
    const [revenueData, setRevenueData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [inventoryHealth, setInventoryHealth] = useState<any>(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30days');

    useEffect(() => {
        fetchAnalytics();
    }, [range]);

    const fetchAnalytics = async () => {
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
            setInventoryHealth(invRes.data);
            setActivity(actRes.data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !revenueData.length) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Analyzing Business Patterns...</div>;
    }

    const totalRevenue = revenueData.reduce((sum: number, item: any) => sum + item.totalSales, 0);
    const totalOrders = revenueData.reduce((sum: number, item: any) => sum + item.count, 0);

    const pieData = inventoryHealth ? [
        { name: 'Healthy', value: inventoryHealth.healthyStock },
        { name: 'Low Stock', value: inventoryHealth.lowStock },
        { name: 'Out of Stock', value: inventoryHealth.outOfStock }
    ] : [];

    return (
        <div className="container" style={{ maxWidth: '100%', padding: '2rem' }}>
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>Strategic Intelligence</h1>

                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
                    {['7days', '30days', '1year'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '6px',
                                background: range === r ? 'white' : 'transparent',
                                color: range === r ? '#0f172a' : '#64748b',
                                fontWeight: range === r ? 600 : 500,
                                cursor: 'pointer',
                                boxShadow: range === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {r === '7days' ? '1W' : r === '30days' ? '1M' : '1Y'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ background: '#ecfdf5', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
                            <FiTrendingUp size={24} />
                        </div>
                        <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <FiArrowUpRight /> 12%
                        </span>
                    </div>
                    <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, margin: 0 }}>Total Revenue</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0.5rem 0' }}>₹{totalRevenue.toLocaleString()}</p>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}>
                            <FiShoppingBag size={24} />
                        </div>
                        <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <FiArrowUpRight /> 8%
                        </span>
                    </div>
                    <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, margin: 0 }}>Total Orders</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0.5rem 0' }}>{totalOrders}</p>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ background: '#fff7ed', color: '#f59e0b', padding: '0.75rem', borderRadius: '12px' }}>
                            <FiPackage size={24} />
                        </div>
                        {inventoryHealth?.outOfStock > 0 && (
                            <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                {inventoryHealth.outOfStock} Alerts
                            </span>
                        )}
                    </div>
                    <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, margin: 0 }}>Inventory Health</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0.5rem 0' }}>{inventoryHealth?.total || 0}</p>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '0.75rem', borderRadius: '12px' }}>
                            <FiUsers size={24} />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, margin: 0 }}>Active Users</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0.5rem 0' }}>142</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Revenue Trend */}
                <div style={{ gridColumn: 'span 8', background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Sales & Order Trends</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" />
                                <Bar dataKey="totalSales" name="Revenue (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="count" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Health Pie */}
                <div style={{ gridColumn: 'span 4', background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Inventory Status</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Out of Stock</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>{inventoryHealth?.outOfStock}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Low Stock Alerts</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>{inventoryHealth?.lowStock}</span>
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div style={{ gridColumn: 'span 6', background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Top Selling Products</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fill: '#0f172a', fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="totalSold" name="Qty Sold" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div style={{ gridColumn: 'span 6', background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Recent Operations</h3>
                    <div className="activity-list" style={{ overflowY: 'auto', maxHeight: '300px' }}>
                        {activity.map((item: any, idx) => (
                            <div key={idx} style={{ padding: '0.75rem', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: item.type === 'ORDER' ? '#10b981' : '#3b82f6',
                                    marginTop: '6px'
                                }}></div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>{item.message}</p>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.user}</span>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    fontWeight: 600
                                }}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
