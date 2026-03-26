import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useMemo } from 'react';

const slides = [
    {
        title: "Morning Dispatch",
        location: "Secunderabad Hub",
        img: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=2000"
    },
    {
        title: "Express Delivery",
        location: "Gachibowli Tech Park",
        img: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2000"
    }
];

const Highlights = ({ orders = [], loading = false }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setIndex(prev => (prev + 1) % slides.length), 6000);
        return () => clearInterval(timer);
    }, []);

    // Calculate all analytics
    const analytics = useMemo(() => {
        const now = new Date();

        // Delays and urgency
        const delayedCount = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);
            return daysDiff > 7 && o.status !== "Delivered";
        }).length;

        const pendingPayment = orders.filter(o => o.status !== 'Delivered' && o.payment === 'Remaining').length;
        const highUrgency = orders.filter(o => o.urgency >= 5).length;
        const delivered = orders.filter(o => o.status === 'Delivered').length;
        const shipped = orders.filter(o => o.status === 'Shipped').length;
        const picked = orders.filter(o => o.status === 'Picked').length;
        const activeOrders = orders.filter(o => o.status !== 'Delivered').length;

        // Area analysis
        const areaCount = {};
        orders.forEach(o => {
            areaCount[o.area] = (areaCount[o.area] || 0) + 1;
        });
        const busiestArea = Object.keys(areaCount).reduce((a, b) =>
            areaCount[a] > areaCount[b] ? a : b, null
        );

        // Product analysis
        const productCount = {};
        orders.forEach(o => {
            productCount[o.product_name] = (productCount[o.product_name] || 0) + 1;
        });
        const topProduct = Object.keys(productCount).reduce((a, b) =>
            productCount[a] > productCount[b] ? a : b, null
        );
        const shippedProducts = {};
        orders.filter(o => o.status === 'Shipped').forEach(o => {
            shippedProducts[o.product_name] = (shippedProducts[o.product_name] || 0) + 1;
        });

        // Most delivered product (Top 3 delivered)
        const deliveredProducts = {};
        orders.filter(o => o.status === 'Delivered').forEach(o => {
            deliveredProducts[o.product_name] = (deliveredProducts[o.product_name] || 0) + 1;
        });
        const sortedDeliveredProducts = Object.entries(deliveredProducts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));
        const mostShippedProduct = sortedDeliveredProducts.length > 0 ? sortedDeliveredProducts[0].name : 'N/A';

        // Average age
        const avgAge = orders.length > 0
            ? (orders.reduce((sum, o) => {
                const age = (now - new Date(o.created_at)) / (1000 * 60 * 60 * 24);
                return sum + age;
            }, 0) / orders.length).toFixed(1)
            : 0;

        // Hub capacity
        const busiestCount = busiestArea ? areaCount[busiestArea] : 0;
        const totalHubs = Object.keys(areaCount).length;
        const hubCapacity = totalHubs > 0 ? Math.round((busiestCount / orders.length) * 100) : 0;

        // Revenue at risk
        const revenueAtRisk = pendingPayment * 500;

        return {
            delayedCount,
            pendingPayment,
            highUrgency,
            delivered,
            shipped,
            picked,
            activeOrders,
            busiestArea,
            topProduct,
            mostShippedProduct,
            topDeliveredProducts: sortedDeliveredProducts,
            avgAge,
            hubCapacity,
            revenueAtRisk,
            areaCount,
            totalHubs,
            busiestCount
        };
    }, [orders]);

    // Generate dynamic context-aware heading
    const getDynamicHeading = () => {
        if (!orders || orders.length === 0) {
            return "🚀 Hyderabad Logistics: Ready for Action";
        }

        if (analytics.delayedCount > 0) {
            return `🚨 CRITICAL: ${analytics.delayedCount} Deliveries Exceed 7 Days`;
        }
        if (analytics.highUrgency > 0) {
            return `⚠️ URGENT: ${analytics.highUrgency} Critical Orders Need Attention`;
        }
        if (analytics.pendingPayment > 5) {
            return `💸 REVENUE ALERT: ₹${analytics.revenueAtRisk.toLocaleString()} Payments Remaining`;
        }
        if (analytics.hubCapacity > 80) {
            return `🌅 Morning Rush: ${analytics.busiestArea} Hub at ${analytics.hubCapacity}% Capacity`;
        }
        if (analytics.delivered === orders.length && orders.length > 0) {
            return `✅ SYSTEM GREEN: All ${orders.length} Orders Delivered Successfully`;
        }
        if (analytics.shipped > 0) {
            return `🚚 IN TRANSIT: ${analytics.shipped} Orders Shipping from ${analytics.busiestArea}`;
        }
        return `📍 ACTIVE HUB: ${analytics.activeOrders} Orders Across ${analytics.totalHubs} Areas`;
    };

    const getHeadingColor = () => {
        if (analytics.delayedCount > 0) return '#ef4444'; // Red
        if (analytics.highUrgency > 0) return '#ef4444'; // Red
        if (analytics.pendingPayment > 5) return '#f59e0b'; // Amber
        if (analytics.delivered === orders.length && orders.length > 0) return '#22c55e'; // Green
        return '#3b82f6'; // Blue
    };

    // Show loading state while data is being fetched
    if (loading || !orders || orders.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}

                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100vh',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    textAlign: 'center'
                }}
            >
                <motion.div
                    animate={{ rotate: 360 }}

                    style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid rgba(255,255,255,0.3)',
                        borderTop: '4px solid white',
                        borderRadius: '50%',
                        marginBottom: '20px'
                    }}
                />
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>🚚 Loading War Room...</h1>
                <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)' }}>Fetching real-time logistics data from Hyderabad hubs</p>
            </motion.div>
        );
    }

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100vh',
            overflow: 'hidden',
            padding: '0 5vw',
            '@media (max-width: 768px)': {
                padding: '0 4vw'
            }
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}

                    animate={{ opacity: 1 }}


                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(${slides[index].img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '0 10%'
                    }}
                >
                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} >
                        {/* LIVE Badge */}
                        <motion.div


                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(34, 197, 94, 0.3)',
                                border: '2px solid #22c55e',
                                padding: '10px 16px',
                                borderRadius: '20px',
                                marginBottom: '15px',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <span style={{
                                width: '8px',
                                height: '8px',
                                background: '#22c55e',
                                borderRadius: '50%',
                                animation: 'pulse-live 1.5s ease-in-out 1'
                            }}></span>
                            🎯 LIVE FROM HYDERABAD HUB
                        </motion.div>

                        {/* Dynamic Heading */}
                        <h1
                            style={{
                                fontSize: 'clamp(2rem, 6vw, 4.5rem)',
                                margin: '15px 0',
                                lineHeight: '1.1',
                                color: '#ffffff',
                                fontWeight: 900,
                                letterSpacing: '-1px',
                                textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)',
                                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))',
                                '@media (max-width: 640px)': {
                                    fontSize: 'clamp(1.5rem, 5vw, 2.5rem)'
                                }
                            }}
                        >
                            {getDynamicHeading()}
                        </h1>

                        {/* At-a-Glance Power Stats */}
                        {orders.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '15px',
                                    marginTop: '20px',
                                    marginBottom: '25px'
                                }}
                            >
                                {/* Most Shipped Product */}
                                <div style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    color: '#ffffff'
                                }}>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '5px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>📦 Most Shipped</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{analytics.mostShippedProduct || 'N/A'}</div>
                                </div>

                                {/* Busiest Area */}
                                <div style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    color: '#ffffff'
                                }}>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '5px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>🏢 Busiest Area</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                                        {analytics.busiestArea} ({analytics.hubCapacity}%)
                                    </div>
                                </div>

                                {/* Average Age */}
                                <div style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    color: '#ffffff'
                                }}>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '5px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>⏱️ Avg Order Age</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{analytics.avgAge} Days</div>
                                </div>
                            </motion.div>
                        )}

                        {/* Hero Insights */}
                        {orders.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}


                                style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    borderRadius: '10px',
                                    padding: '15px 20px',
                                    color: '#ffffff',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6',
                                    textShadow: '0 2px 5px rgba(0,0,0,0.7)'
                                }}
                            >
                                <div>
                                    <strong>🏆 Top 3 Delivered Products:</strong>
                                    {analytics.topDeliveredProducts.length > 0
                                        ? ` ${analytics.topDeliveredProducts.map((p, i) => `${i + 1}. ${p.name} (${p.count} delivered)`).join(', ')}`
                                        : ' No delivered products yet'
                                    }
                                </div>
                                <div style={{ marginTop: '8px' }}>
                                    <strong>⚡ Critical Action:</strong> {analytics.delayedCount > 0
                                        ? `${analytics.delayedCount} order(s) stuck beyond 7 days - escalate delivery teams NOW!`
                                        : `All zones performing well. Focus on ${analytics.busiestArea || 'main hub'} for peak hour optimization.`
                                    }
                                </div>
                            </motion.div>
                        )}

                        {/* Core Stats */}
                        <div style={{ display: 'flex', gap: '30px', marginTop: '25px', flexWrap: 'wrap' }}>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}

                                style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '15px 25px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                <span style={{ fontSize: '2rem', marginRight: '10px' }}>🚚</span>
                                <span style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                                    <strong>{analytics.activeOrders}</strong> In Transit
                                </span>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}

                                style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '15px 25px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                <span style={{ fontSize: '2rem', marginRight: '10px' }}>✅</span>
                                <span style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                                    <strong>{analytics.delivered}</strong> Delivered
                                </span>
                            </motion.div>

                            {analytics.highUrgency > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}

                                    style={{
                                        background: 'rgba(220, 38, 38, 0.4)',
                                        backdropFilter: 'blur(12px)',
                                        padding: '15px 25px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(239, 68, 68, 0.6)',


                                    }}
                                >
                                    <span style={{ fontSize: '2rem', marginRight: '10px' }}>🚨</span>
                                    <span style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                                        <strong>{analytics.highUrgency}</strong> Critical
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        <p style={{ color: '#ffffff', fontSize: '1.1rem', marginTop: '20px', textShadow: '0 2px 5px rgba(0,0,0,0.7)' }}>
                            Real-time updates • {orders?.length || 0} Total Orders • Powered by Live Hub Analytics
                        </p>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Scroll Indicator */}
            <motion.div


                style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: '12px' }}
            >
                👇 Scroll to Dashboard
            </motion.div>

            <style>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes pulse-live {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @keyframes pulse-red {
                    0%, 100% { box-shadow: 0 0 0px rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.7); }
                }

                .dynamic-title {
                    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
                    background-size: 400% 400%;
                
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            `}</style>
        </div>
    );
};

export default Highlights;
