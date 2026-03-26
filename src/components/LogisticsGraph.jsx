import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useMemo } from 'react';

const LogisticsGraph = ({ orders = [] }) => {
    // Generate real-time data from orders grouped by status change timestamps
    const chartData = useMemo(() => {
        const hours = [];
        const now = new Date();

        // Create hourly buckets for last 8 hours
        for (let i = 7; i >= 0; i--) {
            const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
            const timeStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // Count orders created in this hour (regardless of current status)
            const ordered = orders.filter(o => {
                const oDate = new Date(o.created_at);
                return oDate.getHours() === hour.getHours() && oDate.getDate() === hour.getDate();
            }).length;

            // Count orders shipped in this hour
            const shipped = orders.filter(o => {
                if (!o.shipped_at) return false;
                const oDate = new Date(o.shipped_at);
                return oDate.getHours() === hour.getHours() && oDate.getDate() === hour.getDate();
            }).length;

            // Count orders delivered in this hour
            const delivered = orders.filter(o => {
                if (!o.delivered_at) return false;
                const oDate = new Date(o.delivered_at);
                return oDate.getHours() === hour.getHours() && oDate.getDate() === hour.getDate();
            }).length;

            hours.push({
                time: timeStr,
                ordered,
                shipped,
                delivered,
                total: ordered  // Total is just the orders created, not sum of all
            });
        }

        // Add current status snapshot
        hours.push({
            time: 'Now',
            ordered: orders.filter(o => o.status === 'Picked' || o.status === 'Pending').length,
            shipped: orders.filter(o => o.status === 'Shipped').length,
            delivered: orders.filter(o => o.status === 'Delivered').length,
            total: orders.length
        });

        return hours;
    }, [orders]);

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245,247,251,0.95))',
            padding: '20px',
            borderRadius: '15px',
            minHeight: '350px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            border: '1px solid rgba(30,58,138,0.1)'
        }}>
            <h3 style={{ color: '#1e3a8a', marginBottom: '15px', fontSize: '1.3rem', fontWeight: '600' }}>📊 Live Order Activity</h3>
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(30,58,138,0.95)',
                            border: '1px solid rgba(59,130,246,0.5)',
                            borderRadius: '8px',
                            color: 'white'
                        }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} />
                    <Line type="monotone" dataKey="ordered" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5 }} name="Ordered" />
                    <Line type="monotone" dataKey="shipped" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5 }} name="Shipped" />
                    <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5 }} name="Delivered" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LogisticsGraph;
