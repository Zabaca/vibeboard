# Import Maps Architecture

## Overview

This document describes the React singleton pattern implementation using native browser import maps in the AI Whiteboard POC. The solution ensures that all ESM modules use the same React instance, preventing "Invalid Hook Call" errors that occur when multiple React instances exist.

## Architecture

### Core Components

#### 1. Import Map Configuration (`index.html`)
```html
<script type="importmap">
{
  "imports": {
    "react": "/shims/react.js",
    "react-dom": "/shims/react-dom.js",
    "react-dom/client": "/shims/react-dom.js",
    "react/jsx-runtime": "/shims/react-jsx-runtime.js"
  }
}
</script>
```

The import map redirects all React imports to local shim modules that export the application's React instance.

#### 2. React Singleton Shims

**`/public/shims/react.js`**
```javascript
const React = window.React;
export default React;
export const { useState, useEffect, /* ... all React exports */ } = React;
```

**`/public/shims/react-dom.js`**
```javascript
const ReactDOM = window.ReactDOM;
export default ReactDOM;
export const { createRoot, render, /* ... all ReactDOM exports */ } = ReactDOM;
```

**`/public/shims/react-jsx-runtime.js`**
```javascript
const React = window.React;
export const jsx = React.jsx;
export const jsxs = React.jsxs;
export const Fragment = React.Fragment;
```

#### 3. Window Assignment (`src/main.tsx`)
```typescript
// Make React available globally for the shims
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
}
```

This is required for the shims to access the application's React instance.

## How It Works

### Flow Diagram
```
1. App starts → React/ReactDOM assigned to window
       ↓
2. ESM module imports React → Import map intercepts
       ↓
3. Import map redirects → Loads shim module
       ↓
4. Shim module → Returns window.React (singleton)
       ↓
5. All modules → Use same React instance ✅
```

### Example: ESM Component Loading

**Component with standard imports:**
```javascript
import React, { useState, useEffect } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);
  // Works! Uses the app's React instance via import maps
  return <div>Count: {count}</div>;
}
```

**What happens behind the scenes:**
1. Browser sees `import React from 'react'`
2. Import map redirects to `/shims/react.js`
3. Shim returns `window.React` (the app's instance)
4. Component uses singleton React - no conflicts!

## Benefits

### ✅ Solved Problems
- **No more "Invalid Hook Call" errors** - All modules use the same React
- **Standard ESM imports work** - No need for `window.React` workarounds
- **NPM packages via CDN work** - esm.sh, unpkg, skypack all compatible
- **Bit.dev components supported** - External component libraries work

### ✅ Technical Advantages
- **Native browser feature** - No polyfills needed (88% browser support)
- **Zero runtime overhead** - Import maps are resolved at module load time
- **Clean code** - Components use standard `import` statements
- **Future-proof** - Aligns with web standards

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 89+ | ✅ |
| Firefox | 108+ | ✅ |
| Safari | 16.4+ | ✅ |
| Edge | 89+ | ✅ |

**Total Coverage:** ~88% of global users (as of 2025)

## Testing

### Test Components Available

Located in `/public/test-components/`:
- `standard-esm-component.js` - Basic component with hooks
- `hooks-test-component.js` - Tests all React hooks
- `nested-component.js` - Parent/child relationships
- `npm-esm-test.js` - NPM package imports
- `external-clock.js` - Digital clock with useEffect
- `weather-card.js` - Interactive weather simulator
- `task-board.js` - Todo list with state management

### Testing Checklist
```markdown
- [ ] Standard imports resolve correctly
- [ ] Hooks work without errors
- [ ] Multiple components share React instance
- [ ] NPM packages load via CDN
- [ ] No console warnings about React versions
- [ ] Performance comparable to bundled approach
```

## Known Issues

### URL Import Compilation Issue
**Problem:** ES modules imported via URL in the main canvas still go through the compilation pipeline, causing "Cannot use import statement outside a module" errors.

**Root Cause:** The URLImportService fetches modules as text and attempts to compile them, rather than using dynamic `import()`.

**Workaround:** Use the ESMTestComponent for testing URL imports, or load components via AI generation.

**Future Fix:** Restructure URL import to distinguish between:
- ES modules → Use dynamic `import()`
- Source code → Compile with Babel

## Migration Guide

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for instructions on converting existing components.

## Configuration Files

### Required Files
- `/index.html` - Import map configuration
- `/public/shims/react.js` - React singleton shim
- `/public/shims/react-dom.js` - ReactDOM singleton shim  
- `/public/shims/react-jsx-runtime.js` - JSX runtime shim
- `/src/main.tsx` - Window assignments

### Vite Configuration
No special Vite configuration required. Import maps work in both development and production builds.

## Troubleshooting

### Issue: "window.React is not available"
**Solution:** Ensure `main.tsx` assigns React to window before any imports

### Issue: "Invalid Hook Call" still appears
**Solution:** Check that import maps are properly configured in `index.html`

### Issue: Component not loading
**Solution:** Verify the component uses standard ES module exports

### Issue: TypeScript errors with imports
**Solution:** TypeScript understands import maps - ensure `tsconfig.json` has proper module resolution

## References

- [Import Maps Specification](https://github.com/WICG/import-maps)
- [MDN Import Maps Documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)
- [Can I Use Import Maps](https://caniuse.com/import-maps)
- [React ESM Builds](https://react.dev/learn/add-react-to-an-existing-project#add-react-to-your-page)