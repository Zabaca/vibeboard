# Unified Component Pipeline Plan

## Objective
Implement a single, unified pipeline for processing both AI-generated and pre-built components in the AI Whiteboard POC, eliminating redundant transpilation and improving performance through intelligent caching of compiled code.

## Context
- **Created**: 2025-01-03
- **Status**: [ ] Not Started / [x] In Progress / [ ] Completed
- **Complexity**: Medium
- **Current State**: The app currently transpiles components at runtime every time they're rendered, including pre-built components that could be pre-compiled

## Prerequisites
- [x] AI Whiteboard POC is functional with both AI generation and library components
- [x] Babel transpilation is working for JSX to JS conversion
- [x] Component library system is in place
- [x] Export/import functionality exists

## Relevant Resources
### Guides
- Component transpilation patterns
- React dynamic component loading
- Build-time vs runtime compilation strategies

### Files to Modify
- `apps/ai-whiteboard-poc/src/components/GeneratedApp.tsx`
- `apps/ai-whiteboard-poc/src/components/ReactFlowCanvas.tsx`
- `apps/ai-whiteboard-poc/src/components/AIComponentNode.tsx`
- `apps/ai-whiteboard-poc/src/data/prebuiltComponents.ts`
- `apps/ai-whiteboard-poc/src/utils/codeTransformer.ts`
- `apps/ai-whiteboard-poc/src/utils/componentExecutor.ts`
- `apps/ai-whiteboard-poc/scripts/validate-prebuilt-components.ts`

### New Files to Create
- `apps/ai-whiteboard-poc/src/services/ComponentPipeline.ts`
- `apps/ai-whiteboard-poc/src/data/compiledComponents.generated.ts`
- `apps/ai-whiteboard-poc/scripts/compile-components.ts`
- `apps/ai-whiteboard-poc/src/types/component.types.ts`
- `apps/ai-whiteboard-poc/src/components/ImportFromURLDialog.tsx`
- `apps/ai-whiteboard-poc/src/services/URLImportService.ts`
- `apps/ai-whiteboard-poc/src/config/trustedDomains.ts`

### Documentation
- Update `apps/ai-whiteboard-poc/CLAUDE.md`
- Component caching strategies
- Performance optimization patterns

## Goals

### Parent Goal 1: Create Unified Component Data Structure
- [x] Sub-goal 1.1: Define `UnifiedComponentNode` interface in `src/types/component.types.ts`
  - Include fields for originalCode, compiledCode, compiledHash, compiledAt
  - Support metadata for both AI and library components
  - Add source field to track component origin
- [x] Sub-goal 1.2: Update `AIComponentNodeData` interface to extend `UnifiedComponentNode`
- [x] Sub-goal 1.3: Migrate existing interfaces to use the unified structure
- [x] Sub-goal 1.4: Update TypeScript types across all components

### Parent Goal 2: Implement Component Pipeline Service
- [x] Sub-goal 2.1: Create `ComponentPipeline` service class
  - Implement `processComponent()` method for unified processing
  - Add validation steps (JSX validation, transpilation, execution validation)
  - Include hash generation for change detection
- [x] Sub-goal 2.2: Add caching layer to pipeline
  - Implement in-memory cache for transpiled code
  - Add cache invalidation based on code hash
  - Support cache persistence to localStorage
- [x] Sub-goal 2.3: Create error handling and recovery mechanisms
  - Graceful fallback for transpilation failures
  - Clear error messages for debugging
- [x] Sub-goal 2.4: Add performance monitoring
  - Track transpilation times
  - Log cache hit/miss rates

### Parent Goal 3: Pre-compile Library Components at Build Time
- [x] Sub-goal 3.1: Create `compile-components.ts` build script
  - Load all prebuilt components
  - Run through ComponentPipeline
  - Generate compiled output file
- [x] Sub-goal 3.2: Update package.json scripts
  - Add `compile:components` script
  - Hook into build process with prebuild step
- [x] Sub-goal 3.3: Generate `compiledComponents.generated.ts`
  - Include both original and compiled code
  - Add metadata (compilation time, hash)
- [x] Sub-goal 3.4: Update import to use pre-compiled components
  - Modify ComponentLibrary to use compiled versions
  - Skip runtime transpilation for library components

### Parent Goal 4: Update Component Execution Flow
- [x] Sub-goal 4.1: Refactor `GeneratedApp.tsx` to use unified pipeline
  - Accept `UnifiedComponentNode` instead of raw code
  - Use compiledCode directly when available
  - Only transpile when compiledCode is missing or invalid
- [x] Sub-goal 4.2: Update `ReactFlowCanvas.tsx` node creation ✅
  - Use ComponentPipeline for all component sources
  - Store both original and compiled code in nodes
  - Maintain backward compatibility with existing saved nodes
- [x] Sub-goal 4.3: Implement lazy transpilation ✅
  - Only transpile when component is first rendered
  - Cache result back to node data
  - **Implementation**: Added IntersectionObserver to GeneratedApp.tsx for viewport-based lazy loading
  - **Performance**: Components only transpile when visible, improving initial canvas load times
  - **User Experience**: Clear loading states indicate lazy transpilation status
