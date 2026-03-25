const CarrierLogs = ({ orders }) => {
    // Generate logs from orders
    const logs = orders.map((order, idx) => {
        const time = new Date(order.created_at).toLocaleTimeString();
        return `[${time}] ${order.carrier}: Order #${order.id?.slice(0, 8) ?? 'unknown'} - ${order.status} for ${order.product_name}`;
    });

    return (
        <div style={{ background: '#1a1a1a', color: '#d1d5db', padding: '20px', borderRadius: '10px', height: '300px', overflowY: 'auto', fontFamily: 'monospace' }}>
            <h3>Carrier Activity Logs</h3>
            {logs.length === 0 ? (
                <p>No activity yet.</p>
            ) : (
                logs.map((log, idx) => (
                    <p key={idx} style={{ margin: '5px 0', fontSize: '14px' }}>
                        {log}
                    </p>
                ))
            )}
        </div>
    );
};

export default CarrierLogs;