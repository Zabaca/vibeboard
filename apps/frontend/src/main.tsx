import React, { StrictMode } from 'react';
import ReactDOM, { createRoot } from 'react-dom/client';
import './index.css';
import './styles/prism-overrides.css';
import App from './App.tsx';

// Make React and ReactDOM available globally for ESM modules
// This is required for the singleton shims to work - the shims export window.React
// to ensure all ESM modules use the same React instance as the main app
// Extend the Window interface to include React and ReactDOM
declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOM;
  }
}

if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = ReactDOM;
  console.log('✅ React and ReactDOM set on window object for singleton shims');
  
  // Global error handler for AI-generated component cleanup errors
  window.addEventListener('error', (event) => {
    // Check if this is likely a cleanup error from AI-generated components
    if (event.error?.message?.includes('removeChild') || 
        event.error?.message?.includes('Cannot read properties of null')) {
      console.warn('🔧 AI Component cleanup error caught and handled:', event.error.message);
      
      // Prevent the error from bubbling up and crashing the app
      event.preventDefault();
      event.stopPropagation();
      
      // Optional: Track these errors for debugging
      if (import.meta.env.DEV) {
        console.groupCollapsed('🐛 Component Cleanup Error Details');
        console.error('Error:', event.error);
        console.trace('Stack trace');
        console.groupEnd();
      }
      
      return false; // Prevent default error handling
    }
  });
  
  // Also handle unhandled promise rejections from AI components
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('removeChild') ||
        event.reason?.message?.includes('Cannot read properties of null')) {
      console.warn('🔧 AI Component async cleanup error caught:', event.reason.message);
      event.preventDefault();
      return false;
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
