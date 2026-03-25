import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LogisticsGraph = ({ orders }) => {
    // Simple mock data for now - we can update this with real order counts later
    const data = [
        { time: '9 AM', orders: 12 },
        { time: '12 PM', orders: 25 },
        { time: '3 PM', orders: 18 },
        { time: '6 PM', orders: 35 },
        { time: '9 PM', orders: 10 },
    ];

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', minHeight: '300px' }}>
            <h3>Live Order Activity (Daily)</h3>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#3498db" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LogisticsGraph;
