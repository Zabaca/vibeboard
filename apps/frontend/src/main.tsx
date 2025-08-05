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
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
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
