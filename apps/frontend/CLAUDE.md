# AI Whiteboard POC - Developer Guide

## Overview

An advanced React component playground that combines AI generation (Cerebras), visual canvas manipulation (React Flow), and native ES module execution. The project has evolved from the original Excalidraw-based design to an ESM-first architecture with import maps for React singleton management.

## Current Architecture

### Core Stack
- **React 19** with TypeScript
- **React Flow** (@xyflow/react) - Replaced Excalidraw for better component integration
- **Cerebras AI** - Fast component generation using Llama models
- **Babel Standalone** - Runtime JSX transpilation
- **Native Import Maps** - Browser-native module resolution
- **Vite** - Development and build tooling

### Key Design Decisions

#### 1. ESM-First Architecture
The entire system is built around ES modules:
- All components are ES modules with standard `import`/`export` syntax
- Direct CDN imports work without bundling (esm.sh, unpkg, skypack)
- Native browser import maps handle module resolution
- No UMD or CommonJS support needed

#### 2. React Singleton Pattern
Solved the "Invalid Hook Call" error permanently:
```javascript
// Import map in index.html redirects all React imports
"imports": {
  "react": "/shims/react.js",
  "react-dom": "/shims/react-dom.js",
  "react/jsx-runtime": "/shims/react-jsx-runtime.js"
}

// Shims return window.React (the app's instance)
export default window.React;
```

#### 3. Component Pipeline
Unified processing system for all component sources:
- **AI-generated**: Cerebras API → Import fixing → JSX transpilation → Execution
- **Library**: Pre-built code → Compilation cache → Direct execution
- **URL import**: Fetch → Format detection → Processing → Caching
- **Pre-compiled**: Skip transpilation for performance

## Project Structure

```
apps/ai-whiteboard-poc/
├── public/
│   ├── shims/                    # React singleton shims
│   │   ├── react.js             # Exports window.React
│   │   ├── react-dom.js         # Exports window.ReactDOM
│   │   └── react-jsx-runtime.js # JSX runtime shim
│   ├── components/              # Pre-built library components
│   └── test-components/         # ESM test components
├── src/
│   ├── components/
│   │   ├── ReactFlowCanvas.tsx     # Main canvas controller
│   │   ├── ComponentNode.tsx       # React Flow custom node
│   │   ├── GeneratedApp.tsx        # Component executor
│   │   ├── GenerationDialog.tsx    # AI prompt interface
│   │   ├── ComponentLibrary.tsx    # Pre-built browser
│   │   ├── ImportFromURLDialog.tsx # URL import UI
│   │   └── ESMTestComponent.tsx    # ESM testing tool
│   ├── services/
│   │   ├── ComponentPipeline.ts    # Unified processor
│   │   ├── cerebras.ts            # AI service
│   │   ├── URLImportService.ts    # URL fetcher
│   │   └── StorageService.ts      # Persistence layer
│   ├── utils/
│   │   ├── esmExecutor.ts         # ESM module executor
│   │   ├── esmJsxTranspiler.ts   # JSX → JS compiler
│   │   ├── importFixer.ts         # Auto-import React hooks
│   │   └── cdnModuleLoader.ts     # CDN import handler
│   ├── types/
│   │   └── component.types.ts     # Unified type system
│   └── data/
│       ├── prebuiltComponents.ts  # Library definitions
│       └── compiledComponents.ts  # Pre-compiled cache
```

## Component Flow

### 1. AI Generation Flow
```
User Prompt → Cerebras API → Raw JSX Code
    ↓
Import Fixer (adds missing React imports)
    ↓
ESM Wrapper (converts to ES module if needed)
    ↓
JSX Transpiler (Babel: JSX → JS)
    ↓
Blob URL Creation
    ↓
Dynamic Import → React Component
```

### 2. URL Import Flow
```
URL Input → Fetch Module
    ↓
Format Detection (ESM/JSX/Compiled)
    ↓
[If JSX] → Transpilation
[If ESM] → Direct Use
    ↓
Module Execution → Component
```

### 3. Library Component Flow
```
Pre-built Component → Check Compiled Cache
    ↓
[If Cached] → Use Compiled Version
[If Not] → Runtime Compilation
    ↓
Add to Canvas
```

## Key Components

### ReactFlowCanvas.tsx
The main orchestrator that:
- Manages all nodes and their positions
- Handles component generation workflow
- Implements presentation mode
- Manages persistence and export/import
- Provides UI controls and keyboard shortcuts

### ComponentPipeline.ts
Unified processing service that:
- Detects component format (JSX/ESM/TSX)
- Manages compilation cache
- Handles all transpilation
- Fixes missing imports automatically
- Provides performance metrics

