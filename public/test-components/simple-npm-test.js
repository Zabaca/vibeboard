// Simple NPM Test Component
// Tests a basic utility library that doesn't have complex React dependencies

import React, { useState, useEffect } from 'react';

// Test with a simple utility that works with React but doesn't bundle its own React
// Using clsx for className utilities - it's simple and widely used
import clsx from 'https://esm.sh/clsx@2.0.0';

const SimpleNPMTest = () => {
  const [isActive, setIsActive] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [dynamicClasses, setDynamicClasses] = useState('');

  useEffect(() => {
    // Test that we successfully imported from NPM
    const results = {
      reactVersion: React.version,
      isSingleton: React === window.React,
      clsxImported: typeof clsx === 'function',
      importSource: 'esm.sh CDN',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestResults(results);
    
    // Test clsx functionality
    updateClasses(isActive, isHighlighted);
  }, []);

  useEffect(() => {
    updateClasses(isActive, isHighlighted);
  }, [isActive, isHighlighted]);

  const updateClasses = (active, highlighted) => {
    // Use clsx to combine classes conditionally
    const classes = clsx(
      'base-class',
      {
        'active': active,
        'highlighted': highlighted,
        'inactive': !active
      },
      active && highlighted && 'super-special'
    );
    setDynamicClasses(classes);
  };

  const toggleActive = () => setIsActive(!isActive);
  const toggleHighlight = () => setIsHighlighted(!isHighlighted);

  // Inline styles based on state
  const boxStyle = {
    padding: '20px',
    margin: '10px 0',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    backgroundColor: isActive ? (isHighlighted ? '#FFD700' : '#90EE90') : '#f0f0f0',
    border: `3px solid ${isActive ? '#4CAF50' : '#ccc'}`,
    transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isHighlighted ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
  };

  return React.createElement('div', {
    style: {
      padding: '20px',
      border: '2px solid #2196F3',
      borderRadius: '8px',
      backgroundColor: '#f0f9ff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    React.createElement('h2', {
      key: 'title',
      style: { color: '#1565C0', marginTop: 0 }
    }, '📦 Simple NPM Package Test (clsx)'),
    
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

    // Package info
    React.createElement('div', {
      key: 'info',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px'
      }
    }, [
      React.createElement('h4', { key: 'h4', style: { margin: '0 0 5px 0' } }, 
        'Package: clsx (className utility)'),
      React.createElement('p', { key: 'p1', style: { margin: '5px 0', fontSize: '14px' } }, 
        'Source: https://esm.sh/clsx@2.0.0'),
      React.createElement('p', { key: 'p2', style: { margin: '5px 0', fontSize: '14px' } }, 
        'A tiny utility for constructing className strings conditionally')
    ]),

    // Interactive demo
    React.createElement('div', {
      key: 'demo',
      style: boxStyle
    }, [
      React.createElement('h4', { key: 'h4', style: { margin: '0 0 10px 0' } }, 
        'Interactive Demo Box'),
      React.createElement('p', { key: 'state', style: { margin: '5px 0' } }, 
        `Active: ${isActive ? '✅' : '❌'} | Highlighted: ${isHighlighted ? '✅' : '❌'}`),
      React.createElement('p', { key: 'classes', style: { 
        margin: '5px 0',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: '#f5f5f5',
        padding: '5px',
        borderRadius: '3px'
      }}, `Classes: "${dynamicClasses}"`)
    ]),

    // Controls
    React.createElement('div', {
      key: 'controls',
      style: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: '15px'
      }
    }, [
      React.createElement('button', {
        key: 'active',
        onClick: toggleActive,
        style: {
          padding: '8px 16px',
          backgroundColor: isActive ? '#4CAF50' : '#9E9E9E',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }
      }, isActive ? 'Deactivate' : 'Activate'),
      
      React.createElement('button', {
        key: 'highlight',
        onClick: toggleHighlight,
        style: {
          padding: '8px 16px',
          backgroundColor: isHighlighted ? '#FFD700' : '#9E9E9E',
          color: isHighlighted ? '#333' : 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }
      }, isHighlighted ? 'Remove Highlight' : 'Add Highlight')
    ]),

    // Explanation
    React.createElement('div', {
      key: 'explanation',
      style: {
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#E3F2FD',
        borderRadius: '4px',
        fontSize: '13px'
      }
    }, [
      React.createElement('strong', { key: 'strong' }, 'How this works:'),
      React.createElement('ul', { key: 'ul', style: { margin: '5px 0', paddingLeft: '20px' } }, [
        React.createElement('li', { key: 'li1' }, 
          'React is imported using standard ESM syntax'),
        React.createElement('li', { key: 'li2' }, 
          'clsx is imported from esm.sh (NPM package)'),
        React.createElement('li', { key: 'li3' }, 
          'Import maps ensure React is a singleton'),
        React.createElement('li', { key: 'li4' }, 
          'The utility library works with our React instance')
      ])
    ])
  ]);
};

export default SimpleNPMTest;