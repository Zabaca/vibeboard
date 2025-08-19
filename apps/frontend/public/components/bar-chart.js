import React, { useState, useEffect } from 'react';

export default function BarChart() {
  const [animated, setAnimated] = useState(false);
  
  const data = [
    { label: 'Jan', value: 65, color: '#3b82f6' },
    { label: 'Feb', value: 45, color: '#10b981' },
    { label: 'Mar', value: 85, color: '#f59e0b' },
    { label: 'Apr', value: 75, color: '#ef4444' },
    { label: 'May', value: 95, color: '#8b5cf6' },
    { label: 'Jun', value: 55, color: '#06b6d4' }
  ];

  useEffect(() => {
    setTimeout(() => setAnimated(true), 300);
  }, []);

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>Monthly Sales</h2>
      
      <div style={{
        display: 'flex',
        alignItems: 'end',
        gap: '12px',
        height: '200px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {data.map((item, index) => (
          <div key={item.label} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151'
            }}>
              {item.value}%
            </div>
            <div
              style={{
                width: '40px',
                height: animated ? `${(item.value / maxValue) * 150}px` : '0px',
                backgroundColor: item.color,
                borderRadius: '4px 4px 0 0',
                transition: `height 0.8s ease ${index * 0.1}s`,
                display: 'flex',
                alignItems: 'end',
                justifyContent: 'center'
              }}
            />
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280'
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={() => {
          setAnimated(false);
          setTimeout(() => setAnimated(true), 100);
        }}
        style={{
          marginTop: '20px',
          padding: '8px 16px',
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        Animate Again
      </button>
    </div>
  );
}