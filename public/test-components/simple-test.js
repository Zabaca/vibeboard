/**
 * Simple test component using standard ESM imports
 * This tests that our React singleton shims work correctly
 */

// Standard import that will be resolved by import maps
import React, { useState, useEffect } from 'react';

// Test component using hooks
export default function SimpleTestComponent() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Testing React singleton...');
  
  useEffect(() => {
    setMessage(`Component mounted! React version: ${React.version}`);
    console.log('✅ SimpleTestComponent mounted successfully with hooks working!');
  }, []);
  
  const handleClick = () => {
    setCount(prev => prev + 1);
    console.log(`Button clicked! Count: ${count + 1}`);
  };
  
  return React.createElement('div', {
    style: {
      padding: '20px',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      backgroundColor: '#f0f8f0',
      fontFamily: 'Arial, sans-serif'
    }
  }, [
    React.createElement('h3', { key: 'title', style: { color: '#2E7D32' } }, 
      'React Singleton Test Component'),
    React.createElement('p', { key: 'message' }, message),
    React.createElement('p', { key: 'count' }, `Count: ${count}`),
    React.createElement('button', {
      key: 'button',
      onClick: handleClick,
      style: {
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      }
    }, 'Increment Count'),
    React.createElement('p', { 
      key: 'status',
      style: { fontSize: '12px', color: '#666', marginTop: '10px' }
    }, 'If you can click the button and see the count increase, hooks are working!')
  ]);
}

// Also export as named export for testing
export const Component = SimpleTestComponent;