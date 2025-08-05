// Standard ESM Component Test
// This component uses standard ES module imports to test import maps

import React, { useState, useEffect } from 'react';

const StandardESMComponent = () => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [reactInfo, setReactInfo] = useState({});

  useEffect(() => {
    // Verify React singleton
    const isSingleton = React === window.React;
    
    setReactInfo({
      version: React.version,
      isSingleton,
      hasHooks: typeof useState === 'function',
      hasEffects: typeof useEffect === 'function',
      importSource: 'Standard ESM import'
    });

    setMessage(`Component loaded successfully! React ${React.version}`);
  }, []);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
    setMessage(`Count updated to ${count + 1}`);
  };

  const handleDecrement = () => {
    setCount(prev => prev - 1);
    setMessage(`Count updated to ${count - 1}`);
  };

  return React.createElement('div', {
    style: {
      padding: '20px',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      backgroundColor: '#f0f8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    React.createElement('h2', {
      key: 'title',
      style: { color: '#2E7D32', marginTop: 0 }
    }, '✅ Standard ESM Component'),
    
    React.createElement('div', {
      key: 'info',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        fontSize: '14px'
      }
    }, [
      React.createElement('p', { key: 'p1', style: { margin: '5px 0' } }, 
        `📦 Import Type: ${reactInfo.importSource}`),
      React.createElement('p', { key: 'p2', style: { margin: '5px 0' } }, 
        `🔧 React Version: ${reactInfo.version || 'Loading...'}`),
      React.createElement('p', { key: 'p3', style: { margin: '5px 0' } }, 
        `🔗 Singleton: ${reactInfo.isSingleton ? '✅ Yes' : '❌ No'}`),
      React.createElement('p', { key: 'p4', style: { margin: '5px 0' } }, 
        `🪝 Hooks Available: ${reactInfo.hasHooks ? '✅ Yes' : '❌ No'}`)
    ]),

    React.createElement('div', {
      key: 'counter',
      style: {
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '15px',
        textAlign: 'center'
      }
    }, [
      React.createElement('h3', { 
        key: 'counter-title',
        style: { margin: '0 0 10px 0', color: '#1976D2' }
      }, 'Interactive Counter'),
      
      React.createElement('div', {
        key: 'counter-display',
        style: {
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#2E7D32',
          margin: '10px 0'
        }
      }, count),

      React.createElement('div', {
        key: 'buttons',
        style: { display: 'flex', gap: '10px', justifyContent: 'center' }
      }, [
        React.createElement('button', {
          key: 'dec',
          onClick: handleDecrement,
          style: {
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, '−'),
        
        React.createElement('button', {
          key: 'inc',
          onClick: handleIncrement,
          style: {
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, '+')
      ])
    ]),

    message && React.createElement('div', {
      key: 'message',
      style: {
        padding: '10px',
        backgroundColor: '#E8F5E9',
        borderRadius: '4px',
        color: '#2E7D32',
        fontSize: '14px'
      }
    }, message)
  ]);
};

export default StandardESMComponent;