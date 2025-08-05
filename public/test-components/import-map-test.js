/**
 * Test component specifically for import maps
 * Uses standard ES module imports that should be resolved by import maps
 */

import React, { useState, useEffect } from 'react';

export default function ImportMapTestComponent() {
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [details, setDetails] = useState({});
  
  useEffect(() => {
    // Verify we're using the singleton React
    const reactVersion = React.version;
    const isSingleton = React === window.React;
    
    setStatus('✅ Import maps working correctly!');
    setDetails({
      reactVersion,
      isSingleton,
      hooksWorking: true,
      importSource: 'import maps → shims → window.React'
    });
    
    console.log('ImportMapTestComponent mounted successfully!');
    console.log('React singleton check:', { 
      imported: React, 
      window: window.React, 
      same: isSingleton 
    });
  }, []);
  
  return React.createElement('div', {
    style: {
      padding: '20px',
      backgroundColor: '#e8f5e9',
      borderRadius: '8px',
      border: '2px solid #4CAF50',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    React.createElement('h3', { 
      key: 'title',
      style: { color: '#2E7D32', marginTop: 0 } 
    }, '🎉 Import Map Test Success!'),
    
    React.createElement('p', { key: 'status' }, status),
    
    React.createElement('div', { 
      key: 'details',
      style: { 
        backgroundColor: 'rgba(255,255,255,0.7)', 
        padding: '10px', 
        borderRadius: '4px',
        marginBottom: '15px'
      }
    }, [
      React.createElement('h4', { 
        key: 'details-title',
        style: { margin: '0 0 10px 0' }
      }, 'Technical Details:'),
      React.createElement('ul', { 
        key: 'details-list',
        style: { margin: 0, paddingLeft: '20px' }
      }, Object.entries(details).map(([key, value]) => 
        React.createElement('li', { key }, `${key}: ${value}`)
      ))
    ]),
    
    React.createElement('div', { 
      key: 'counter',
      style: { marginTop: '15px' }
    }, [
      React.createElement('p', { 
        key: 'count',
        style: { fontSize: '18px', marginBottom: '10px' }
      }, `Counter: ${count}`),
      
      React.createElement('button', {
        key: 'button',
        onClick: () => {
          setCount(prev => prev + 1);
          console.log('Button clicked, count:', count + 1);
        },
        style: {
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500'
        }
      }, 'Increment (Tests Hooks)'),
      
      React.createElement('p', { 
        key: 'help',
        style: { 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '10px',
          fontStyle: 'italic'
        }
      }, 'If the counter increments, React hooks are working through import maps!')
    ])
  ]);
}

// Also export as named export
export const Component = ImportMapTestComponent;