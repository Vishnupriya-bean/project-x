import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';

const Footer = () => {
    const socialLinks = [
        {
            icon: FaLinkedin,
            url: 'https://www.linkedin.com/in/g-vishnupriya-246057317/',
            label: 'LinkedIn'
        },
        {
            icon: FaGithub,
            url: 'https://github.com/Vishnupriya-bean',
            label: 'GitHub'
        },
        {
            icon: FaInstagram,
            url: 'https://www.instagram.com/vishnupriya__18/?hl=en',
            label: 'Instagram'
        }
    ];

    return (
        <footer style={{ backgroundColor: '#2c3e50', color: 'white', padding: '40px 20px', marginTop: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3>Smart Logistics Hyderabad</h3>
                    <p>© 2026 Internal Admin Portal</p>
                </div>
                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                    {socialLinks.map((social) => {
                        const IconComponent = social.icon;
                        return (
                            <a
                                key={social.label}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={social.label}
                                style={{
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s ease, color 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.2)';
                                    e.currentTarget.style.color = '#2ecc71';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.color = 'white';
                                }}
                            >
                                <IconComponent size={24} />
                            </a>
                        );
                    })}
                </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', opacity: 0.6 }}>
                System Status: <span style={{ color: '#2ecc71' }}>● Online</span>
            </div>
        </footer>
    );
};

export default Footer;
