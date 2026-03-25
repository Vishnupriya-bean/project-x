import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Carousel from './components/Carousel.jsx';
import StatCards from './components/StatCards.jsx';
import LogisticsGraph from './components/LogisticsGraph.jsx';
import Challenges from './components/Challenges.jsx';
import Footer from './components/Footer.jsx';
import AreaSummary from './components/AreaSummary.jsx';
import CarrierLogs from './components/CarrierLogs.jsx';
import Highlights from './components/Highlights.jsx';

function App() {
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8000/ws/orders');
        socket.onopen = () => setConnected(true);
        socket.onmessage = (event) => {
            const newOrder = JSON.parse(event.data);
            setOrders((prev) => [newOrder, ...prev]);
            setLogs((prev) => {
                const entry = `[${new Date().toLocaleTimeString()}] - ORDER #${newOrder.id?.slice(0, 8) ?? 'unknown'} - ${newOrder.status} by ${newOrder.carrier}`;
                return [entry, ...prev].slice(0, 50);
            });
        };
        return () => socket.close();
    }, []);

    const simulateOrder = async () => {
        const payloads = [
            { name: "Biryani Pack", carrier: "DHL", urgency: 5 },
            { name: "Tech Bundle", carrier: "UPS", urgency: 2 },
            { name: "Grocery Box", carrier: "DPD", urgency: 3 }
        ];
        const pick = payloads[Math.floor(Math.random() * payloads.length)];
        const areas = ["Gachibowli", "Kukatpally", "Banjara Hills", "Charminar"];
        const randomArea = areas[Math.floor(Math.random() * areas.length)];

        await fetch('http://localhost:8000/orders/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_name: pick.name,
                quantity: 1,
                status: "Pending",
                carrier: pick.carrier,
                urgency: pick.urgency,
                area: randomArea,
                created_at: new Date().toISOString()
            }),
        });
    };

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* 1. Top Navigation Bar */}
            <nav style={{ background: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h2 style={{ color: '#1e3a8a', margin: 0 }}>Smart Logistics <span style={{ fontSize: '14px', color: '#666' }}>Hyderabad</span></h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: connected ? '#2ecc71' : '#e74c3c' }}></div>
                        <span style={{ fontSize: '14px' }}>{connected ? 'Live' : 'Offline'}</span>
                    </div>
                    <button onClick={simulateOrder} style={{ background: '#1e3a8a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Simulate Order
                    </button>
                </div>
            </nav>

            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}
            >
                {/* 2. Full-Screen Animated Carousel */}
                <Carousel logs={logs} />
                {/* 3. Live Stat Cards */}
                <StatCards orders={orders} />
                {/* Highlights */}
                <Highlights />

                {/* 4. Data & Logs Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', margin: '20px 0' }}>
                    <LogisticsGraph orders={orders} />
                    <CarrierLogs orders={orders} />
                    <AreaSummary orders={orders} />
                </div>

                {/* 5. Business Challenges (4 Images) */}
                <Challenges />
            </motion.main>

            {/* 6. Professional Footer */}
            <Footer />
        </div>
    );
}

export default App;
