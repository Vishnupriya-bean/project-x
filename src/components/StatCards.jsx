const StatCard = ({ title, value, type }) => (
    <div className={`glass-card ${type}-glow`}>
        <h4 style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>{title}</h4>
        <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#1e3a8a' }}>{value}</h2>
    </div>
);

const StatCards = ({ orders }) => {
    const stats = [
        { title: "To be Picked", value: orders.filter(o => o.status === "Pending").length, type: "pending" },
        { title: "Shipped", value: orders.filter(o => o.status === "Shipped").length, type: "shipped" },
        { title: "Delivered", value: orders.filter(o => o.status === "Delivered").length, type: "delivered" },
        { title: "High Urgency", value: orders.filter(o => o.urgency === 5).length, type: "urgent" },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', margin: '20px 0' }}>
            {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>
    );
};

export default StatCards;
