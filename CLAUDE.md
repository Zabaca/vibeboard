# Vibeboard - Developer Guide

## Overview

Vibeboard is an AI-powered visual canvas platform for creating interactive component-based interfaces. It combines AI generation (Cerebras), visual canvas manipulation (React Flow), and native ES module execution in an ESM-first architecture with import maps for React singleton management.

## Project Structure

```
vibeboard/                         # Monorepo root
├── apps/
│   ├── frontend/                 # React frontend application
│   │   ├── public/
│   │   │   ├── shims/           # React singleton shims
│   │   │   ├── components/      # Pre-built library components
│   │   │   └── test-components/ # ESM test components
│   │   ├── src/
│   │   │   ├── components/      # React components
│   │   │   ├── services/        # Business logic services
│   │   │   ├── utils/           # Utility functions
│   │   │   ├── types/           # TypeScript types
│   │   │   └── data/            # Static data and generated files
│   │   └── bit-components/      # Bit.dev managed components
│   └── backend/                 # (Future) Backend services
├── packages/                    # Shared packages
├── pnpm-workspace.yaml         # PNPM workspace configuration
└── .envrc                      # direnv configuration
```

## Current Architecture

### Core Stack
- **React 19** with TypeScript
- **React Flow** (@xyflow/react) - Visual canvas for component arrangement
- **Cerebras AI** - Fast component generation using Llama models
- **Babel Standalone** - Runtime JSX transpilation
- **Native Import Maps** - Browser-native module resolution
- **Vite** - Development and build tooling
- **PNPM** - Package manager with workspace support
- **Bit.dev** - Component management platform (configured)

### Key Design Decisions

#### 1. Monorepo Architecture
- PNPM workspaces for managing multiple apps/packages
- Centralized environment configuration
- Prepared for future backend services
- Shared dependencies and tooling

#### 2. ESM-First Architecture
The entire system is built around ES modules:
- All components are ES modules with standard `import`/`export` syntax
- Direct CDN imports work without bundling (esm.sh, unpkg, skypack)
- Native browser import maps handle module resolution
- No UMD or CommonJS support needed

#### 3. React Singleton Pattern
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

#### 4. Component Pipeline
Unified processing system for all component sources:
- **AI-generated**: Cerebras API → Import fixing → JSX transpilation → Execution
- **Library**: Pre-built code → Compilation cache → Direct execution
- **URL import**: Fetch → Format detection → Processing → Caching
- **Pre-compiled**: Skip transpilation for performance
- **Bit.dev**: (Future) Published components with versioning

## Development Setup

### Prerequisites
- Node.js 16+ (recommended: 20+)
- PNPM 8+ (`npm install -g pnpm`)
- direnv (optional but recommended)

### Quick Start
```bash
# Clone repository
git clone git@github.com:Zabaca/vibeboard.git
cd vibeboard

# Copy environment configuration
cp .env.example .env
# Edit .env and add your Cerebras API key

# Install dependencies
pnpm install

# Start development server
pnpm dev

# The frontend will be available at http://localhost:5173
```

### Environment Variables
All environment variables are centralized in the root `.env` file:
- `VITE_CEREBRAS_API_KEY` - Your Cerebras API key
- `NODE_ENV` - Development/production mode
- Future backend variables are documented in `.env.example`

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

### Frontend Components (`apps/frontend/src/components/`)

#### ReactFlowCanvas.tsx
The main orchestrator that:
- Manages all nodes and their positions
- Handles component generation workflow
- Implements presentation mode
- Manages persistence and export/import
- Provides UI controls and keyboard shortcuts

#### ComponentNode.tsx
Custom React Flow node that:
- Renders generated components
- Handles resize and positioning
- Shows component metadata
- Provides action buttons

#### GeneratedApp.tsx
The component executor that:
- Creates safe execution context
- Handles runtime errors gracefully
- Manages component lifecycle
- Provides loading states
- Shows detailed error messages

### Services (`apps/frontend/src/services/`)

#### ComponentPipeline.ts
Unified processing service that:
- Detects component format (JSX/ESM/TSX)
- Manages compilation cache
- Handles all transpilation
- Fixes missing imports automatically
- Provides performance metrics

#### cerebras.ts
AI service that:
- Interfaces with Cerebras API
- Manages API keys and endpoints
- Handles prompt engineering
- Provides error handling

### Utilities (`apps/frontend/src/utils/`)

#### esmExecutor.ts
Module execution engine that:
- Creates blob URLs for modules
- Manages dynamic imports
- Handles module cleanup
- Provides execution context

#### importFixer.ts
Automatic import management:
- Detects missing React hooks
- Adds required imports
- Maintains code structure
- Handles edge cases

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

## Monorepo Commands

### Development
```bash
# Start frontend dev server
pnpm dev

# Start specific app
pnpm --filter frontend dev

# Run command in all apps
pnpm -r <command>
```

### Building
```bash
# Build frontend
pnpm build

# Build all apps
pnpm build:all

# Type checking
pnpm typecheck
```

### Testing
```bash
# Run tests (when implemented)
pnpm test

# Lint code
pnpm lint
```

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
**Solution**: Use proxy endpoints or `?external=react` parameter

### 5. Storage Full
**Symptom**: Components not saving
**Solution**: Use cleanup button or export/clear/import

## Bit.dev Integration

### Current Status
- Bit workspace initialized with scope `zabaca.zabaca`
- React environment configured
- Component structure prepared in `bit-components/`

### Next Steps (Parent Goal 2)
1. Audit existing components
2. Create component metadata
3. Standardize component structure
4. Migrate components to Bit format

## Future Enhancements

### Planned
- Backend API service
- WebContainer API for full dev environment
- Collaborative editing with WebRTC
- Git integration for version control
- TypeScript support in editor
- Component marketplace via Bit.dev

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

## Deployment

### Netlify Configuration
- Base directory: `apps/frontend`
- Build command: `pnpm build`
- Publish directory: `apps/frontend/dist`
- Functions directory: `apps/frontend/netlify/functions`
- Environment variables set in Netlify dashboard

### Production Optimizations
- Disable debug logging
- Enable minification (currently disabled for debugging)
- Use CDN for static assets
- Enable gzip compression

## Contributing

When contributing to Vibeboard:
1. Follow the monorepo structure
2. Keep components in appropriate directories
3. Update types when adding features
4. Test with ESMTestComponent first
5. Ensure pnpm build passes
6. Follow ESM-first principles