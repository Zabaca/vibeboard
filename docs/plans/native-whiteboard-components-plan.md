# Native Whiteboard Components Plan

## Objective
Add native whiteboard components (shapes, text, sticky notes) to the existing AI-powered canvas, implementing a state management interface for component persistence and providing an intuitive UI for creating these components.

## Context
- **Created**: 2025-08-06
- **Status**: [ ] Not Started / [x] In Progress / [ ] Completed
- **Complexity**: Medium

The Vibeboard canvas currently only supports ESM modules that are imported/generated. This plan adds native drawing components typical of whiteboard applications, with full state persistence and an always-visible toolbar.

## Prerequisites
- [x] React Flow canvas implementation
- [x] Component type system (UnifiedComponentNode)
- [x] LocalStorage persistence (StorageService)
- [x] Node positioning and viewport management

## Relevant Resources
### Guides
- React Flow documentation for custom nodes
- Canvas API for shape rendering
- State management patterns for React

### Files
- `/apps/frontend/src/types/component.types.ts` - Component type definitions
- `/apps/frontend/src/components/ReactFlowCanvas.tsx` - Main canvas component
- `/apps/frontend/src/services/StorageService.ts` - Persistence layer
- `/apps/frontend/src/components/ComponentNode.tsx` - Existing node component

### Documentation
- React Flow custom node documentation
- HTML Canvas API for shape rendering
- SVG for scalable shapes

## Goals

### Parent Goal 1: Define Component Architecture and State Interface
- [x] Sub-goal 1.1: Create new component type enum `NativeComponentType = 'shape' | 'text' | 'sticky'`
- [x] Sub-goal 1.2: Define `ComponentState` interface for storing component-specific state
- [x] Sub-goal 1.3: Extend `UnifiedComponentNode` to support native components
- [x] Sub-goal 1.4: Create `NativeComponentNode` interface extending `UnifiedComponentNode`

### Parent Goal 2: Implement Native Shape Components
- [x] Sub-goal 2.1: Create `ShapeNode` component with rectangle, triangle, square support
- [x] Sub-goal 2.2: Implement editable text within shapes
- [x] Sub-goal 2.3: Add shape customization (color, border, fill)
- [x] Sub-goal 2.4: Implement resize handles for shapes

### Parent Goal 3: Implement Text Component
- [x] Sub-goal 3.1: Create `TextNode` component with transparent background
- [x] Sub-goal 3.2: Implement text size adjustment UI
- [x] Sub-goal 3.3: Add font family and style options
- [x] Sub-goal 3.4: Implement inline text editing

### Parent Goal 4: Implement Sticky Note Component
- [x] Sub-goal 4.1: Create `StickyNote` component with note-like appearance
- [x] Sub-goal 4.2: Implement text editing within sticky notes
- [x] Sub-goal 4.3: Add color variations (yellow, pink, blue, green)
- [x] Sub-goal 4.4: Add auto-resize based on content

### Parent Goal 5: Create Native Components Toolbar
- [x] Sub-goal 5.1: Design toolbar UI with shape, text, and sticky buttons
- [x] Sub-goal 5.2: Implement toolbar as permanent panel on canvas
- [x] Sub-goal 5.3: Add drag-to-create functionality
- [x] Sub-goal 5.4: Implement keyboard shortcuts for quick creation

### Parent Goal 6: Integrate State Management
- [x] Sub-goal 6.1: Update `StorageService` to handle native component state
- [x] Sub-goal 6.2: Implement state serialization/deserialization
- [x] Sub-goal 6.3: Add migration support for existing saved canvases
- [x] Sub-goal 6.4: Ensure state persistence across refreshes

### Parent Goal 7: Update React Flow Integration
- [x] Sub-goal 7.1: Register new node types in `nodeTypes` mapping
- [x] Sub-goal 7.2: Update node creation logic to handle native components
- [x] Sub-goal 7.3: Implement custom edge behavior for native components
- [x] Sub-goal 7.4: Add component-specific context menus

## Implementation Notes

