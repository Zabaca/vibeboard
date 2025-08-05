// NPM Package Test via ESM CDN
// Tests importing React components from NPM packages via esm.sh

import React, { useState, useEffect } from 'react';
// Import a simple, lightweight React component from NPM
// Using react-spinners with external React resolution disabled
// The ?external=react,react-dom tells esm.sh to use our React/ReactDOM instead of bundling its own
import { ClipLoader, BounceLoader, PulseLoader } from 'https://esm.sh/react-spinners@0.13.8?external=react,react-dom';

const NPMPackageTest = () => {
  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState('#36D7B7');
  const [testResults, setTestResults] = useState({});
  const [loaderType, setLoaderType] = useState('clip');

  useEffect(() => {
    // Test that we successfully imported from NPM
    const results = {
      reactVersion: React.version,
      isSingleton: React === window.React,
      npmImportSuccess: typeof ClipLoader === 'function',
      hasMultipleImports: typeof BounceLoader === 'function' && typeof PulseLoader === 'function',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestResults(results);
    
    // Simulate loading
    setTimeout(() => setLoading(false), 2000);
  }, []);

  const toggleLoading = () => {
    setLoading(!loading);
  };

  const changeColor = () => {
    const colors = ['#36D7B7', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    const currentIndex = colors.indexOf(color);
    const nextIndex = (currentIndex + 1) % colors.length;
    setColor(colors[nextIndex]);
  };

  const cycleLoader = () => {
    const types = ['clip', 'bounce', 'pulse'];
    const currentIndex = types.indexOf(loaderType);
    const nextIndex = (currentIndex + 1) % types.length;
    setLoaderType(types[nextIndex]);
  };

  // Select the appropriate loader
  const LoaderComponent = loaderType === 'clip' ? ClipLoader : 
                         loaderType === 'bounce' ? BounceLoader : 
                         PulseLoader;

  return React.createElement('div', {
    style: {
      padding: '20px',
      border: '2px solid #FF6B6B',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    React.createElement('h2', {
      key: 'title',
      style: { color: '#c92a2a', marginTop: 0 }
    }, '📦 NPM Package Test (via esm.sh)'),
    
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
        'Package: react-spinners'),
      React.createElement('p', { key: 'p1', style: { margin: '5px 0', fontSize: '14px' } }, 
        'Source: https://esm.sh/react-spinners@0.13.8'),
      React.createElement('p', { key: 'p2', style: { margin: '5px 0', fontSize: '14px' } }, 
        'This tests importing React components from NPM packages')
    ]),

    // Loader demo
    React.createElement('div', {
      key: 'loader-demo',
      style: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '4px',
        marginBottom: '15px',
        textAlign: 'center',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, [
      loading ? 
        React.createElement(LoaderComponent, {
          key: 'loader',
          color: color,
          loading: loading,
          size: loaderType === 'pulse' ? 15 : 50
        }) :
        React.createElement('p', {
          key: 'loaded',
          style: { 
            fontSize: '18px', 
            color: '#2b8a3e',
            fontWeight: 'bold'
          }
        }, '✅ Content Loaded!'),
      
      React.createElement('p', {
        key: 'loader-type',
        style: { 
          marginTop: '10px',
          fontSize: '14px',
          color: '#666'
        }
      }, `Loader type: ${loaderType}`)
    ]),

    // Controls
    React.createElement('div', {
      key: 'controls',
      style: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }
    }, [
      React.createElement('button', {
        key: 'toggle',
        onClick: toggleLoading,
        style: {
          padding: '8px 16px',
          backgroundColor: '#FF6B6B',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, loading ? 'Stop Loading' : 'Start Loading'),
      
      React.createElement('button', {
        key: 'color',
        onClick: changeColor,
        style: {
          padding: '8px 16px',
          backgroundColor: color,
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Change Color'),

      React.createElement('button', {
        key: 'type',
        onClick: cycleLoader,
        style: {
          padding: '8px 16px',
          backgroundColor: '#4ECDC4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Change Loader Type')
    ])
  ]);
};

export default NPMPackageTest;