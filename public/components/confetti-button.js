// ESM React component that uses canvas-confetti from CDN
import React, { useState } from 'react';
import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/+esm';

const ConfettiButton = () => {
  const [clickCount, setClickCount] = useState(0);

  const fireConfetti = () => {
    // Fire confetti from both sides
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#bb0000', '#ffffff', '#0000ff']
    });
    
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#bb0000', '#ffffff', '#0000ff']
    });
    
    setClickCount(count => count + 1);
  };

  const randomConfetti = () => {
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    
    confetti({
      angle: randomInRange(55, 125),
      spread: randomInRange(50, 70),
      particleCount: randomInRange(50, 100),
      origin: { y: 0.6 }
    });
  };

  const explosionConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  return React.createElement('div', {
    style: {
      padding: '30px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  },
    React.createElement('h2', {
      style: {
        marginBottom: '20px',
        color: '#1f2937'
      }
    }, '🎉 Canvas Confetti Demo'),
    
    React.createElement('p', {
      style: {
        marginBottom: '30px',
        color: '#6b7280'
      }
    }, `Click count: ${clickCount}`),
    
    React.createElement('div', {
      style: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }
    },
      React.createElement('button', {
        onClick: fireConfetti,
        style: {
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        },
        onMouseEnter: (e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
        },
        onMouseLeave: (e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
      }, '🎊 Fire Confetti!'),
      
      React.createElement('button', {
        onClick: randomConfetti,
        style: {
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: '#10b981',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        },
        onMouseEnter: (e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
        },
        onMouseLeave: (e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
      }, '🎲 Random Burst'),
      
      React.createElement('button', {
        onClick: explosionConfetti,
        style: {
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: '#f59e0b',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        },
        onMouseEnter: (e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
        },
        onMouseLeave: (e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
      }, '💥 Explosion!')
    ),
    
    React.createElement('div', {
      style: {
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e0f2fe',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#0369a1',
        textAlign: 'center'
      }
    }, 
      React.createElement('strong', null, '✅ canvas-confetti loaded from NPM via CDN!'),
      React.createElement('br'),
      React.createElement('small', null, 'Using top-level import from cdn.jsdelivr.net')
    )
  );
};

export default ConfettiButton;