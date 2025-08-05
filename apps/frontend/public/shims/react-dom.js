/**
 * ReactDOM Singleton Shim
 * This module exports the app's ReactDOM instance to ensure all ESM components
 * use the same ReactDOM instance.
 */

// Get ReactDOM from the window object (set by the main app)
const ReactDOM = window.ReactDOM;

if (!ReactDOM) {
  throw new Error(
    'ReactDOM singleton shim: window.ReactDOM is not available. ' +
    'Make sure ReactDOM is loaded and assigned to window.ReactDOM before importing this shim.'
  );
}

// Default export
export default ReactDOM;

// Named exports - ReactDOM APIs
export const {
  // React 18+ Client APIs
  createRoot,
  hydrateRoot,
  
  // Legacy APIs (React 17 and below)
  render,
  hydrate,
  unmountComponentAtNode,
  
  // Portal API
  createPortal,
  
  // Other APIs
  findDOMNode,
  flushSync,
  
  // React 18+ APIs
  unstable_batchedUpdates,
  unstable_renderSubtreeIntoContainer,
  
  // Version
  version,
} = ReactDOM;

// Re-export client APIs for react-dom/client imports
export const client = {
  createRoot: ReactDOM.createRoot,
  hydrateRoot: ReactDOM.hydrateRoot,
};

// Additional check for critical APIs
if (!ReactDOM.createRoot && !ReactDOM.render) {
  console.warn('ReactDOM singleton shim: Neither createRoot nor render API is available');
}

// Log success in development
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
  console.log('✅ ReactDOM singleton shim loaded successfully');
}