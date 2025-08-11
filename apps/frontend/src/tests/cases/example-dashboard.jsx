// AI-generated dashboard component with potential issues
const DashboardMetrics = () => {
  const [metrics, setMetrics] = useState([
    { name: 'Revenue', value: 45678.9, color: '#10b981' },
    { name: 'Users', value: 1234, color: '#6366f1' },
    { name: 'Conversion', value: 23.5, color: '#f59e0b' },
  ]);

  const [theme, setTheme] = useState('light');

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderRadius: '12px',
        boxShadow: `0 4px 6px ${theme === 'dark' ? '#00000080' : '#00000020'}`,
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: theme === 'dark' ? '#f3f4f6' : '#111827',
        }}
      >
        Dashboard Metrics
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              padding: '16px',
              backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
              borderRadius: '8px',
              borderLeft: `4px solid ${metric.color}`,
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                fontSize: '14px',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                marginBottom: '4px',
              }}
            >
              {metric.name}
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: metric.color,
              }}
            >
              {metric.name === 'Revenue'
                ? `$${metric.value.toLocaleString()}`
                : metric.name === 'Conversion'
                  ? `${metric.value}%`
                  : metric.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{
          marginTop: '20px',
          padding: '8px 16px',
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        Toggle Theme
      </button>
    </div>
  );
};

const Component = DashboardMetrics;
