const Footer = () => {
    return (
        <footer style={{ backgroundColor: '#2c3e50', color: 'white', padding: '40px 20px', marginTop: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3>Smart Logistics Hyderabad</h3>
                    <p>© 2026 Internal Admin Portal</p>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <button style={{ background: 'none', border: '1px solid white', color: 'white', cursor: 'pointer', padding: '5px 10px' }}>Instagram</button>
                    <button style={{ background: 'none', border: '1px solid white', color: 'white', cursor: 'pointer', padding: '5px 10px' }}>Twitter</button>
                    <button style={{ background: 'none', border: '1px solid white', color: 'white', cursor: 'pointer', padding: '5px 10px' }}>LinkedIn</button>
                </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', opacity: 0.6 }}>
                System Status: <span style={{ color: '#2ecc71' }}>● Online</span>
            </div>
        </footer>
    );
};

export default Footer;
