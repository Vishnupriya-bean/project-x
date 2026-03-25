import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
const slides = [
    { id: 1, title: 'Daily Dispatch Efficiency', text: 'Track pick-up success and order volume.' },
    { id: 2, title: 'Carrier Performance', text: 'Monitor DHL/UPS/DPD rapidly.' },
    { id: 3, title: 'Urgency Distribution', text: 'See how many priority orders are pending.' },
];

function Carousel({ logs }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setIndex((prev) => (prev + 1) % slides.length), 3500);
        return () => clearInterval(timer);
    }, []);

    const slide = slides[index];

    return (
        <div className="panel" style={{ marginBottom: '16px' }}>
            <h2>Daily Highlights</h2>
            <AnimatePresence mode="wait">
                <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.45 }}
                    style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', marginTop: '8px', textShadow: '0px 4px 10px rgba(0,0,0,0.3)' }}
                >
                    <strong>{slide.title}</strong>
                    <p>{slide.text}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>{logs.length} live events</p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default Carousel;