- [x] Sub-goal 4.4: Update component regeneration flow ✅
  - Clear compiledCode when source changes
  - Trigger retranspilation on next render
  - **Implementation**: Use `forceRecompile: true` in pipeline to clear stale cached compiled code
  - **Cache Management**: Ensures regenerated components get fresh compilation, not cached results
  - **User Experience**: Regenerated components immediately reflect new source code

### Parent Goal 5: Optimize Storage and Persistence ✅
- [x] Sub-goal 5.1: Update localStorage persistence ✅
  - Include compiledCode in saved nodes
  - Implement size optimization (compress if needed)  
  - Add versioning for migration support
  - **Implementation**: Created comprehensive StorageService with compression, versioning, and migration support
  - **Features**: Handles UnifiedComponentNode structure, automatic compression for large payloads, storage quota management
- [x] Sub-goal 5.2: Update export/import functionality ✅
  - Include compiled code in exports
  - Validate compiled code on import
  - Handle version mismatches gracefully
  - **Implementation**: Enhanced import/export with validation, compiled code verification, and robust error handling
  - **Features**: Edge validation, invalid node filtering, automatic migration between format versions
- [x] Sub-goal 5.3: Implement storage cleanup ✅
  - Remove old cached compilations
  - Limit cache size to prevent localStorage overflow
  - **Implementation**: Automatic cleanup scheduling with usage monitoring and manual cleanup button
  - **Features**: Storage quota detection, automatic cleanup triggers, cache pruning algorithms
- [x] Sub-goal 5.4: Add cache warming on app load ✅
  - Pre-compile frequently used components
  - Background compilation for better UX
  - **Implementation**: Background cache warming with library components after app load
  - **Features**: Non-blocking background warming, parallel component processing, error-tolerant warming

### Parent Goal 6: Implement URL Import Support ✅
- [x] Sub-goal 6.1: Extend ComponentPipeline for URL imports ✅
  - Add URL validation (HTTPS, domain whitelist)
  - Implement fetch mechanism for remote components
  - Detect format (ESM .js, JSX, TSX) from URL extension
  - Handle CORS and error scenarios
- [x] Sub-goal 6.2: Support multiple URL sources ✅
  - ESM CDNs (esm.sh, skypack.dev, unpkg.com)
  - GitHub raw content URLs
  - GitHub Gist API integration
  - Custom component server endpoints
- [x] Sub-goal 6.3: Create ImportFromURLDialog component ✅
  - URL input field with validation
  - Preview component metadata before import
  - Loading states during fetch
  - Error handling with helpful messages
- [x] Sub-goal 6.4: Add URL import to UI ✅
  - Add "Import from URL" button to control panel
  - Keyboard shortcut (Ctrl+Shift+I) for quick import
  - Recent URLs history/favorites
- [x] Sub-goal 6.5: Implement security measures ✅
  - Domain whitelist configuration
  - Content Security Policy headers
  - Sandbox imported components (optional)
  - Scan for malicious patterns
- [x] Sub-goal 6.6: Cache remote components ✅
  - Store fetched components locally
  - Implement cache invalidation strategy
  - Add refresh mechanism for updates
  - Handle offline scenarios

### Parent Goal 7: Add Performance Monitoring and Testing
- [ ] Sub-goal 7.1: Create performance benchmarks
  - Measure transpilation time savings
  - Track memory usage improvements
  - Compare before/after metrics
- [ ] Sub-goal 7.2: Add unit tests for ComponentPipeline
  - Test compilation caching
  - Verify hash-based invalidation
  - Test error handling
  - Test URL import validation
- [ ] Sub-goal 7.3: Create integration tests
  - Test full flow from library selection to rendering
  - Verify AI generation still works
  - Test export/import with compiled code
  - Test URL imports from various sources
- [ ] Sub-goal 7.4: Add performance dashboard (optional)
  - Show cache statistics
  - Display compilation times
  - Track component usage patterns
  - Monitor URL import success rates

## Implementation Notes

### Key Design Decisions
1. **Single Source of Truth**: All components go through ComponentPipeline
2. **Fail-Safe**: If compiled code is invalid, fall back to runtime transpilation
3. **Backward Compatible**: Support existing saved canvases without compiled code
4. **Progressive Enhancement**: Components work without pre-compilation, just slower
5. **Security First**: URL imports require HTTPS and domain whitelist
6. **Format Flexibility**: Support both ESM (pre-compiled) and JSX (needs transpilation) URLs

### Performance Targets
- Pre-built components: < 5ms load time (from 50-200ms)
- AI-generated components: One-time transpilation cost, then < 5ms
- Page reload with 10 components: < 50ms total (from 1000ms+)

### Caching Strategy
```typescript
// Cache hierarchy:
// 1. In-memory cache (fastest)
// 2. Node data (per component)
// 3. localStorage (persistent)
// 4. Build-time compilation (for library)
// 5. URL cache (for remote components)
```

