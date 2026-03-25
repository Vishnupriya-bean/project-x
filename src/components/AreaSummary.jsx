const AreaSummary = ({ orders }) => {
    const areas = ["Gachibowli", "Kukatpally", "Banjara Hills", "Charminar"];

    // Logic: Count orders per area
    const getCount = (areaName) => orders.filter(o => o.area === areaName).length;

    return (
        <div className="glass-card" style={{ marginTop: '20px' }}>
            <h3>Top Delivery Zones (Hyderabad)</h3>
            {areas.map(area => {
                const count = getCount(area);
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;

                return (
                    <div key={area} style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span>{area}</span>
                            <span>{count} Orders</span>
                        </div>
                        {/* The Progress Bar */}
                        <div style={{ background: '#e0e0e0', height: '8px', borderRadius: '4px', marginTop: '5px' }}>
                            <div style={{
                                width: `${percentage}%`,
                                background: '#3498db',
                                height: '100%',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease-in-out'
                            }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AreaSummary;