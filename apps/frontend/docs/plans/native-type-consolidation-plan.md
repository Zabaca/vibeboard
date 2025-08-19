# Native Type Consolidation Plan

## Objective
Consolidate all native React Flow components (shape, text, sticky, image, csv) into a single "native" type to eliminate code duplication, simplify architecture, and improve maintainability.

## Context
- **Created**: 2025-08-19
- **Status**: [ ] Not Started / [ ] In Progress / [ ] Completed  
- **Complexity**: Medium
- **Current Issue**: 5 separate React Flow types for native components + CSV incorrectly using aiComponent type
- **Goal**: Single "native" type that handles all native component variations

## Prerequisites
- Understanding of current React Flow nodeTypes architecture
- All native components working correctly in current implementation
- Test coverage for native component functionality

## Relevant Resources

### Current Architecture Files
- `/src/components/ReactFlowCanvas.tsx` - nodeTypes mapping and component creation
- `/src/components/ComponentNode.tsx` - Currently handles CSV through aiComponent type
- `/src/components/UnifiedNativeNode.tsx` - NEW: Consolidated native component handler
- `/src/components/native/ShapeNode.tsx` - Shape component implementation (to be replaced)
- `/src/components/native/TextNode.tsx` - Text component implementation (to be replaced)  
- `/src/components/native/StickyNote.tsx` - Sticky note implementation (to be replaced)
- `/src/components/native/ImageNode.tsx` - Image component implementation (to be replaced)
- `/src/components/native/CSVSpreadsheet.tsx` - CSV component (currently using aiComponent)

### Type Definitions
- `/src/types/native-component.types.ts` - Native component type definitions
- `/src/types/component.types.ts` - Unified component types

### Documentation
- `/docs/component-flow-architecture.md` - Current architecture documentation

## Goals

### Parent Goal 1: Create Unified Native Component
- [x] Create `UnifiedNativeNode.tsx` component that handles all native types
- [x] Extract common ResizeConfig logic based on nativeType
- [x] Extract common UI patterns (controls, customizers, etc.)
- [x] Implement switch-based rendering for different nativeTypes
- [x] Ensure all existing functionality is preserved

### Parent Goal 2: Update React Flow Configuration
- [x] Update nodeTypes mapping to use single "native" type
- [x] Remove separate type registrations (shape, text, sticky, image)
- [x] Add migration logic for existing nodes with old types
- [x] Update CSV components to use "native" type instead of "aiComponent"

### Parent Goal 3: Update Component Creation Logic
- [ ] Update clipboard auto-detect to create type: "native" nodes
- [ ] Update toolbar actions to create type: "native" nodes  
- [ ] Update CSV creation logic to use type: "native"
- [ ] Update duplication logic to preserve nativeType while using "native" type

### Parent Goal 4: Handle Backward Compatibility
- [ ] Create migration function for existing canvas data
- [ ] Map old types (shape, text, sticky, image) to new native type
- [ ] Update StorageService to handle legacy node types
- [ ] Ensure existing saved canvases load correctly

### Parent Goal 5: Update Architecture Documentation
- [ ] Update component flow diagram to show single native type
- [ ] Document the new UnifiedNativeNode architecture
- [ ] Update type system documentation
- [ ] Add migration notes for developers

### Parent Goal 6: Testing and Validation
- [ ] Test all native component creation paths
- [ ] Test resizing behavior for each component type
- [ ] Test customization UIs (shape, text, sticky controls)
- [ ] Test CSV spreadsheet functionality under native type
- [ ] Test backward compatibility with existing canvases
- [ ] Verify no regressions in component behavior

## Implementation Notes

### Component Structure
```typescript
// New unified approach
const nodeTypes = {
  aiComponent: ComponentNode,  // For generated components
  native: UnifiedNativeNode,   // For ALL native components  
};

// UnifiedNativeNode.tsx structure
const UnifiedNativeNode = ({ data, selected }) => {
  const { nativeType, state } = data;
  
  return (
    <div>
      <NodeResizer {...getResizeConfig(nativeType)} />
      {renderNativeContent(nativeType, state)}
      {renderNativeControls(nativeType, state)}
    </div>
  );
};
```

### Migration Strategy
1. **Phase 1**: Create UnifiedNativeNode with full functionality parity
2. **Phase 2**: Update nodeTypes mapping and creation logic
3. **Phase 3**: Add backward compatibility for existing canvases
4. **Phase 4**: Clean up old component files (optional)

### Key Considerations
- **Performance**: Ensure no performance regression from unified component
- **Maintainability**: Centralize common patterns while keeping type-specific logic clear
- **Bundle Size**: Should reduce overall bundle size by eliminating duplicate code
- **Debugging**: Component name in React DevTools will change but be more consistent

## Testing Strategy

### Unit Tests
- [ ] Test UnifiedNativeNode renders all nativeTypes correctly
- [ ] Test ResizeConfig returns correct settings for each type
- [ ] Test component creation with new "native" type

### Integration Tests  
- [ ] Test full workflow: toolbar → creation → rendering → interaction
- [ ] Test CSV clipboard detection → native type creation
- [ ] Test canvas save/load with new node structure

### Regression Tests
- [ ] Load existing canvases with old types (shape, text, sticky, image)
- [ ] Verify all existing functionality works identically
- [ ] Test component customization UIs still work

### Performance Tests
- [ ] Compare render performance before/after consolidation
- [ ] Test memory usage with large number of native components

## Risks & Mitigations

### Risk 1: Breaking Existing Canvases
- **Impact**: Users lose access to saved work
- **Mitigation**: Comprehensive migration logic + extensive testing
- **Fallback**: Keep migration code permanent, don't remove old type support

### Risk 2: Performance Regression
- **Impact**: Slower rendering of native components
- **Mitigation**: Profile before/after, optimize render paths
- **Fallback**: Revert to separate components if needed

### Risk 3: Component Behavior Changes
- **Impact**: Subtle differences in how components work
- **Mitigation**: Extensive testing of all component interactions
- **Fallback**: Maintain exact same logic paths in unified component

## Timeline Estimate
- **Planning**: 1 hour (complete)
- **Implementation**: 4-6 hours
  - UnifiedNativeNode creation: 2-3 hours
  - Migration logic: 1-2 hours  
  - Testing and fixes: 1-2 hours
- **Testing**: 2-3 hours
- **Documentation**: 1 hour
- **Total**: 8-11 hours

## Success Criteria
- [ ] All native components render identically to current implementation
- [ ] Single "native" type in React Flow handles all native component varieties
- [ ] CSV component properly uses native type instead of aiComponent
- [ ] Existing saved canvases load and work correctly
- [ ] No performance regression
- [ ] Code duplication eliminated across native components
- [ ] Architecture documentation updated

## Discussion

### Architecture Decision
The consolidation makes sense because:
1. **Code duplication**: All native components have ~90% identical structure
2. **Maintenance burden**: Changes require updates across 5+ files
3. **Complexity**: Current architecture appears more complex than necessary
4. **CSV inconsistency**: Already shows this pattern works (CSV uses aiComponent)

### Alternative Considered
Keep separate types but extract common patterns into shared utilities. Rejected because it doesn't address the core issue of unnecessary type proliferation.

### Migration Strategy
Backward compatibility is critical since users have saved canvases. The migration should be seamless and permanent (not a one-time conversion).