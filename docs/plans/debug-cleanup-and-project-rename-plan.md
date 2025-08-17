# Debug Cleanup and Project Rename Plan

## Objective
Transform the current ad-hoc console logging (311 statements across 26 files) into a structured, production-ready logging system while renaming the project from "vibeboard" to "stiqr".

## Context
- **Created**: 2025-08-16
- **Status**: [ ] Not Started / [ ] In Progress / [ ] Completed
- **Complexity**: Medium-High

## Prerequisites
- Project is ready for open source release
- All current functionality is working
- No breaking changes to core features

## Relevant Resources
### Current Logging Locations
- ReactFlowCanvas.tsx (26 statements)
- ComponentNode.tsx (23 statements)
- CodeEditDialogOptimized.tsx (14 statements)
- Services layer (StorageService, ComponentPipeline, cerebras, vision, etc.)
- Utilities (esmExecutor, screenshotUtils, clipboardUtils, etc.)

### Files Requiring Project Rename
- package.json (root and frontend)
- README.md
- CLAUDE.md
- index.html (title)
- vite.config.ts
- netlify.toml
- All documentation files

### Documentation
- [debug library docs](https://github.com/debug-js/debug)
- [Vite env handling](https://vitejs.dev/guide/env-and-mode.html)

## Goals

### Parent Goal 1: Implement Structured Logging System
- [ ] Install and configure debug library
- [ ] Create centralized logger utility with namespace support
- [ ] Define logging categories and conventions
- [ ] Add TypeScript types for logger
- [ ] Configure build system for production log stripping
- [ ] Create developer documentation for logging usage

### Parent Goal 2: Migrate Console Statements (High Priority - Services)
- [ ] Migrate cerebras.ts service logging
- [ ] Migrate vision.ts service logging  
- [ ] Migrate ComponentPipeline.ts logging
- [ ] Migrate StorageService.ts logging
- [ ] Migrate URLImportService.ts logging
- [ ] Migrate posthog.ts service logging

### Parent Goal 3: Migrate Console Statements (High Priority - Core Components)
- [ ] Migrate ReactFlowCanvas.tsx logging (26 statements)
- [ ] Migrate ComponentNode.tsx logging (23 statements)
- [ ] Migrate CodeEditDialogOptimized.tsx logging (14 statements)
- [ ] Migrate GeneratedApp.tsx logging
- [ ] Migrate AsyncComponentLoader.tsx logging

### Parent Goal 4: Migrate Console Statements (Medium Priority - Utilities)
- [ ] Migrate esmExecutor.ts logging
- [ ] Migrate screenshotUtils.ts logging
- [ ] Migrate clipboardUtils.ts logging
- [ ] Migrate indexedDBUtils.ts logging
- [ ] Migrate cdnModuleLoader.ts logging
- [ ] Migrate debug-logger.ts (replace entirely)
- [ ] Migrate performance-debug.ts logging

### Parent Goal 5: Migrate Console Statements (Low Priority - Development)
- [ ] Migrate test files logging
- [ ] Migrate native components logging
- [ ] Migrate main.tsx logging
- [ ] Review and clean remaining files

### Parent Goal 6: Project Rename (vibeboard → stiqr)
- [ ] Update root package.json name and description
- [ ] Update frontend package.json name
- [ ] Update README.md title and all references
- [ ] Update CLAUDE.md project references
- [ ] Update index.html title and meta tags
- [ ] Update vite.config.ts project references
- [ ] Update netlify.toml configuration
- [ ] Update all documentation files in docs/
- [ ] Update component metadata and comments
- [ ] Update PostHog project references
- [ ] Update error messages and user-facing text

### Parent Goal 7: Build Configuration and Testing
- [ ] Configure Vite to strip debug calls in production
- [ ] Test development logging functionality
- [ ] Test production build has no debug statements
- [ ] Verify browser localStorage debug controls work
- [ ] Update development setup documentation
- [ ] Create logging troubleshooting guide

## Implementation Notes

### Logging Categories
```
stiqr:app:*          - Application lifecycle
stiqr:ai:cerebras:*  - Cerebras AI generation
stiqr:ai:vision:*    - Vision analysis with Groq
stiqr:component:*    - Component management
stiqr:canvas:*       - React Flow operations
stiqr:storage:*      - Storage and persistence
stiqr:esm:*          - ESM execution and imports
stiqr:pipeline:*     - Component pipeline processing
stiqr:perf:*         - Performance monitoring
stiqr:clipboard:*    - Clipboard operations
stiqr:screenshot:*   - Screenshot capture
stiqr:url:*          - URL imports
```

### Logger Interface
```typescript
interface Logger {
  debug(namespace: string, message: string, meta?: unknown): void;
  info(namespace: string, message: string, meta?: unknown): void;
  warn(namespace: string, message: string, meta?: unknown): void;
  error(namespace: string, message: string, meta?: unknown): void;
  perf(namespace: string, operation: string, duration: number, meta?: unknown): void;
}
```

### Migration Patterns
```typescript
// Old
console.log('🔧 [DEBUG] ComponentNode render:', { id, selected });

// New  
logger.debug('component:render', 'ComponentNode render', { id, selected });

// Old
console.error('❌ Screenshot capture failed:', error);

// New
logger.error('screenshot:capture', 'Screenshot capture failed', { error });
```

### Build Configuration
```typescript
// vite.config.ts - strip debug in production
export default defineConfig({
  define: {
    __DEBUG__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    pure: process.env.NODE_ENV === 'production' ? ['console.debug'] : [],
  },
});
```

## Testing Strategy

### Development Testing
- [ ] Verify all log categories work with localStorage.debug
- [ ] Test namespace filtering (e.g., `stiqr:ai:*` only shows AI logs)
- [ ] Confirm colored output in browser console
- [ ] Test structured metadata logging

### Production Testing  
- [ ] Build production bundle and verify no debug statements
- [ ] Confirm error/warn logs still work in production
- [ ] Test bundle size impact (should be minimal)
- [ ] Verify localStorage debug controls have no effect

### Project Rename Testing
- [ ] Search codebase for any remaining "vibeboard" references
- [ ] Test all URLs and links work after rename
- [ ] Verify deployment still works with new name
- [ ] Check meta tags and SEO elements updated

## Risks & Mitigations

### Risk: Breaking Existing Functionality
- **Mitigation**: Gradual migration, test each service individually
- **Rollback**: Keep git commits small and atomic

### Risk: Performance Impact  
- **Mitigation**: Use conditional compilation, measure bundle size
- **Monitoring**: Add performance budgets to build process

### Risk: Missing Debug Information
- **Mitigation**: Comprehensive namespace coverage, developer training
- **Solution**: Add debugging guide for common scenarios

### Risk: Incomplete Project Rename
- **Mitigation**: Systematic search and replace, use grep to find references
- **Verification**: Full text search after completion

## Timeline Estimate
- **Planning**: 0.5 days (completed)
- **Logger Setup**: 0.5 days  
- **Service Migration**: 1 day
- **Component Migration**: 1.5 days
- **Utility Migration**: 1 day
- **Project Rename**: 0.5 days
- **Build Config & Testing**: 0.5 days
- **Documentation**: 0.5 days
- **Total**: 5.5 days

## Discussion

### Logging Design Decisions
1. **Namespace Structure**: Using hierarchical namespaces (stiqr:category:subcategory) for fine-grained control
2. **Metadata Format**: Consistent object-based metadata for structured logging
3. **Performance**: Debug calls completely stripped in production builds
4. **Developer Experience**: localStorage controls for easy debugging

### Project Rename Considerations  
1. **Timing**: Rename after logging system to avoid conflicts
2. **SEO Impact**: Update all meta tags and descriptions
3. **Branding**: Ensure consistent naming across all touchpoints
4. **Documentation**: Update all guides and README files

### Future Enhancements
- Error tracking service integration (Sentry, LogRocket)
- Performance monitoring dashboard
- Log aggregation for production debugging
- Automated log analysis and alerting