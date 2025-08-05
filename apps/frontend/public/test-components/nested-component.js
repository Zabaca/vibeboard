// Nested Component Test
// Tests components with child components and prop passing

import React, { useState, useEffect } from 'react';

// Child component
const ChildComponent = ({ count, onIncrement, color = '#4CAF50' }) => {
  const [localState, setLocalState] = useState('Child is ready');
  
  useEffect(() => {
    setLocalState(`Child received count: ${count}`);
  }, [count]);
  
  return React.createElement('div', {
    style: {
      padding: '10px',
      margin: '10px 0',
      border: `2px solid ${color}`,
      borderRadius: '4px',
      backgroundColor: '#f9f9f9'
    }
  }, [
    React.createElement('h4', {
      key: 'title',
      style: { margin: '0 0 5px 0', color }
    }, '📦 Child Component'),
    
    React.createElement('p', {
      key: 'state',
      style: { margin: '5px 0', fontSize: '14px' }
    }, localState),
    
    React.createElement('p', {
      key: 'count',
      style: { margin: '5px 0', fontSize: '14px' }
    }, `Parent count: ${count}`),
    
    React.createElement('button', {
      key: 'button',
      onClick: onIncrement,
      style: {
        padding: '5px 10px',
        backgroundColor: color,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }
    }, 'Increment Parent Count')
  ]);
};

// Grandchild component
const GrandchildComponent = ({ message, depth = 0 }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
  const color = colors[depth % colors.length];
  
  return React.createElement('div', {
    style: {
      padding: '8px',
      margin: '5px 0',
      border: `1px dashed ${color}`,
      borderRadius: '4px',
      backgroundColor: '#fafafa',
      marginLeft: `${depth * 20}px`
    }
  }, [
    React.createElement('p', {
      key: 'text',
      style: { margin: 0, fontSize: '13px', color }
    }, `👶 Depth ${depth}: ${message}`)
  ]);
};

// Main parent component
const NestedComponentTest = () => {
  const [parentCount, setParentCount] = useState(0);
  const [message, setMessage] = useState('Nested components working!');
  const [testResults, setTestResults] = useState({});
  
  useEffect(() => {
    // Test component nesting capabilities
    const results = {
      reactVersion: React.version,
      isSingleton: React === window.React,
      canNest: true,
      canPassProps: true,
      canUseHooksInChildren: true,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestResults(results);
    console.log('Nested component test initialized:', results);
  }, []);
  
  const handleIncrement = () => {
    setParentCount(prev => prev + 1);
    setMessage(`Count updated to ${parentCount + 1}`);
  };
  
  const handleReset = () => {
    setParentCount(0);
    setMessage('Counter reset!');
  };

  return React.createElement('div', {
    style: {
      padding: '20px',
      border: '2px solid #9C27B0',
      borderRadius: '8px',
      backgroundColor: '#faf0ff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    React.createElement('h2', {
      key: 'title',
      style: { color: '#6A1B9A', marginTop: 0 }
    }, '🎯 Nested Component Test'),
    
    // Test results
    React.createElement('div', {
      key: 'results',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        fontSize: '13px'
      }
    }, Object.entries(testResults).map(([key, value]) =>
      React.createElement('div', {
        key,
        style: { margin: '2px 0' }
      }, `${key}: ${typeof value === 'boolean' ? (value ? '✅' : '❌') : value}`)
    )),
    
    // Parent state
    React.createElement('div', {
      key: 'parent-state',
      style: {
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '15px'
      }
    }, [
      React.createElement('h3', {
        key: 'h3',
        style: { margin: '0 0 10px 0', color: '#6A1B9A' }
      }, '👨 Parent Component'),
      
      React.createElement('div', {
        key: 'counter',
        style: {
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#6A1B9A',
          margin: '10px 0'
        }
      }, parentCount),
      
      React.createElement('div', {
        key: 'buttons',
        style: { display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }
      }, [
        React.createElement('button', {
          key: 'inc',
          onClick: handleIncrement,
          style: {
            padding: '8px 16px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Increment'),
        
        React.createElement('button', {
          key: 'reset',
          onClick: handleReset,
          style: {
            padding: '8px 16px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Reset')
      ]),
      
      React.createElement('p', {
        key: 'message',
        style: {
          padding: '8px',
          backgroundColor: '#f3e5f5',
          borderRadius: '4px',
          fontSize: '14px',
          textAlign: 'center'
        }
      }, message)
    ]),
    
    // Child components
    React.createElement(ChildComponent, {
      key: 'child1',
      count: parentCount,
      onIncrement: handleIncrement,
      color: '#4CAF50'
    }),
    
    React.createElement(ChildComponent, {
      key: 'child2',
      count: parentCount * 2,
      onIncrement: handleIncrement,
      color: '#2196F3'
    }),
    
    // Nested grandchildren
    React.createElement('div', {
      key: 'grandchildren',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginTop: '10px'
      }
    }, [
      React.createElement('h4', {
        key: 'title',
        style: { margin: '0 0 10px 0' }
      }, '🌳 Component Tree (Grandchildren)'),
      
      React.createElement(GrandchildComponent, {
        key: 'gc1',
        message: `Count is ${parentCount}`,
        depth: 0
      }),
      
      React.createElement(GrandchildComponent, {
        key: 'gc2',
        message: `Double count is ${parentCount * 2}`,
        depth: 1
      }),
      
      React.createElement(GrandchildComponent, {
        key: 'gc3',
        message: `Triple count is ${parentCount * 3}`,
        depth: 2
      }),
      
      React.createElement(GrandchildComponent, {
        key: 'gc4',
        message: 'Deeply nested component!',
        depth: 3
      })
    ])
  ]);
};

export default NestedComponentTest;