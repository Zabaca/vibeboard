# NPM Component Migration Plan

## Objective
Migrate the `button-animated` component from the local prebuiltComponents.ts to an npm package under the @vibeboard organization, enabling direct CDN imports via esm.sh. This will establish a pattern for migrating all prebuilt components to a CDN-based architecture.

## Context
- **Created**: 2024-01-05
- **Status**: [ ] Not Started / [x] In Progress / [ ] Completed
- **Complexity**: Medium

## Prerequisites
- [x] NPM organization @vibeboard created
- [x] Access to publish packages under @vibeboard
- [ ] Node.js and npm installed locally
- [ ] Understanding of ESM module format and CDN imports

## Relevant Resources
### Guides
- ESM CDN documentation: https://esm.sh
- NPM package publishing guide
- React ESM component patterns

### Files
- `/apps/frontend/src/data/prebuiltComponents.ts` - Source of components to migrate
- `/apps/frontend/src/components/ComponentLibrary.tsx` - Component library UI
- `/apps/frontend/src/components/ReactFlowCanvas.tsx` - Canvas component that uses the library
- `/apps/frontend/src/services/ComponentPipeline.ts` - Component processing pipeline
- `/packages/` - Directory for new npm packages

### Documentation
- Current ESM-first architecture in CLAUDE.md
- Import maps configuration in index.html

## Goals

### Parent Goal 1: Create NPM Package Structure
- [ ] Sub-goal 1.1: Create `/packages/button-animated` directory structure
- [ ] Sub-goal 1.2: Initialize package.json with proper metadata for @vibeboard/button-animated
- [ ] Sub-goal 1.3: Set up TypeScript/JSX source file with the component
- [ ] Sub-goal 1.4: Configure build system (Vite/Rollup) for ESM output
- [ ] Sub-goal 1.5: Set up build scripts for development and production
- [ ] Sub-goal 1.6: Configure external dependencies (React as peer dependency)
- [ ] Sub-goal 1.7: Create README.md with usage instructions

### Parent Goal 2: Build and Publish Workflow
- [ ] Sub-goal 2.1: Create build script that compiles JSX to optimized ESM
- [ ] Sub-goal 2.2: Set up GitHub Actions for automated build and publish
- [ ] Sub-goal 2.3: Test the built package locally with npm link
- [ ] Sub-goal 2.4: Publish to npm registry as @vibeboard/button-animated
- [ ] Sub-goal 2.5: Verify the package is accessible via esm.sh CDN
- [ ] Sub-goal 2.6: Test CDN URLs with different import styles

### Parent Goal 3: Update Library Data Structure
- [ ] Sub-goal 3.1: Create new data structure for CDN-based components
- [ ] Sub-goal 3.2: Add CDN URL reference for button-animated component
- [ ] Sub-goal 3.3: Update PrebuiltComponent interface to support CDN URLs
- [ ] Sub-goal 3.4: Remove the inline code for button-animated

### Parent Goal 4: Update Canvas Integration
- [ ] Sub-goal 4.1: Modify ComponentLibrary to display CDN-based components
- [ ] Sub-goal 4.2: Update ReactFlowCanvas to load components directly from CDN
- [ ] Sub-goal 4.3: Remove processLibraryComponent pipeline for CDN components
- [ ] Sub-goal 4.4: Test component loading and rendering from CDN

## Implementation Notes

### Development Workflow
- Write components in TypeScript/JSX for better developer experience
- Use Vite or Rollup to build optimized ESM bundles
- Configure React as external dependency (not bundled)
- Output format should be pure ESM module

### Build Configuration
- **Input**: TypeScript/JSX source files
- **Output**: Optimized ESM JavaScript
- **Externals**: React, ReactDOM (users will provide via import maps)
- **Target**: ES2020+ (modern browsers)
- **No CommonJS**: Pure ESM output only

### Import Strategy

#### In Source Code (Development)
```javascript
// Write normal imports in your source files
import React, { useState } from 'react';
import { someUtil } from './utils';
```

#### Build Configuration
```javascript
// Vite/Rollup config
export default {
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],  // Don't bundle React
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
}
```

#### CDN Usage Pattern
```javascript
// In Vibeboard, import with ?external=react to use our import maps:
import AnimatedButton from 'https://esm.sh/@vibeboard/button-animated?external=react'

// This ensures:
// 1. Component's "import React" uses our import map
// 2. React singleton pattern is maintained
// 3. No duplicate React instances
```

#### For Other Dependencies
If a component needs other libraries (e.g., framer-motion):
1. Add to import map in index.html
2. Mark as external in build config
3. Use ?external parameter when importing from CDN

### Component Requirements
- Maintain the same component API (default export of a React component)
- Keep the demo wrapper div for consistent presentation
- Ensure tree-shaking friendly exports
- Include TypeScript definitions

## Testing Strategy
1. **Local Testing**: Use `npm link` to test the package locally before publishing
2. **CDN Testing**: Verify the component loads correctly from `https://esm.sh/@vibeboard/button-animated`
3. **Integration Testing**: Ensure the component works within the Vibeboard canvas
4. **Cross-browser Testing**: Test in Chrome, Firefox, and Safari

## Risks & Mitigations
- **Risk**: CDN downtime affecting component availability
  - **Mitigation**: Consider fallback URLs or self-hosting option
- **Risk**: Version conflicts with React
  - **Mitigation**: Use specific React version in CDN imports with ?external=react parameter
- **Risk**: Breaking existing functionality
  - **Mitigation**: Test thoroughly before removing old component system

## Timeline Estimate
- Planning: 30 minutes ✓
- Package setup & build config: 1 hour
- Component migration & testing: 1 hour
- Build workflow & CI setup: 1 hour
- Publishing & integration: 1 hour
- Total: 4-5 hours

## Discussion
### Questions Resolved:
1. **Component Selection**: Starting with button-animated as pilot
2. **NPM Scope**: Using @vibeboard organization
3. **CDN Provider**: Using esm.sh for automatic ESM conversion
4. **Data Structure**: Starting with manually maintained library data
5. **Migration Strategy**: Complete replacement, no backward compatibility needed
6. **Dependencies**: Components should import React and other deps from CDN

### Build vs Runtime Tradeoffs:
- **Build-time Compilation**: 
  - ✅ Better DX with JSX and TypeScript
  - ✅ Optimized output (minified, tree-shaken)
  - ✅ Type definitions for consumers
  - ✅ Standard npm workflow
  - ⚠️ Requires build step before publish

- **Why This Approach**: 
  - esm.sh automatically handles module transformation
  - Published packages are already optimized
  - Maintains source code readability
  - Follows standard npm package practices

### Next Steps After This Component:
1. Create a template/generator for migrating remaining components
2. Set up monorepo build scripts for all packages
3. Automate the library data generation from npm registry
4. Create component preview/documentation system
5. Plan bulk migration of remaining components
6. Consider lerna or changesets for version management