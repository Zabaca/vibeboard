import React, { useState } from 'react';

export default function SimpleCounter() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>Counter</h2>
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#3b82f6',
        margin: '20px 0',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        minWidth: '120px',
        textAlign: 'center'
      }}>
        {count}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setCount(count - 1)}
          style={{
            padding: '12px 20px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          -
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            padding: '12px 20px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}