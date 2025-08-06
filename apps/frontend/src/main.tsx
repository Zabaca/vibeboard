import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import ReactDOM from 'react-dom/client';
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
