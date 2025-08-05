/**
 * React JSX Runtime Singleton Shim
 * This module exports the JSX runtime functions from the app's React instance
 * to support the automatic JSX transform.
 */

// Get React from the window object
const React = window.React;

if (!React) {
  throw new Error(
    'React JSX runtime shim: window.React is not available. ' +
    'Make sure React is loaded and assigned to window.React before importing this shim.'
  );
}

// JSX Runtime exports for automatic runtime
// These are used when JSX is compiled with the new transform

// The jsx function for creating elements
export function jsx(type, props, key) {
  if (key !== undefined) {
    return React.createElement(type, { ...props, key });
  }
  return React.createElement(type, props);
}

// The jsxs function for creating elements with multiple children
export function jsxs(type, props, key) {
  if (key !== undefined) {
    return React.createElement(type, { ...props, key });
  }
  return React.createElement(type, props);
}

// The jsxDEV function for development mode (includes source location info)
export function jsxDEV(type, props, key, isStaticChildren, source, self) {
  // In production, jsxDEV is the same as jsx/jsxs
  // The additional parameters are ignored
  if (key !== undefined) {
    return React.createElement(type, { ...props, key });
  }
  return React.createElement(type, props);
}

// Export Fragment from React
export const Fragment = React.Fragment;

// Log success in development
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
  console.log('✅ React JSX runtime shim loaded successfully');
}