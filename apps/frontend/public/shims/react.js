/**
 * React Singleton Shim
 * This module exports the app's React instance to ensure all ESM components
 * use the same React instance, preventing hooks errors.
 */

// Get React from the window object (set by the main app)
const React = window.React;

if (!React) {
  throw new Error(
    'React singleton shim: window.React is not available. ' +
    'Make sure React is loaded and assigned to window.React before importing this shim.'
  );
}

// Default export
export default React;

// Named exports - all React APIs
export const {
  // Core exports
  Fragment,
  StrictMode,
  Profiler,
  Suspense,
  
  // Hooks
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useDebugValue,
  useDeferredValue,
  useTransition,
  useId,
  
  // React 18+ hooks
  useSyncExternalStore,
  useInsertionEffect,
  
  // Component APIs
  Component,
  PureComponent,
  memo,
  
  // Element creation
  createElement,
  cloneElement,
  isValidElement,
  
  // Children utilities
  Children,
  
  // Context
  createContext,
  
  // Refs
  createRef,
  forwardRef,
  
  // Lazy loading
  lazy,
  
  // Portals
  createPortal,
  
  // Other APIs
  version,
  
  // React 18+ APIs
  startTransition,
  
  // Types (for completeness, though they're TypeScript-only)
  // These won't actually be available at runtime but included for reference
} = React;

// Additional check for critical APIs
if (!React.useState || !React.useEffect) {
  console.warn('React singleton shim: Some React hooks may not be available');
}

// Log success in development
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
  console.log('✅ React singleton shim loaded successfully');
}