### Component State Interface Design
```typescript
interface ComponentState {
  // Common state for all native components
  locked?: boolean;
  layer?: number;
  
  // Shape-specific state
  shapeType?: 'rectangle' | 'triangle' | 'square';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  
  // Text-specific state
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // Sticky-specific state
  stickyColor?: 'yellow' | 'pink' | 'blue' | 'green';
}
```

### Native Component Node Structure
```typescript
interface NativeComponentNode extends UnifiedComponentNode {
  componentType: 'native';
  nativeType: 'shape' | 'text' | 'sticky';
  state: ComponentState;
  
  // Override source for native components
  source: 'native';
  
  // Native components don't need code fields
  originalCode: '';
  compiledCode?: undefined;
}
```

### Toolbar Position and Design
- Fixed position at top-left of canvas (below existing controls)
- Semi-transparent background with blur effect
- Icon-based buttons with tooltips
- Visual feedback on hover/active states
- Grouping: Shapes | Text | Sticky

### Storage Considerations
- Native components stored alongside ESM components
- State serialized as JSON within node data
- Backward compatibility maintained
- Efficient state updates (only changed properties)

## Testing Strategy
- [ ] Unit tests for each native component type
- [ ] Integration tests for state persistence
- [ ] E2E tests for toolbar interactions
- [ ] Visual regression tests for component rendering
- [ ] Performance tests with many native components

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| State bloat in localStorage | Implement state compression and cleanup |
| Performance with many shapes | Use React.memo and virtualization |
| Complex text editing | Use proven library (e.g., draft-js) |
| Breaking existing saves | Version migration system |

## Timeline Estimate
- Planning: 2 hours ✓
- Implementation: 16-20 hours
  - Architecture: 2-3 hours
  - Components: 8-10 hours
  - Toolbar: 2-3 hours
  - Integration: 4 hours
- Testing: 4-6 hours
- Total: 22-28 hours

## Discussion

### Key Design Decisions

1. **Native vs Generated Components**: Native components will be first-class citizens alongside AI-generated components, using the same node system but with different rendering logic.

2. **State Management**: Each native component will have its own state object stored within the node data, allowing for component-specific properties while maintaining consistency with the existing storage system.

3. **Toolbar Design**: The toolbar will be always visible (not modal) to encourage quick creation of native components, positioned to not interfere with existing UI elements.

4. **Text Editing**: Will use inline editing with contentEditable for simplicity, with potential to upgrade to a more robust solution if needed.

### Open Questions (Resolved)

1. **Q: Should shapes support gradients and patterns?**
   A: Start with solid fills, add gradients in v2 if needed.

2. **Q: How should component layering work?**
   A: Use React Flow's built-in z-index management initially.

3. **Q: Should we support grouping of native components?**
   A: Not in v1, focus on individual components first.

## Next Steps
1. Review and approve this plan
2. Set up development branch
3. Begin with Parent Goal 1 (Architecture)
4. Implement components incrementally
5. Integrate and test thoroughly

## Relevant Files

### Created
- `/apps/frontend/src/types/native-component.types.ts` - Native component type definitions and interfaces
- `/apps/frontend/src/components/native/ShapeNode.tsx` - Shape component with rectangle, triangle, square support
- `/apps/frontend/src/components/native/ShapeCustomizer.tsx` - Shape customization panel for colors and styling
- `/apps/frontend/src/components/native/TextNode.tsx` - Text component with transparent background and inline editing
- `/apps/frontend/src/components/native/TextCustomizer.tsx` - Text formatting panel with font, size, and style options
- `/apps/frontend/src/components/native/StickyNote.tsx` - Sticky note component with color variations and auto-resize
- `/apps/frontend/src/components/native/NativeComponentsToolbar.tsx` - Toolbar for creating native components
- `/apps/frontend/src/components/native/NativeComponentContextMenu.tsx` - Context menu for native component actions (duplicate, layer management, delete)

### Modified  
- `/apps/frontend/src/types/component.types.ts` - Added 'native' to ComponentSource type union
- `/apps/frontend/src/components/ReactFlowCanvas.tsx` - Integrated native components, toolbar, and context menus with layer management
- `/apps/frontend/src/services/StorageService.ts` - Added support for native component state serialization, validation, and migration