# Biome Lint Error Resolution Plan

## Objective
Fix all 524 lint errors and 23 warnings from Biome while identifying and disabling rules that don't provide value for a canvas-based React application.

## Exception Execution Note
for this plan, do not wait for my approval to proceed to the next parent goal after completing one. just continue to we finish all goals. however do commit everytime we finish a parent goal.

## Context
- **Created**: 2025-01-14
- **Status**: [ ] Not Started
- **Complexity**: High
- **Current State**: 524 errors, 23 warnings across 63 files
- **Fresh Biome 2.1.4 migration** with comprehensive rule set

## Prerequisites
- Biome 2.1.4 installed and configured
- Working knowledge of React best practices
- Understanding of accessibility requirements for development tools

## Relevant Resources
### Configuration Files
- `apps/frontend/biome.json` - Main linting configuration
- `apps/frontend/src/**/*.{ts,tsx}` - Source files to fix

### Documentation
- [Biome Linting Rules](https://biomejs.dev/linter/rules/)
- [React Hooks Rules](https://react.dev/reference/react)

## Goals

### Parent Goal 1: Fix Biome Configuration Issues
- [ ] **1.1**: Resolve `noVar` rule placement error in suspicious category
- [ ] **1.2**: Test configuration validity with `pnpm lint:check`
- [ ] **1.3**: Document any rule conflicts or schema issues

### Parent Goal 2: Auto-fix Safe Errors
- [ ] **2.1**: Run `pnpm lint` to auto-fix all safely fixable errors
- [ ] **2.2**: Commit auto-fixed changes with clear commit message
- [ ] **2.3**: Re-evaluate remaining error count after auto-fixes

### Parent Goal 3: Fix Type Safety Violations
- [ ] **3.1**: Fix `noExplicitAny` errors - replace `any` with proper types
- [ ] **3.2**: Fix `noImplicitAnyLet` - add explicit type annotations
- [ ] **3.3**: Fix `noRestrictedTypes` violations (any, Object, Function)
- [ ] **3.4**: Review and fix any type assertion (`as`) usage if found

### Parent Goal 4: Fix React/Hooks Violations
- [ ] **4.1**: Fix `useExhaustiveDependencies` errors in useEffect hooks
- [ ] **4.2**: Fix `useHookAtTopLevel` violations
- [ ] **4.3**: Fix `noUselessFragments` - remove unnecessary React fragments
- [ ] **4.4**: Fix `useAwait` errors - remove async without await

### Parent Goal 5: Fix Accessibility Issues
- [ ] **5.1**: Add `type="button"` to interactive buttons (`useButtonType`)
- [ ] **5.2**: Add ARIA labels or titles to SVGs (`noSvgWithoutTitle`)
- [ ] **5.3**: Fix keyboard event handlers for click events (`useKeyWithClickEvents`)
- [ ] **5.4**: Add proper roles to interactive static elements (`noStaticElementInteractions`)

### Parent Goal 6: Fix Code Quality Issues
- [ ] **6.1**: Fix `useBlockStatements` - wrap single statements in braces
- [ ] **6.2**: Fix `noUnusedTemplateLiteral` - use string literals instead of templates
- [ ] **6.3**: Fix `useNodejsImportProtocol` - add `node:` prefix to Node imports
- [ ] **6.4**: Fix `noUnusedImports` and `noUnusedVariables`
- [ ] **6.5**: Fix `useConst` violations - prefer const over let

### Parent Goal 7: Disable Low-Value Rules ✅ **APPROVED**
- [x] **7.1**: ✅ **PROCEED** - Disable `noSvgWithoutTitle` for development UI icons
  - **Reasoning**: Internal dev tools don't need extensive accessibility for decorative icons
  - **Impact**: ~15-20 errors in toolbar/menu icons

- [x] **7.2**: ✅ **PROCEED** - Disable `useKeyWithClickEvents` for backdrop overlays
  - **Reasoning**: Modal backdrop clicks are standard UX pattern, keyboard handled by modal focus trap
  - **Impact**: ~5-8 errors in dialog backdrops

- [x] **7.3**: ✅ **PROCEED** - Disable `noStaticElementInteractions` for backdrop overlays
  - **Reasoning**: Same as above - backdrop clicks are intentional UX pattern
  - **Impact**: ~5-8 errors in dialog backdrops

- [x] **7.4**: ✅ **PROCEED** - Disable `noUnusedTemplateLiteral` for console.log messages
  - **Reasoning**: Template literals in console messages improve readability even without interpolation
  - **Impact**: ~10-15 errors in debug/logging statements

- [x] **7.5**: ✅ **PROCEED** - Disable `useNodejsImportProtocol` for build scripts
  - **Reasoning**: Node.js protocol not widely adopted yet, may cause compatibility issues
  - **Impact**: ~3-5 errors in build scripts

- [x] **7.6**: ✅ **PROCEED** - Adjust `useExhaustiveDependencies` for external refs
  - **Reasoning**: Some refs (like DOM refs) don't need to be dependencies
  - **Impact**: ~5-10 errors in useEffect hooks

### Parent Goal 8: Manual Review of Remaining Errors
- [ ] **8.1**: Categorize any remaining errors after fixes
- [ ] **8.2**: Identify potential false negatives requiring rule adjustments  
- [ ] **8.3**: Document justified rule exceptions with clear reasoning
- [ ] **8.4**: Create final configuration with appropriate overrides

## Implementation Strategy

### Phase 1: Configuration & Auto-fixes
1. Fix config issues and run auto-fixes first
2. This should eliminate 200-300 errors immediately
3. Commit changes to establish clean baseline

### Phase 2: Type Safety (High Priority)
1. Focus on `any` usage and type safety violations
2. These are high-impact fixes for code quality
3. May require understanding component interfaces

### Phase 3: React/Hooks (High Priority)  
1. Fix useEffect dependencies and hook violations
2. Critical for React application correctness
3. May require understanding component behavior

### Phase 4: Accessibility (Medium Priority)
1. Add button types and ARIA labels
2. Important for production but not critical for dev tools
3. Straightforward fixes with clear patterns

### Phase 5: Rule Review (Low Priority)
1. Evaluate rules marked for review above
2. Disable rules that don't provide value
3. Document decisions for future reference

## Testing Strategy
- [ ] Run `pnpm check` after each phase
- [ ] Ensure `pnpm build` still works
- [ ] Test development server (`pnpm dev`) 
- [ ] Verify no TypeScript errors introduced

## Risks & Mitigations
- **Risk**: Auto-fixes change behavior
  - **Mitigation**: Review auto-fix diffs carefully
- **Risk**: Overly restrictive accessibility rules
  - **Mitigation**: Disable rules that don't add value for dev tools
- **Risk**: Breaking changes in component behavior  
  - **Mitigation**: Test components after useEffect dependency fixes

## Timeline Estimate
- **Configuration fixes**: 30 minutes
- **Auto-fixes + review**: 1 hour  
- **Type safety fixes**: 2-3 hours
- **React/hooks fixes**: 2-3 hours
- **Accessibility fixes**: 1-2 hours
- **Rule review**: 1 hour
- **Total**: 7-10 hours

## Agreement on Complexity Threshold
Cognitive complexity threshold of **20 is appropriate** for this codebase. It's strict enough to prevent overly complex functions while allowing reasonable React component logic.

## Status Updates
- **Created**: 2025-01-14 - Initial plan created with approved rule disables
- **Next**: Begin Phase 1 - Configuration fixes and auto-fixes