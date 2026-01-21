'use client';

export default function AdminDashboard() {
    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Overview</h1>
            <div className="grid">
                <div className="card">
                    <h3>Pending Orders</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#F37021' }}>5</p>
                </div>
                <div className="card">
                    <h3>On-Demand Requests</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>12</p>
                </div>
                <div className="card">
                    <h3>Tally Sync Failures</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>0</p>
                </div>
            </div>
        </div>
    );
}
