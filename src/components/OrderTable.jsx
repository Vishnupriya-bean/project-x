function OrderTable({ orders }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th>Carrier</th>
                        <th>Urgency</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.slice(0, 20).map((order, index) => (
                        <tr key={order.id ?? index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td>{index + 1}</td>
                            <td>{order.product_name}</td>
                            <td>{order.quantity}</td>
                            <td>{order.status}</td>
                            <td>{order.carrier}</td>
                            <td>{order.urgency}</td>
                            <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default OrderTable;
