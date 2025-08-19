import { useState } from 'react';

export default function SimpleCounter() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#1f2937',
        margin: '0 0 24px 0'
      }}>
        {count}
      </h2>
      <div style={{
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={() => setCount(count - 1)}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          -
        </button>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#10b981',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          +
        </button>
      </div>
      <button
        onClick={() => setCount(0)}
        style={{
          marginTop: '16px',
          padding: '8px 16px',
          fontSize: '14px',
          color: '#6b7280',
          backgroundColor: '#e5e7eb',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Reset
      </button>
    </div>
  );
}