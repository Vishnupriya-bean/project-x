import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

const slides = [
    {
        title: "Morning Dispatch",
        location: "Secunderabad Hub",
        img: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=2000" // High-quality warehouse
    },
    {
        title: "Express Delivery",
        location: "Gachibowli Tech Park",
        img: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2000" // Logistics/Trucks
    }
];

const Highlights = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setIndex(prev => (prev + 1) % slides.length), 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    style={{
                        position: 'absolute', width: '100%', height: '100%',
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${slides[index].img})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10%'
                    }}
                >
                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                        <h3 style={{ color: '#3498db', textTransform: 'uppercase', letterSpacing: '4px' }}>Live Activity</h3>
                        <h1 style={{ fontSize: '5rem', color: 'white', margin: '10px 0', lineHeight: '1' }}>{slides[index].title}</h1>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.5rem' }}>Current Focus: {slides[index].location}</p>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ position: 'absolute', bottom: '30px', left: '50%', color: 'white', fontSize: '12px' }}
            >
                Scroll to Dashboard ↓
            </motion.div>
        </div>
    );
};

export default Highlights;