import { motion } from 'framer-motion';

const StatCard = ({ title, value, type, icon }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stat-card"
        style={{
            background: 'linear-gradient(135deg, rgba(30,58,138,0.95), rgba(59,130,246,0.95))',
            padding: '14px 12px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 8px 16px rgba(30,58,138,0.2)',
            border: '1px solid rgba(59,130,246,0.3)',
            textAlign: 'center',
            fontSize: '0.9rem',
            '@media (min-width: 768px)': {
                padding: '16px 14px',
                fontSize: '0.95rem'
            },
            '@media (min-width: 1024px)': {
                padding: '20px',
                fontSize: '1rem'
            }
        }}
    >
        <div style={{ fontSize: '1.8rem', marginBottom: '6px', '@media (min-width: 768px)': { fontSize: '2rem', marginBottom: '8px' } }}>{icon}</div>
        <h4 style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0', fontSize: '0.75rem', fontWeight: '500', '@media (min-width: 768px)': { fontSize: '0.9rem', margin: '5px 0' } }}>{title}</h4>
        <h2 style={{ fontSize: '1.8rem', margin: '8px 0', fontWeight: '900', color: type === 'avgtime' ? '#60a5fa' : 'white', '@media (min-width: 768px)': { fontSize: '2.2rem', margin: '10px 0' }, '@media (min-width: 1024px)': { fontSize: '2.5rem' } }}>{value}</h2>
    </motion.div>
);

const StatCards = ({ orders = [] }) => {
    const totalOrders = orders.length;
    const picked = orders.filter(o => o.status === "Picked").length;
    const shipped = orders.filter(o => o.status === "Shipped").length;
    const delivered = orders.filter(o => o.status === "Delivered").length;
    const highUrgency = orders.filter(o => o.urgency >= 5).length;
    const paymentPending = orders.filter(o => o.payment === 'Remaining').length;

    // Calculate 7-day overdue orders
    const now = new Date();
    const overdue = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);
        return daysDiff > 7 && o.status !== "Delivered";
    }).length;

    // Calculate average delivery time for delivered orders
    const deliveredOrders = orders.filter(o => o.status === "Delivered" && o.delivered_at);
    const avgDeliveryTime = deliveredOrders.length > 0
        ? Math.round(deliveredOrders.reduce((sum, o) => {
            const created = new Date(o.created_at);
            const delivered = new Date(o.delivered_at);
            return sum + (delivered - created) / (1000 * 60 * 60); // hours
        }, 0) / deliveredOrders.length)
        : 0;

    const stats = [
        { title: "Total Orders", value: totalOrders, type: "total", icon: "📦" },
        { title: "Picked", value: picked, type: "picked", icon: "✋" },
        { title: "Shipped", value: shipped, type: "shipped", icon: "🚚" },
        { title: "Delivered", value: delivered, type: "delivered", icon: "✅" },
        { title: "Avg Delivery Time", value: `${avgDeliveryTime}h`, type: "avgtime", icon: "⏱️" },
        { title: "Critical Urgency", value: highUrgency, type: "urgent", icon: "🚨" },
        { title: "7+ Days Overdue", value: overdue, type: "overdue", icon: "⏰" },
        { title: "Payment Pending", value: paymentPending, type: "payment", icon: "💳" }
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            margin: '20px 0',
            '@media (min-width: 768px)': {
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '15px',
                margin: '20px 0'
            },
            '@media (min-width: 1024px)': {
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
            }
        }}>
            {stats.map((s, i) => (
                <StatCard key={i} {...s} />
            ))}
        </div>
    );
};

export default StatCards;
