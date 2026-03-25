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
import Login from './components/Login.jsx';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token) return;
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
    }, [token]);

    if (!token) {
        return <Login setToken={(newToken) => { localStorage.setItem('token', newToken); setToken(newToken); }} />;
    }

    const simulateOrder = async () => {
        console.log("Button Clicked: Preparing payload...");

        const areas = ["Gachibowli", "Kukatpally", "Banjara Hills", "Charminar"];
        const fakeOrder = {
            product_name: "Hyderabad Biryani Kit",
            quantity: Math.floor(Math.random() * 5) + 1,
            status: "Pending",
            carrier: "DHL",
            urgency: Math.floor(Math.random() * 5) + 1,
            area: areas[Math.floor(Math.random() * areas.length)],
            created_at: new Date().toISOString(),
        };

        try {
            const response = await fetch('http://localhost:8000/orders/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(fakeOrder),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Backend Rejected Order:', errorData);
                alert(`Simulate failed (status ${response.status}): ${JSON.stringify(errorData.detail || errorData)}`);
                return;
            }

            const data = await response.json();
            console.log('Order Simulated Successfully ✅', data);
        } catch (err) {
            console.error('Network/CORS Error: Is FastAPI running on 8000?', err);
            alert('Network/CORS error: check backend socket and CORS settings.');
        }
    };

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* 0. Hero Full-Screen Highlights */}
            <Highlights />

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
                    <button onClick={() => { localStorage.removeItem('token'); setToken(null); }} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Logout
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
