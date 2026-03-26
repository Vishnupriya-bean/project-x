import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Carousel from './components/Carousel.jsx';
import StatCards from './components/StatCards.jsx';
import LogisticsGraph from './components/LogisticsGraph.jsx';
import CriticalOrders from './components/CriticalOrders.jsx';
import Challenges from './components/Challenges.jsx';
import Footer from './components/Footer.jsx';
import AreaSummary from './components/AreaSummary.jsx';
import CarrierLogs from './components/CarrierLogs.jsx';
import Highlights from './components/Highlights.jsx';
import Login from './components/Login.jsx';
import OrderForm from './components/OrderForm.jsx';
import AnalyticsPage from './components/AnalyticsPage.jsx';
import OrdersPage from './components/OrdersPage.jsx';
import CustomersPage from './components/CustomersPage.jsx';
import PaymentsPage from './components/PaymentsPage.jsx';
import ProductList from './components/ProductList.jsx';
import FeedbackForm from './components/FeedbackForm.jsx';
import FeedbacksPage from './components/FeedbacksPage.jsx';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    useEffect(() => {
        if (!token) {
            console.log('❌ No token found, skipping fetch');
            return;
        }

        console.log('🔑 Token found:', token ? 'Present' : 'Missing');

        // Fetch all existing orders and activity from the backend
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('🔄 Starting data fetch...');

                // Fetch orders
                const ordersResponse = await fetch('http://127.0.0.1:8001/orders', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Fetch activity logs
                const activityResponse = await fetch('http://127.0.0.1:8001/activity', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (ordersResponse.ok) {
                    const ordersData = await ordersResponse.json();
                    console.log('✅ Fetched existing orders:', ordersData);
                    console.log('📊 Total orders:', Array.isArray(ordersData) ? ordersData.length : 0);
                    if (Array.isArray(ordersData) && ordersData.length > 0) {
                        console.log('📦 Sample order:', ordersData[0]);
                    }
                    setOrders(Array.isArray(ordersData) ? ordersData : []);
                } else if (ordersResponse.status === 401) {
                    console.error('❌ Token expired or invalid, clearing token');
                    localStorage.removeItem('token');
                    setToken(null);
                    setError('Session expired. Please log in again.');
                } else {
                    const errorText = await ordersResponse.text();
                    console.error('❌ Failed to fetch orders:', ordersResponse.status, errorText);
                    setError(`Failed to load orders: ${ordersResponse.status}`);
                    setOrders([]);
                }

                if (activityResponse.ok) {
                    const activityData = await activityResponse.json();
                    console.log('✅ Fetched activity logs:', activityData);
                    // Format activity as log strings
                    const formattedLogs = activityData.map(activity =>
                        `[${new Date(activity.timestamp).toLocaleTimeString()}] ✓ Order #${activity.order_id?.slice(0, 8)} → ${activity.status} by ${activity.user || 'system'}`
                    );
                    setLogs(formattedLogs);
                } else {
                    console.error('❌ Failed to fetch activity:', activityResponse.status);
                    setLogs([]);
                }
            } catch (error) {
                console.error('❌ Network error fetching data:', error);
                setError('Unable to connect to server. Please check if the backend is running.');
                setOrders([]);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const socket = new WebSocket('ws://localhost:8000/ws/orders');
        socket.onopen = () => {
            console.log('📡 WebSocket connected');
            setConnected(true);
        };
        socket.onmessage = (event) => {
            const newOrder = JSON.parse(event.data);
            setOrders((prev) => {
                // Check if order already exists to prevent duplicates
                const orderExists = prev.some(o => o.id === newOrder.id);
                if (orderExists) {
                    // Update existing order if it's a status change
                    const oldOrder = prev.find(o => o.id === newOrder.id);
                    const isStatusChange = oldOrder && oldOrder.status !== newOrder.status;
                    if (isStatusChange) {
                        // Add activity log for status change
                        setLogs((prevLogs) => {
                            const entry = `[${new Date().toLocaleTimeString()}] ✓ Order #${newOrder.id?.slice(0, 8)} → ${newOrder.status}`;
                            return [entry, ...prevLogs].slice(0, 50);
                        });
                    }
                    return prev.map(o => o.id === newOrder.id ? newOrder : o);
                }
                // Add new order
                return [newOrder, ...prev];
            });
        };
        socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };
        socket.onclose = () => {
            console.log('📴 WebSocket disconnected');
            setConnected(false);
        };

        return () => socket.close();
    }, [token]);

    if (!token) {
        return <Login setToken={(newToken) => { localStorage.setItem('token', newToken); setToken(newToken); }} />;
    }

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:8001/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updatedOrder = await response.json();

                // Update the specific order with all new data including timestamps
                setOrders((prev) => {
                    const updated = prev.map((o) =>
                        o.id === orderId
                            ? {
                                ...o,
                                status: newStatus,
                                shipped_at: updatedOrder.shipped_at || o.shipped_at,
                                delivered_at: updatedOrder.delivered_at || o.delivered_at
                            }
                            : o
                    );
                    console.log('✅ Order updated in state:', updated.find(o => o.id === orderId));
                    return updated;
                });

                // Add activity log
                setLogs((prev) => {
                    const entry = `[${new Date().toLocaleTimeString()}] ✓ Order #${orderId?.slice(0, 8)} → ${newStatus}`;
                    return [entry, ...prev].slice(0, 50);
                });

                console.log('✅ Order status updated:', updatedOrder);
            } else {
                const errorData = await response.json();
                console.error('❌ Failed to update order status:', response.status, errorData);
                setError(`Failed to update order: ${errorData.detail || response.statusText}`);
                setTimeout(() => setError(null), 3000);
            }
        } catch (error) {
            console.error('❌ Error updating status:', error);
            setError('Network error updating order status');
            setTimeout(() => setError(null), 3000);
        }
    };

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <button onClick={() => { localStorage.removeItem('token'); setToken(null); window.location.reload(); }} style={{ position: 'absolute', top: '10px', right: '10px', background: '#e74c3c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', zIndex: 1000 }}>Logout</button>
            {/* 0. Hero Full-Screen Highlights */}
            <Highlights orders={orders} loading={loading} />

            {/* 1. Top Navigation Bar */}
            <nav style={{ background: '#fff', padding: '15px 30px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: '1fr 2fr 1.2fr', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a8a' }}>Smart Logistics</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Hyderabad</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                        { name: 'Dashboard', key: 'dashboard' },
                        { name: 'Analytics', key: 'analytics' },
                        { name: 'Orders', key: 'orders' },
                        { name: 'Customers', key: 'customers' },
                        { name: 'Payments', key: 'payments' },
                        { name: 'Feedbacks', key: 'feedbacks' }
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setCurrentPage(item.key)}
                            style={{
                                background: currentPage === item.key ? '#1e3a8a' : '#f9fafb',
                                border: currentPage === item.key ? 'none' : '1px solid #e5e7eb',
                                borderRadius: '10px',
                                color: currentPage === item.key ? '#fff' : '#1f2937',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: currentPage === item.key ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== item.key) {
                                    e.currentTarget.style.transform = 'scale(1.03)';
                                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(15,23,42,0.12)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== item.key) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowOrderModal(true)}
                        style={{
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#fff',
                            border: 'none',
                            padding: '9px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        ➕ Add Order
                    </button>
                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#fff',
                            border: 'none',
                            padding: '9px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        ⭐ Add Feedback
                    </button>
                    <span style={{ fontSize: '14px', color: connected ? '#10b981' : '#ef4444' }}>{connected ? 'Live' : 'Offline'}</span>
                    <button onClick={() => { localStorage.removeItem('token'); setToken(null); window.location.reload(); }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Error Message Display */}
            {error && (
                <div style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px 20px',
                    margin: '10px 30px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '18px' }}>⚠️</span>
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div style={{
                    background: '#dbeafe',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    padding: '12px 20px',
                    margin: '10px 30px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #1e40af',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Loading orders from database...</span>
                </div>
            )}

            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ maxWidth: '1400px', margin: '0 auto', padding: 'clamp(12px, 4vw, 20px)' }}
            >
                {/* Page Content Based on Current Page */}
                {currentPage === 'dashboard' && (
                    <>
                        {/* 2. Live Stat Cards - Now First on Mobile */}
                        <StatCards orders={orders} />

                        {/* 3. Full-Screen Animated Carousel */}
                        <Carousel orders={orders} />

                        {/* 4. Logistics Graph */}
                        <LogisticsGraph orders={orders} />

                        {/* 4.5 Product List */}
                        <ProductList orders={orders} />
                    </>
                )}

                {currentPage === 'analytics' && (
                    <AnalyticsPage orders={orders} />
                )}

                {currentPage === 'orders' && (
                    <OrdersPage orders={orders} onStatusUpdate={handleStatusUpdate} />
                )}

                {currentPage === 'customers' && (
                    <CustomersPage orders={orders} />
                )}

                {currentPage === 'payments' && (
                    <PaymentsPage orders={orders} />
                )}

                {currentPage === 'feedbacks' && (
                    <FeedbacksPage token={token} />
                )}
            </motion.main>

            {/* Order Form Modal */}
            {showOrderModal && (
                <OrderForm
                    token={token}
                    fullScreen={true}
                    onClose={() => setShowOrderModal(false)}
                />
            )}

            {/* Feedback Form Modal */}
            {showFeedbackModal && (
                <FeedbackForm
                    orders={orders}
                    token={token}
                    fullScreen={true}
                    onClose={() => setShowFeedbackModal(false)}
                />
            )}

            {/* 6. Professional Footer */}
            <Footer />
        </div>

    );
}

export default App;