### URL Import Sources
```typescript
// Supported URL patterns:
// ESM CDNs:
//   - https://esm.sh/react-colorful@5.6.1
//   - https://cdn.skypack.dev/framer-motion
//   - https://unpkg.com/lodash-es@4.17.21
// GitHub:
//   - https://raw.githubusercontent.com/user/repo/main/component.jsx
//   - https://gist.githubusercontent.com/user/id/raw/file.jsx
// Custom:
//   - https://your-cdn.com/components/button.js
```

## Testing Strategy

### Unit Tests
- ComponentPipeline service methods
- Hash generation and comparison
- Cache invalidation logic
- Error handling paths

### Integration Tests
- Full component lifecycle (create → compile → render → save → reload)
- Library component selection and rendering
- AI generation with caching
- Export/import with compiled code

### Performance Tests
- Measure transpilation time reduction
- Verify cache hit rates > 90% for repeated renders
- Ensure no memory leaks from caching

### User Acceptance Tests
- Components render identically before/after
- No visible performance degradation
- Export/import works seamlessly
- Error messages are helpful

## Risks & Mitigations

### Risk 1: Cache Invalidation Issues
**Risk**: Stale compiled code could cause bugs
**Mitigation**: Use content hash for invalidation, clear cache on version updates

### Risk 2: localStorage Size Limits
**Risk**: Compiled code could exceed storage limits
**Mitigation**: Implement size monitoring, compress large payloads, use IndexedDB as fallback

### Risk 3: Breaking Existing Saved Canvases
**Risk**: Users lose work due to incompatible changes
**Mitigation**: Version migration logic, graceful degradation, test with real saved data

### Risk 4: Build Process Complexity
**Risk**: Pre-compilation adds build complexity
**Mitigation**: Make it optional initially, good error messages, fallback to runtime

### Risk 5: Security Issues with URL Imports
**Risk**: Malicious code execution from untrusted URLs
**Mitigation**: Domain whitelist, HTTPS only, content validation, CSP headers, optional sandboxing

### Risk 6: CORS Issues with Remote Components
**Risk**: Browser blocks cross-origin component fetches
**Mitigation**: Use proxy endpoint for non-CORS URLs, document CORS requirements, provide fallback instructions

## Timeline Estimate
- Planning: 2 hours ✅
- Implementation: 12-14 hours
  - Unified structure: 2 hours
  - Pipeline service: 3 hours
  - Build-time compilation: 2 hours
  - URL import support: 3 hours
  - Integration: 2 hours
  - Testing: 2 hours
- Testing & QA: 3 hours
- Documentation: 1 hour
- **Total**: 18-20 hours

## Discussion

### Questions Resolved
1. **Q**: Should we use ESM modules directly?
   **A**: No, stick with Babel for now but structure allows future ESM migration

2. **Q**: How to handle version mismatches?
   **A**: Include compiler version in metadata, recompile if mismatch

3. **Q**: Should compilation be synchronous or async?
   **A**: Async with loading states for better UX

### Open Questions
1. Should we implement IndexedDB fallback for large canvases? not right now
2. Add telemetry to track real-world performance gains? not right now
3. Consider using Web Workers for transpilation? not right now
4. Should we support npm package imports (e.g., `import {Button} from '@mui/material'`)? - not right now
5. Add component versioning for URL imports? - not right now
6. Implement a proxy server for non-CORS endpoints? - not right now

### Success Metrics
- [ ] 10x faster component loading for pre-built components
- [ ] 5x faster page reloads with cached compilations
- [ ] Zero regression in functionality
- [ ] Improved developer experience with clear pipeline
- [ ] Successful URL imports from at least 3 different CDN sources
- [ ] < 2 second load time for remote components (first fetch)

## Next Steps
1. Review and approve plan
2. Create feature branch `feat/unified-component-pipeline`
3. Implement Parent Goal 1 (unified structure) first
4. Incremental implementation with testing at each stage
5. Performance benchmarking before merge

## Relevant Files Created/Modified

### Core Pipeline Files
- `apps/ai-whiteboard-poc/src/services/ComponentPipeline.ts` - Main pipeline service for processing components with URL import support
- `apps/ai-whiteboard-poc/src/services/StorageService.ts` - Enhanced storage and persistence service
- `apps/ai-whiteboard-poc/src/services/URLImportService.ts` - Service for importing components from external URLs
- `apps/ai-whiteboard-poc/src/types/component.types.ts` - Unified component type definitions with URL import types
- `apps/ai-whiteboard-poc/src/data/compiledComponents.generated.ts` - Pre-compiled library components

### Updated Components
- `apps/ai-whiteboard-poc/src/components/GeneratedApp.tsx` - Updated to accept UnifiedComponentNode and use pipeline
- `apps/ai-whiteboard-poc/src/components/AIComponentNode.tsx` - Updated to pass UnifiedComponentNode to GeneratedApp
- `apps/ai-whiteboard-poc/src/components/ReactFlowCanvas.tsx` - Added URL import button and keyboard shortcut
- `apps/ai-whiteboard-poc/src/components/ImportFromURLDialog.tsx` - Dialog for importing components from URLs

### Build Scripts
- `apps/ai-whiteboard-poc/scripts/compile-components.ts` - Script to pre-compile library components