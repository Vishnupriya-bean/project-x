import { useEffect, useState, useMemo } from 'react';
import { CloudRain, MapPin } from 'lucide-react';

function Carousel({ orders = [] }) {
    const [weather, setWeather] = useState(null);

    // Fetch weather data for Hyderabad (not critical to core dashboard)
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=17.3850&longitude=78.4867&current_weather=true');
                const data = await response.json();
                setWeather(data.current_weather);
            } catch (error) {
                console.error('Weather fetch error:', error);
                setWeather(null);
            }
        };
        fetchWeather();
    }, []);

    const analytics = useMemo(() => {
        const now = new Date();
        const totalOrders = orders.length;

        const delayedOrders = orders
            .filter((order) => order.created_at)
            .map((order) => ({
                ...order,
                createdAt: new Date(order.created_at)
            }))
            .filter((order) => {
                const ageHours = (now - order.createdAt) / (1000 * 60 * 60);
                return order.status !== 'Delivered' && ageHours >= 3;
            })
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);

        const pickedCount = orders.filter((o) => o.status === 'Picked' || o.status === 'picked').length;
        const bottleneckPercent = totalOrders ? Math.round((pickedCount / totalOrders) * 100) : 0;

        const paidCount = orders.filter((o) => o.payment === 'Done' || o.payment === 'done').length;
        const remainingCount = totalOrders - paidCount;

        const carrierPerformance = orders.reduce((acc, order) => {
            const carrier = order.carrier || 'Unknown';
            if (!acc[carrier]) acc[carrier] = { delivered: 0, delayed: 0, total: 0 };

            acc[carrier].total += 1;
            if (order.status === 'Delivered' || order.status === 'delivered') {
                acc[carrier].delivered += 1;
            }

            if (order.created_at && order.status !== 'Delivered') {
                const createdAt = new Date(order.created_at);
                const ageHours = (now - createdAt) / (1000 * 60 * 60);
                if (ageHours >= 24) {
                    acc[carrier].delayed += 1;
                }
            }
            return acc;
        }, {});

        const areaLoad = orders.reduce((acc, order) => {
            const area = order.area || 'Unknown';
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});

        const topAreas = Object.entries(areaLoad)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([area, count]) => ({ area, count }));

        const deliveredOrders = orders.filter((o) => o.status === 'Delivered' || o.status === 'delivered');
        const avgDeliveryTime = deliveredOrders.length
            ? (deliveredOrders.reduce((sum, o) => {
                if (!o.created_at || !o.delivered_at) return sum;
                const createdAt = new Date(o.created_at);
                const deliveredAt = o.delivered_at ? new Date(o.delivered_at) : new Date(o.created_at);
                return sum + ((deliveredAt - createdAt) / (1000 * 60 * 60));
            }, 0) / deliveredOrders.length).toFixed(2)
            : 'N/A';

        return {
            totalOrders,
            delayedOrders,
            bottleneckPercent,
            pickedCount,
            paidCount,
            remainingCount,
            carrierPerformance,
            topAreas,
            avgDeliveryTime
        };
    }, [orders]);

    const card = (title, value, note, color = '#3b82f6', bgColor = '#f0f9ff') => (
        <div
            style={{
                padding: '16px',
                borderRadius: '12px',
                background: bgColor,
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                borderLeft: `4px solid ${color}`,
                minWidth: '220px',
                transition: 'all 0.3s ease-in-out',
                ':hover': {
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)'
                }
            }}
        >
            <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{title}</div>
            <div style={{ marginTop: '8px', fontSize: '28px', color: color, fontWeight: '700' }}>{value}</div>
            {note && <div style={{ marginTop: '6px', fontSize: '13px', color: '#6b7280' }}>{note}</div>}
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '16px' }}>
            {/* KPI Cards - Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                {card(
                    '⚠️ Delayed Orders',
                    `${analytics.delayedOrders.length}`,
                    'Orders stuck > 3h',
                    analytics.delayedOrders.length > 0 ? '#dc2626' : '#10b981',
                    analytics.delayedOrders.length > 0 ? 'rgba(220,38,38,0.08)' : 'rgba(16,185,129,0.08)'
                )}
                {card(
                    '📉 Bottleneck',
                    `${analytics.bottleneckPercent}%`,
                    `${analytics.pickedCount}/${analytics.totalOrders} in Picked`,
                    analytics.bottleneckPercent > 40 ? '#ef4444' : '#f59e0b',
                    analytics.bottleneckPercent > 40 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'
                )}
                {card('💰 Collected', `${analytics.paidCount}`, 'Confirmed payments', '#10b981', 'rgba(16,185,129,0.08)')}
                {card('💰 Pending', `${analytics.remainingCount}`, 'Unpaid orders', '#f59e0b', 'rgba(245,158,11,0.08)')}
            </div>

            {/* Performance Section - Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                {/* Carrier Performance */}
                <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    borderLeft: '4px solid #8b5cf6',
                    transition: 'all 0.3s ease-in-out'
                }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>🚚 Carrier Performance</h4>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
                        {Object.entries(analytics.carrierPerformance || {}).map(([carrier, stats]) => (
                            <div key={carrier} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#1f2937' }}>{carrier}</strong>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>{stats.delivered} ✅ {stats.delayed} ⚠️</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Area Load */}
                <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    borderLeft: '4px solid #06b6d4',
                    transition: 'all 0.3s ease-in-out'
                }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>📍 Top Delivery Areas</h4>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
                        {analytics.topAreas.map((item) => (
                            <div key={item.area} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#1f2937' }}>{item.area}</span>
                                <span style={{ fontSize: '12px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Average Delivery Time - Full Width */}
            <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                borderLeft: '4px solid #3b82f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease-in-out'
            }}>
                <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>⏱️ Average Delivery Time</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#4b5563' }}>Based on completed orders</p>
                </div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '28px', color: '#3b82f6' }}>
                    {analytics.avgDeliveryTime !== 'N/A' ? `${analytics.avgDeliveryTime}h` : 'N/A'}
                </p>
            </div>
        </div>
    );
}

export default Carousel;

