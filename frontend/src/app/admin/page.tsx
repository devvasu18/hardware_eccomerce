'use client';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FiTrendingUp, FiBox, FiAlertCircle, FiActivity, FiDollarSign } from 'react-icons/fi';

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

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
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard Overview</h1>
                <div className="dashboard-controls">
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
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card kpi-green">
                    <div className="kpi-icon-wrapper">
                        <FiDollarSign />
                    </div>
                    <div className="kpi-content">
                        <p>Total Revenue ({range})</p>
                        <h3>₹{revenueData.reduce((acc: number, cur: any) => acc + cur.totalSales, 0).toLocaleString()}</h3>
                    </div>
                </div>

                <div className="kpi-card kpi-blue">
                    <div className="kpi-icon-wrapper">
                        <FiBox />
                    </div>
                    <div className="kpi-content">
                        <p>Total Products</p>
                        <h3>{inventory?.total || 0}</h3>
                    </div>
                </div>

                <div className="kpi-card kpi-orange">
                    <div className="kpi-icon-wrapper">
                        <FiAlertCircle />
                    </div>
                    <div className="kpi-content">
                        <p>Low Stock Items</p>
                        <h3>{inventory?.lowStock || 0}</h3>
                    </div>
                </div>

                <div className="kpi-card kpi-red">
                    <div className="kpi-icon-wrapper">
                        <FiTrendingUp />
                    </div>
                    <div className="kpi-content">
                        <p>Out of Stock</p>
                        <h3>{inventory?.outOfStock || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Main Grid: Revenue & Activity */}
            <div className="charts-grid">
                {/* Revenue Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Sales Overview</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="totalSales"
                                    stroke="#F37021"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#F37021', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, fill: '#F37021', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiActivity /> Recent Activity
                            </span>
                        </h3>
                    </div>
                    <div className="activity-list">
                        {activity.length > 0 ? (
                            activity.map((act: any) => (
                                <div key={act.id} className="activity-item">
                                    <div
                                        className="activity-dot"
                                        style={{ background: act.type === 'ORDER' ? '#10B981' : '#3B82F6' }}
                                    ></div>
                                    <div className="activity-content">
                                        <p>{act.message}</p>
                                        <div className="activity-meta">
                                            {new Date(act.date).toLocaleDateString()} • {act.user}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Secondary Grid: Top Products & Inventory */}
            <div className="charts-grid">
                {/* Top Products */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Top Selling Products</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 11, fill: '#64748B' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar
                                    dataKey="totalSold"
                                    fill="#3B82F6"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Health */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Inventory Health</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
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
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
