const GrowthChart = () => {
  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 19000 },
    { month: 'Mar', value: 15000 },
    { month: 'Apr', value: 22000 },
    { month: 'May', value: 18000 },
    { month: 'Jun', value: 25000 },
  ]);

  const [userData, setUserData] = useState([
    { month: 'Jan', value: 320 },
    { month: 'Feb', value: 450 },
    { month: 'Mar', value: 580 },
    { month: 'Apr', value: 720 },
    { month: 'May', value: 890 },
    { month: 'Jun', value: 1100 },
  ]);

  const chartContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    fontFamily: 'sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
  };

  const chartWrapperStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  };

  const chartTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const chartGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '20px',
  };

  const revenueBarStyle = {
    height: '8px',
    backgroundColor: '#3b82f6',
    borderRadius: '4px',
    transition: 'all 0.3s ease',
  };

  const userBarStyle = {
    height: '8px',
    backgroundColor: '#10b981',
    borderRadius: '4px',
    transition: 'all 0.3s ease',
  };

  const monthLabelStyle = {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'center',
    marginTop: '8px',
  };

  const valueLabelStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: '4px',
  };

  const iconStyle = {
    width: '24px',
    height: '24px',
  };

  const formatCurrency = (value) => {
    return `$${value.toLocaleString()}`;
  };

  const formatUsers = (value) => {
    return `${value} users`;
  };

  const getMaxValue = (data) => {
    return Math.max(...data.map((item) => item.value));
  };

  const renderChart = (data, color, title, formatFn) => {
    const maxValue = getMaxValue(data);

    return (
      <div style={chartWrapperStyle}>
        <div style={chartTitleStyle}>
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 20V10M18 20V4M6 20v-4"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {title}
        </div>
        <div style={chartGridStyle}>
          {data.map((item, index) => (
            <div
              key={index}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div style={valueLabelStyle}>{formatFn(item.value)}</div>
              <div
                style={{
                  ...revenueBarStyle,
                  backgroundColor: color,
                  width: `${(item.value / maxValue) * 100}%`,
                  maxWidth: '100px',
                }}
              />
              <div style={monthLabelStyle}>{item.month}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={chartContainerStyle}>
      {renderChart(revenueData, '#3b82f6', 'Revenue Growth', formatCurrency)}
      {renderChart(userData, '#10b981', 'User Growth', formatUsers)}
    </div>
  );
};

const Component = GrowthChart;
