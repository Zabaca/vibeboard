// External Clock Component for URL import testing
import React, { useState, useEffect } from 'react';

export default function ExternalClock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };
  
  return React.createElement('div', {
    style: {
      padding: '30px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '15px',
      textAlign: 'center',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }
  },
    React.createElement('h2', {
      style: { 
        margin: '0 0 10px 0',
        fontSize: '24px',
        fontWeight: '300',
        letterSpacing: '2px'
      }
    }, 'Digital Clock'),
    React.createElement('div', {
      style: { 
        fontSize: '48px',
        fontWeight: 'bold',
        letterSpacing: '3px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }
    }, formatTime(time)),
    React.createElement('div', {
      style: { 
        marginTop: '15px',
        fontSize: '16px',
        opacity: '0.9'
      }
    }, time.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  );
}