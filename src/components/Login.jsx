import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Login = ({ setToken }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.35)', outline: 'none', background: 'rgba(255,255,255,0.7)' };
    const btnStyle = { background: '#1e3a8a', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new URLSearchParams();
        formData.append('username', user);
        formData.append('password', pass);

        try {
            const response = await fetch('http://localhost:8000/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                setError(true);
                setLoading(false);
                return;
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
            setError(false);
        } catch (error) {
            console.error('Login error', error);
            setError(true);
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                backgroundImage: 'url(https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2000)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={error ? { x: [-10, 10, -10, 10, 0], scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{ width: '400px', textAlign: 'center', padding: '40px' }}
            >
                <h2 style={{ color: '#1e3a8a' }}>Logistics Portal</h2>
                <p>Enter credentials to access Hyderabad Hub</p>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <input type="text" placeholder="Username" value={user} onChange={(e) => { setUser(e.target.value); setError(false); }} style={inputStyle} />
                    <input type="password" placeholder="Password" value={pass} onChange={(e) => { setPass(e.target.value); setError(false); }} style={inputStyle} />
                    <button type="submit" disabled={loading} style={btnStyle}>
                        {loading ? 'Authenticating...' : 'Unlock Dashboard'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
