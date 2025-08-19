import React, { useState, useEffect } from 'react';

export default function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#00ff88',
          marginBottom: '16px',
          textShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
          letterSpacing: '2px'
        }}>
          {formatTime(time)}
        </div>
        
        <div style={{
          fontSize: '18px',
          color: '#94a3b8',
          marginBottom: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          {formatDate(time)}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '20px',
          marginTop: '20px',
          fontSize: '14px',
          color: '#64748b'
        }}>
          <div>
            <div style={{ color: '#00ff88' }}>UTC</div>
            <div>{time.toUTCString().slice(-12, -4)}</div>
          </div>
          <div>
            <div style={{ color: '#00ff88' }}>UNIX</div>
            <div>{Math.floor(time.getTime() / 1000)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}