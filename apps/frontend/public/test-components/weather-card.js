// Weather Card Component for URL import testing
import React, { useState } from 'react';

export default function WeatherCard() {
  const [temp, setTemp] = useState(72);
  const [unit, setUnit] = useState('F');
  
  const toggleUnit = () => {
    if (unit === 'F') {
      setUnit('C');
      setTemp(Math.round((temp - 32) * 5/9));
    } else {
      setUnit('F');
      setTemp(Math.round(temp * 9/5 + 32));
    }
  };
  
  const adjustTemp = (delta) => {
    setTemp(prev => prev + delta);
  };
  
  const getWeatherEmoji = () => {
    const fahrenheit = unit === 'F' ? temp : temp * 9/5 + 32;
    if (fahrenheit < 32) return '🥶';
    if (fahrenheit < 50) return '❄️';
    if (fahrenheit < 60) return '🌤️';
    if (fahrenheit < 75) return '☀️';
    if (fahrenheit < 85) return '🌞';
    return '🔥';
  };
  
  return React.createElement('div', {
    style: {
      padding: '25px',
      background: 'linear-gradient(135deg, #72EDF2 10%, #5151E5 100%)',
      borderRadius: '20px',
      textAlign: 'center',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      width: '300px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
    }
  },
    React.createElement('h2', {
      style: { 
        margin: '0 0 20px 0',
        fontSize: '28px',
        fontWeight: '300'
      }
    }, 'Weather Simulator'),
    
    React.createElement('div', {
      style: { 
        fontSize: '72px',
        margin: '20px 0'
      }
    }, getWeatherEmoji()),
    
    React.createElement('div', {
      style: { 
        fontSize: '56px',
        fontWeight: 'bold',
        margin: '20px 0',
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
      }
    }, `${temp}°${unit}`),
    
    React.createElement('div', {
      style: { 
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        margin: '20px 0'
      }
    },
      React.createElement('button', {
        onClick: () => adjustTemp(-1),
        style: {
          padding: '10px 20px',
          fontSize: '20px',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid white',
          borderRadius: '10px',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }
      }, '−'),
      
      React.createElement('button', {
        onClick: toggleUnit,
        style: {
          padding: '10px 20px',
          fontSize: '16px',
          background: 'rgba(255,255,255,0.3)',
          border: '2px solid white',
          borderRadius: '10px',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold'
        }
      }, `°${unit === 'F' ? 'C' : 'F'}`),
      
      React.createElement('button', {
        onClick: () => adjustTemp(1),
        style: {
          padding: '10px 20px',
          fontSize: '20px',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid white',
          borderRadius: '10px',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }
      }, '+')
    ),
    
    React.createElement('div', {
      style: { 
        marginTop: '20px',
        fontSize: '14px',
        opacity: '0.9'
      }
    }, 'Click +/− to adjust • Click °F/°C to convert')
  );
}