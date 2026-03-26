import { motion } from 'framer-motion';
import { useState } from 'react';

const GetPriorityColor = (urgency) => {
    if (urgency >= 5) return { bg: 'rgba(239,68,68,0.2)', color: '#fca5a5', label: '🔴 Critical' };
    if (urgency >= 4) return { bg: 'rgba(251,146,60,0.2)', color: '#fdba74', label: '🟠 High' };
    if (urgency >= 3) return { bg: 'rgba(252,191,73,0.2)', color: '#fce181', label: '🟡 Medium' };
    return { bg: 'rgba(34,197,94,0.2)', color: '#86efac', label: '🟢 Low' };
};

const GetStatusIcon = (status) => {
    switch (status) {
        case 'Picked': return '📦';
        case 'Shipped': return '🚚';
        case 'Delivered': return '✅';
        default: return '⏳';
    }
};

const CarrierLogs = ({ orders = [], onStatusUpdate }) => {
    const [expandedId, setExpandedId] = useState(null);

    // Create enhanced logs from orders
    const logs = orders.map((order) => {
        const time = new Date(order.created_at).toLocaleTimeString();
        const priority = GetPriorityColor(order.urgency);

        // Check if order has exceeded 7 days
        const now = new Date();
        const orderDate = new Date(order.created_at);
        const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);
        const isOver7Days = daysDiff > 7 && order.status !== 'Delivered';

        return {
            id: order.id,
            time,
            carrier: order.carrier,
            product: order.product_name,
            status: order.status,
            urgency: order.urgency,
            area: order.area,
            payment: order.payment,
            priority,
            createdAt: order.created_at,
            isOver7Days
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, rgba(26,26,26,0.95), rgba(40,40,40,0.95))',
                color: '#d1d5db',
                padding: '20px',
                borderRadius: '12px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                border: '1px solid rgba(59,130,246,0.2)'
            }}
        >
            <h3 style={{
                margin: '0 0 15px 0',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: '600',
                flexShrink: 0
            }}>📋 Carrier Activity Logs</h3>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '8px'
            }}>
                {logs.length === 0 ? (
                    <p style={{ color: 'rgba(209,213,219,0.6)', textAlign: 'center', paddingTop: '40px' }}>No activity yet.</p>
                ) : (
                    logs.map((log, idx) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            style={{
                                background: log.isOver7Days ? 'rgba(239, 68, 68, 0.15)' : log.priority.bg,
                                border: log.isOver7Days ? '2px solid #ff4d4d' : `1px solid ${log.priority.color}`,
                                borderLeft: log.isOver7Days ? '5px solid #ff4d4d' : `1px solid ${log.priority.color}`,
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                animation: log.isOver7Days ? 'pulse-red 2s infinite' : 'none',
                                boxShadow: log.isOver7Days ? '0 0 0px rgba(255, 77, 77, 0.4)' : 'none'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'translateX(5px)'}
                            onMouseLeave={(e) => e.target.style.transform = 'translateX(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: log.isOver7Days ? '#ff4d4d' : log.priority.color, fontWeight: 'bold' }}>
                                    {log.isOver7Days && '⚠️ '} [{log.time}] {log.isOver7Days ? '🚨 DELAYED' : log.priority.label}
                                </span>
                                <span style={{ fontSize: '18px' }}>{GetStatusIcon(log.status)}</span>
                            </div>

                            <div style={{ marginTop: '8px', color: '#fff', fontSize: '12px' }}>
                                <strong>{log.carrier}</strong>: {log.product} → <strong>{log.status}</strong>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === log.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        marginTop: '12px',
                                        paddingTop: '12px',
                                        borderTop: `1px solid ${log.priority.color}`,
                                        fontSize: '11px',
                                        color: 'rgba(255,255,255,0.9)'
                                    }}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                        <div>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>📍 Area:</span> {log.area}
                                        </div>
                                        <div>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>💳 Payment:</span> {log.payment}
                                        </div>
                                        <div>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>ID:</span> {log.id?.slice(0, 8)}
                                        </div>
                                        <div>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>⚡ Level:</span> {log.urgency}/5
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>⏱️ {log.status === 'Delivered' ? 'Delivery Time' : 'Time Elapsed'}:</span> {
                                                (() => {
                                                    const now = new Date();
                                                    const created = new Date(log.createdAt);
                                                    let diffMs;
                                                    if (log.status === 'Delivered') {
                                                        // For delivered orders, find delivered_at from the order
                                                        const order = orders.find(o => o.id === log.id);
                                                        if (order && order.delivered_at) {
                                                            const delivered = new Date(order.delivered_at);
                                                            diffMs = delivered - created;
                                                        } else {
                                                            diffMs = now - created;
                                                        }
                                                    } else {
                                                        diffMs = now - created;
                                                    }
                                                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                                    return `${diffHours}h ${diffMins}m`;
                                                })()
                                            }
                                        </div>
                                    </div>

                                    {/* Quick Status Update */}
                                    {log.status !== 'Delivered' && onStatusUpdate && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            {log.status === 'Pending' && (
                                                <button
                                                    onClick={() => onStatusUpdate(log.id, 'Picked')}
                                                    style={{
                                                        background: 'rgba(59,130,246,0.3)',
                                                        border: '1px solid #93c5fd',
                                                        color: '#93c5fd',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = 'rgba(59,130,246,0.5)'}
                                                    onMouseLeave={(e) => e.target.style.background = 'rgba(59,130,246,0.3)'}
                                                >
                                                    📦 Mark as Picked
                                                </button>
                                            )}
                                            {log.status === 'Picked' && (
                                                <button
                                                    onClick={() => onStatusUpdate(log.id, 'Shipped')}
                                                    style={{
                                                        background: 'rgba(251,146,60,0.3)',
                                                        border: '1px solid #fdba74',
                                                        color: '#fdba74',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = 'rgba(251,146,60,0.5)'}
                                                    onMouseLeave={(e) => e.target.style.background = 'rgba(251,146,60,0.3)'}
                                                >
                                                    🚚 Mark as Shipped
                                                </button>
                                            )}
                                            {log.status === 'Shipped' && (
                                                <button
                                                    onClick={() => onStatusUpdate(log.id, 'Delivered')}
                                                    style={{
                                                        background: 'rgba(34,197,94,0.3)',
                                                        border: '1px solid #86efac',
                                                        color: '#86efac',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = 'rgba(34,197,94,0.5)'}
                                                    onMouseLeave={(e) => e.target.style.background = 'rgba(34,197,94,0.3)'}
                                                >
                                                    ✅ Mark as Delivered
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            <style>{`
                @keyframes pulse-red {
                    0%, 100% { 
                        box-shadow: 0 0 0px rgba(255, 77, 77, 0.4);
                    }
                    50% { 
                        box-shadow: 0 0 15px rgba(255, 77, 77, 0.7);
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default CarrierLogs;