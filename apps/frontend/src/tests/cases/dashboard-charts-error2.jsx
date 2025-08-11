const DashboardCharts = () => {
  const [revenueData] = useState([
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 19000 },
    { month: 'Mar', value: 15000 },
    { month: 'Apr', value: 22000 },
    { month: 'May', value: 18000 },
    { month: 'Jun', value: 25000 },
  ]);

  const [userData] = useState([
    { month: 'Jan', value: 320 },
    { month: 'Feb', value: 450 },
    { month: 'Mar', value: 580 },
    { month: 'Apr', value: 720 },
    { month: 'May', value: 890 },
    { month: 'Jun', value: 1100 },
  ]);

  const maxValue = useMemo(() => {
    const revMax = Math.max(...revenueData.map((item) => item.value));
    const userMax = Math.max(...userData.map((item) => item.value));
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
    fontFamily: 'sans-serif',
  };

  const chartContainerStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const chartGridStyle = {
    display: 'flex',
    height: '200px',
    alignItems: 'flex-end',
    gap: '20px',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    borderLeft: '1px solid #eee',
    position: 'relative',
  };

  const yAxisStyle = {
    position: 'absolute',
    left: '-10px',
    top: '0',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#777',
  };

  const yAxisLabelStyle = {
    position: 'absolute',
    left: '-30px',
  };

  const barContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: '1',
    height: '100%',
  };

  const barStyle = (value, max, color) => ({
    width: '30px',
    backgroundColor: color,
    height: `${(value / max) * 100}%`,
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.5s ease',
  });

  const labelStyle = {
    marginTop: '8px',
    fontSize: '12px',
    color: '#666',
  };

  const legendStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '15px',
  };

  const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
  };

  const legendColorBoxStyle = (color) => ({
    width: '12px',
    height: '12px',
    backgroundColor: color,
    borderRadius: '2px',
  });

  const formatCurrency = (value) => {
    return `${value.toLocaleString()}`;
  };

  const _formatUsers = (value) => {
    return `${value} users`;
  };

  return (
    <div style={chartStyle}>
      <div style={chartContainerStyle}>
        <div style={titleStyle}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#4361ee',
              borderRadius: '50%',
            }}
          ></div>
          Revenue Growth
        </div>
        <div style={chartGridStyle}>
          <div style={yAxisStyle}>
            <div style={yAxisLabelStyle}>{formatCurrency(maxValue)}</div>
            <div style={yAxisLabelStyle}>{formatCurrency(maxValue * 0.75)}</div>
            <div style={yAxisLabelStyle}>{formatCurrency(maxValue * 0.5)}</div>
            <div style={yAxisLabelStyle}>{formatCurrency(maxValue * 0.25)}</div>
            <div style={yAxisLabelStyle}>{formatCurrency(0)}</div>
          </div>
          {revenueData.map((item, index) => (
            <div key={index} style={barContainerStyle}>
              <div style={barStyle(item.value, maxValue, '#4361ee')}></div>
              <div style={labelStyle}>{item.month}</div>
            </div>
          ))}
        </div>
        <div style={legendStyle}>
          <div style={legendItemStyle}>
            <div style={legendColorBoxStyle('#4361ee')}></div>
            <span>Revenue</span>
          </div>
        </div>
      </div>

      <div style={chartContainerStyle}>
        <div style={titleStyle}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#f72585',
              borderRadius: '50%',
            }}
          ></div>
          User Growth
        </div>
        <div style={chartGridStyle}>
          <div style={yAxisStyle}>
            <div style={yAxisLabelStyle}>{Math.round(maxValue)}</div>
            <div style={yAxisLabelStyle}>{Math.round(maxValue * 0.75)}</div>
            <div style={yAxisLabelStyle}>{Math.round(maxValue * 0.5)}</div>
            <div style={yAxisLabelStyle}>{Math.round(maxValue * 0.25)}</div>
            <div style={yAxisLabelStyle}>{0}</div>
          </div>
          {userData.map((item, index) => (
            <div key={index} style={barContainerStyle}>
              <div style={barStyle(item.value, maxValue, '#f72585')}></div>
              <div style={labelStyle}>{item.month}</div>
            </div>
          ))}
        </div>
        <div style={legendStyle}>
          <div style={legendItemStyle}>
            <div style={legendColorBoxStyle('#f72585')}></div>
            <span>Users</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const _Component = DashboardCharts;
