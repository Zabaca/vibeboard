import React, { useState, useEffect } from 'react';

export default function CountdownTimer() {
  const [seconds, setSeconds] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(60);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(initialTime);
    setIsActive(false);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const secs = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#1f2937',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#f3f4f6', marginBottom: '20px' }}>Countdown Timer</h2>
      <div style={{
        fontSize: '64px',
        fontWeight: 'bold',
        color: seconds <= 10 ? '#ef4444' : '#10b981',
        margin: '20px 0',
        padding: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        minWidth: '200px',
        textAlign: 'center'
      }}>
        {formatTime(seconds)}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={toggle}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: isActive ? '#f59e0b' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
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
      </div>
      <input
        type="range"
        min="10"
        max="300"
        value={initialTime}
        onChange={(e) => {
          const newTime = parseInt(e.target.value);
          setInitialTime(newTime);
          if (!isActive) setSeconds(newTime);
        }}
        style={{
          width: '200px',
          accentColor: '#10b981'
        }}
      />
      <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.7 }}>
        Set timer: {formatTime(initialTime)}
      </p>
    </div>
  );
}