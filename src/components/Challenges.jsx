const Challenges = () => {
    const challengeData = [
        { id: 1, title: "Route Optimization", img: "https://plus.unsplash.com/premium_photo-1684450118900-6dc45302fda3?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", desc: "Avoiding city congestion." },
        { id: 2, title: "Inventory Accuracy", img: "https://images.unsplash.com/photo-1754039985008-a15410211b67?q=80&w=1189&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", desc: "Real-time shelf tracking." },
        { id: 3, title: "Waste Reduction", img: "https://plus.unsplash.com/premium_photo-1770559289478-f32551996edc?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", desc: "Perishable item management." },
        { id: 4, title: "Fast Dispatch", img: "https://plus.unsplash.com/premium_photo-1681488134408-d6eb570673af?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", desc: "Beating delivery deadlines." },
    ];

    return (
        <div style={{ padding: '40px 20px', backgroundColor: '#fff' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Core Business Challenges</h2>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                {challengeData.map((item) => (
                    <div key={item.id} style={{ width: '250px', textAlign: 'center' }}>
                        <img
                            src={item.img}
                            alt={item.title}
                            style={{ width: '100%', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                        />
                        <h4 style={{ marginTop: '15px' }}>{item.title}</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Challenges;