### GeneratedApp.tsx
The component executor that:
- Creates safe execution context
- Handles runtime errors gracefully
- Manages component lifecycle
- Provides loading states
- Shows detailed error messages

### ESMJsxTranspiler.ts
Specialized transpiler that:
- Preserves ES module structure
- Transpiles only JSX syntax
- Maintains import/export statements
- Optimizes for performance

### StorageService.ts
Persistence layer that:
- Auto-saves to localStorage
- Implements size limits and cleanup
- Handles export/import
- Manages storage optimization
- Schedules automatic cleanup

## Component Data Structure

```typescript
interface UnifiedComponentNode {
  // Identity
  id: string;
  name?: string;
  description?: string;
  
  // Code
  originalCode: string;      // Source JSX/TSX
  compiledCode?: string;     // Transpiled JS
  
  // Hashing
  originalHash?: string;     // For change detection
  compiledHash?: string;     // For cache validation
  
  // Source info
  source: 'ai-generated' | 'library' | 'url-import';
  sourceUrl?: string;
  moduleUrl?: string;        // Blob URL for execution
  
  // Metadata
  compiledAt?: number;
  compilerVersion?: string;
  metrics?: {
    compilationTime?: number;
    dependencies?: string[];
  };
}
```

## Import Maps Implementation

### How It Works
1. App starts → React/ReactDOM assigned to `window`
2. Component imports React → Import map intercepts
3. Import map redirects → Loads shim module
4. Shim returns `window.React` → Same instance everywhere

### Benefits
- Standard ES module imports work everywhere
- No more "Invalid Hook Call" errors
- NPM packages via CDN work correctly
- Clean, standard component code

### Browser Support
- Chrome 89+, Firefox 108+, Safari 16.4+, Edge 89+
- ~88% global browser coverage

## Performance Optimizations

### 1. Pre-compilation
- Library components compiled at build time
- Cached in `compiledComponents.generated.ts`
- Skip transpilation for instant loading

### 2. Smart Caching
- Hash-based change detection
- LRU cache with size limits
- Persistent cache in localStorage
- Background cache warming

### 3. Lazy Loading
- Components loaded on-demand
- Blob URLs created only when needed
- Automatic cleanup of unused URLs

### 4. Optimized Transpilation
- Minimal Babel configuration
- JSX-only transformation
- No polyfills or helpers

## Testing Components

### ESM Test Component
Located at `/src/components/ESMTestComponent.tsx`:
- Test import map functionality
- Verify hook behavior
- Check CDN imports
- Debug module loading

### Test Components
In `/public/test-components/`:
- `standard-esm-component.js` - Basic hooks
- `npm-esm-test.js` - NPM package imports
- `task-board.js` - Complex state management
- `weather-card.js` - Interactive demo

## Common Issues & Solutions

### 1. Multiple React Instances
**Symptom**: "Invalid Hook Call" error
**Solution**: Import maps automatically handle this

### 2. Import Statement Errors
**Symptom**: "Cannot use import statement outside a module"
**Solution**: Component Pipeline converts to proper ESM

### 3. Missing Hook Imports
**Symptom**: "useState is not defined"
**Solution**: ImportFixer automatically adds missing imports

### 4. CDN CORS Issues
**Symptom**: Network errors on import
**Solution**: Use `?external=react` parameter on CDN URLs

### 5. Storage Full
**Symptom**: Components not saving
**Solution**: Use cleanup button or export/clear/import

## Development Workflow

### Adding New Features
1. Test with ESMTestComponent first
2. Update ComponentPipeline if needed
3. Add to prebuiltComponents for library
4. Update types in component.types.ts

### Debugging
1. Enable debug mode in ComponentPipeline
2. Check browser console for module URLs
3. Use React DevTools for component tree
4. Check Network tab for CDN imports

### Performance Testing
1. Use Performance tab in DevTools
2. Check ComponentPipeline.getPerformanceStats()
3. Monitor localStorage usage
4. Test with 10+ components

## Future Enhancements

### Planned
- WebContainer API for full dev environment
- Collaborative editing with WebRTC
- Git integration for version control
- TypeScript support in editor
- Component marketplace

### Experimental
- Web Workers for transpilation
- WASM-based Babel for speed
- Service Worker caching
- Offline mode support

## Security Considerations

- Components run in same context (no sandboxing)
- AI-generated code is not validated
- URL imports could be malicious
- Use trusted CDNs only
- Implement CSP headers in production

## Deployment Notes

### Netlify Configuration
- Edge Functions for API proxy
- Environment variables for API keys
- Proper build commands in netlify.toml
- Functions directory set correctly

### Production Optimizations
- Disable debug logging
- Minify compiled components
- Use CDN for static assets
- Enable gzip compression