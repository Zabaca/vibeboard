const DashboardCharts = () => {
  const [revenueData] = useState([
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 19000 },
    { month: 'Mar', value: 15000 },
    { month: 'Apr', value: 22000 },
    { month: 'May', value: 18000 },
    { month: 'Jun', value: 25000 }
  ]);

  const [userData] = useState([
    { month: 'Jan', value: 320 },
    { month: 'Feb', value: 450 },
    { month: 'Mar', value: 580 },
    { month: 'Apr', value: 720 },
    { month: 'May', value: 890 },
    { month: 'Jun', value: 1100 }
  ]);

  const maxValue = useMemo(() => {
    const revMax = Math.max(...revenueData.map(item => item.value));
    const userMax = Math.max(...userData.map(item => item.value));
    return Math.max(revMax, userMax);
  }, [revenueData, userData]);

  const chartStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    fontFamily: 'sans-serif'
  };

  const chartContainerStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const chartGridStyle = {
    display: 'flex',
    height: '200px',
    alignItems: 'flex-end',
    gap: '20px',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    borderLeft: '1px solid #eee',
    position: 'relative'
  };

  const barStyle = (value, max, color) => ({
    flex: 1,
    backgroundColor: color,
    height: `${(value / max) * 100}%`,
    borderRadius: '4px 4px 0 0',
    minWidth: '30px',
    transition: 'height 0.5s ease',
    position: 'relative'
  });

  const labelStyle = {
    textAlign: 'center',
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
    fontWeight: '500'
  };

  const valueLabelStyle = (color) => ({
    position: 'absolute',
    top: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '11px',
    color: color,
    fontWeight: '600'
  });

  const iconStyle = {
    width: '24px',
    height: '24px'
  };

  const revenueIcon = (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none">
      <path d="M12 8C8.68629 8 6 10.6863 6 14C6 17.3137 8.68629 20 12 20C15.3137 20 18 17.3137 18 14C18 10.6863 15.3137 8 12 8Z" 
            stroke="#4f46e5" strokeWidth="2" />
      <path d="M12 2V6" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 22V18" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.93 4.93L7.76 7.76" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.24 16.24L19.07 19.07" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 12H6" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 12H22" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.93 19.07L7.76 16.24" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.24 7.76L19.07 4.93" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const userIcon = (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none">
      <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" 
            stroke="#10b981" strokeWidth="2" />
      <path d="M20 21C20 18.7909 18.2091 17 16 17H8C5.79086 17 4 18.7909 4 21" 
            stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 10H6L7 14L9 8L11 12H14" stroke="#10b981" strokeWidth="2" 
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div style={chartStyle}>
      <div style={chartContainerStyle}>
        <div style={titleStyle}>
          {revenueIcon}
          <span>Revenue Growth</span>
        </div>
        <div style={chartGridStyle}>
          {revenueData.map((item, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div style={barStyle(item.value, maxValue, '#4f46e5')}>
                  <div style={valueLabelStyle('#4f46e5')}>${item.value.toLocaleString()}</div>
                </div>
              </div>
              <div style={labelStyle}>{item.month}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={chartContainerStyle}>
        <div style={titleStyle}>
          {userIcon}
          <span>User Growth</span>
        </div>
        <div style={chartGridStyle}>
          {userData.map((item, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div style={barStyle(item.value, maxValue, '#10b981')}>
                  <div style={valueLabelStyle('#10b981')}>{item.value}</div>
                </div>
              </div>
              <div style={labelStyle}>{item.month}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Component = DashboardCharts;