# Clipboard Paste Canvas Integration Plan

## Objective
Add clipboard paste functionality to the main canvas for both images and text, creating appropriate native nodes when users paste content while the canvas is focused.

## Context
- **Created**: 2025-01-11
- **Status**: [ ] Not Started
- **Complexity**: Medium-High (due to IndexedDB storage requirements)
- **Related**: Vision-enhanced refinement system (already implemented)

## Prerequisites
- Existing native component system (TextNode, StickyNote, etc.)
- Canvas focus detection and keyboard event handling
- Image handling utilities (from vision system)
- **IndexedDB storage layer** (to handle image storage without localStorage limits)

## Relevant Resources

### Guides
- Native components implementation patterns in existing codebase
- React Flow node type system
- Keyboard event handling in ReactFlowCanvas.tsx

### Files Created/Modified
- ✅ `apps/frontend/src/utils/indexedDBUtils.ts` - New IndexedDB wrapper with storage methods
- ✅ `apps/frontend/src/services/StorageService.ts` - Enhanced with IndexedDB integration  
- ✅ `apps/frontend/src/components/StorageManagementDialog.tsx` - New storage management UI
- ✅ `apps/frontend/src/utils/clipboardUtils.ts` - New utility file with clipboard detection and formatting
- ✅ `apps/frontend/src/components/native/ImageNode.tsx` - New ImageNode component with image display and controls
- ✅ `apps/frontend/src/types/native-component.types.ts` - Updated with image component types
- ✅ `apps/frontend/src/components/ReactFlowCanvas.tsx` - Main canvas paste handler with event handling
- `apps/frontend/src/types/component.types.ts` - Type definitions

### Files to Reference
- `apps/frontend/src/components/native/TextNode.tsx` - Pattern for new ImageNode
- `apps/frontend/src/components/native/StickyNote.tsx` - Native component patterns
- `apps/frontend/src/utils/screenshotUtils.ts` - Image handling patterns
- `apps/frontend/src/services/StorageService.ts` - Current storage implementation patterns

## Goals

### Parent Goal 0: Implement IndexedDB Storage Layer (Foundation) ✅
- [x] Sub-goal 0.1: Create `indexedDBUtils.ts` wrapper with database initialization
- [x] Sub-goal 0.2: Add object stores for images, canvas data, and metadata
- [x] Sub-goal 0.3: Implement image storage methods (save/load/delete/list)
- [x] Sub-goal 0.4: Add canvas data persistence with image references
- [x] Sub-goal 0.5: Create migration utilities from localStorage to IndexedDB
- [x] Sub-goal 0.6: Add robust error handling and localStorage fallback
- [x] Sub-goal 0.7: Implement storage quota monitoring and cleanup
- [x] Sub-goal 0.8: Add storage usage indicators and management UI

### Parent Goal 1: Create Clipboard Utilities ✅
- [x] Sub-goal 1.1: Create `clipboardUtils.ts` with image paste detection
- [x] Sub-goal 1.2: Add text paste detection and formatting utilities
- [x] Sub-goal 1.3: Add format detection (plain text, HTML, code, etc.)
- [x] Sub-goal 1.4: Add image validation and size limits

### Parent Goal 2: Implement ImageNode Component ✅
- [x] Sub-goal 2.1: Create `ImageNode.tsx` component following native component patterns
- [x] Sub-goal 2.2: Add image display with proper aspect ratio handling
- [x] Sub-goal 2.3: Add resize handles and drag functionality
- [x] Sub-goal 2.4: Add image metadata display (format, size, dimensions)
- [x] Sub-goal 2.5: Add image export/save functionality
- [x] Sub-goal 2.6: Register ImageNode as new React Flow node type

### Parent Goal 3: Canvas Paste Event Handling ✅
- [x] Sub-goal 3.1: Add global paste event listener to ReactFlowCanvas
- [x] Sub-goal 3.2: Implement canvas focus detection to avoid conflicts
- [x] Sub-goal 3.3: Add paste event filtering (ignore when input/textarea focused)
- [x] Sub-goal 3.4: Add viewport center calculation for new node placement
- [x] Sub-goal 3.5: Add keyboard shortcut indication in UI

### Parent Goal 4: Text Paste Integration
- [ ] Sub-goal 4.1: Detect text paste and create TextNode instances
- [ ] Sub-goal 4.2: Handle multi-line text formatting
- [ ] Sub-goal 4.3: Add smart content detection (code vs plain text)
- [ ] Sub-goal 4.4: Integrate with existing TextNode component

### Parent Goal 5: Image Paste Integration  
- [ ] Sub-goal 5.1: Detect image paste and create ImageNode instances
- [ ] Sub-goal 5.2: Convert clipboard image to optimized format
- [ ] Sub-goal 5.3: Store images in IndexedDB and create blob URLs for display
- [ ] Sub-goal 5.4: Handle multiple image formats (PNG, JPEG, WebP)
- [ ] Sub-goal 5.5: Add paste feedback (loading states, error handling)
- [ ] Sub-goal 5.6: Implement image cleanup when nodes are deleted

### Parent Goal 6: User Experience & Polish
- [ ] Sub-goal 6.1: Add visual paste indicators/hints
- [ ] Sub-goal 6.2: Add toast notifications for successful pastes
- [ ] Sub-goal 6.3: Add error handling for unsupported formats
- [ ] Sub-goal 6.4: Add keyboard shortcut documentation
- [ ] Sub-goal 6.5: Ensure accessibility compliance

## Implementation Details

### New ImageNode Component Structure
```typescript
interface ImageNodeData {
  imageId: string;       // Reference to IndexedDB stored image
  blobUrl?: string;      // Runtime blob URL for display (not persisted)
  alt?: string;          // Alt text for accessibility
  format: string;        // 'png', 'jpeg', 'webp', etc.
  sizeKB: number;        // File size in KB
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  metadata?: {
    pastedAt: number;
    originalSize?: { width: number; height: number };
    compressed: boolean; // Whether image was optimized
  };
}
```

### Clipboard Utils Interface
```typescript
interface ClipboardResult {
  success: boolean;
  type: 'text' | 'image' | 'unsupported';
  data?: string;         // Text content or image data URL
  format?: string;       // MIME type or text format
  metadata?: {
    sizeKB?: number;
    dimensions?: { width: number; height: number };
  };
  error?: string;
}
```

### Canvas Paste Handler Flow
1. Listen for paste events on document when canvas is focused
2. Prevent default if clipboard contains supported content
3. Determine content type (image vs text)
4. **For images**: Compress → Store in IndexedDB → Create blob URL → Create ImageNode
5. **For text**: Create TextNode directly (no storage needed)
6. Add node to React Flow at viewport center
7. Show success feedback to user

## Testing Strategy

### Manual Testing
- [ ] Paste images from various sources (browser, design tools, screenshots)
- [ ] Paste text content (plain text, code, HTML)
- [ ] Test paste behavior when inputs are focused (should be ignored)
- [ ] Test with large images (should be optimized)
- [ ] Test unsupported formats (should show error)

### Edge Cases
- [ ] Multiple rapid pastes
- [ ] Very large images (>10MB)
- [ ] Empty clipboard
- [ ] Permission denied errors
- [ ] Canvas not focused scenarios

### Integration Testing
- [ ] Verify ImageNode works with existing canvas features (save/load, export)
- [ ] Test TextNode integration doesn't break existing functionality
- [ ] Verify keyboard shortcuts don't conflict with existing ones
- [ ] Test IndexedDB fallback to localStorage in case of storage failures
- [ ] Test storage migration from old localStorage-only data
- [ ] Verify storage quota handling doesn't break existing workflows

## User Experience Flow

### Image Paste Flow
1. User copies image from external source
2. User clicks on canvas to focus it
3. User presses Ctrl+V
4. System detects image in clipboard
5. New ImageNode created at center of viewport
6. User can immediately drag/resize the image
7. Toast notification: "Image pasted successfully"

### Text Paste Flow
1. User copies text from external source
2. User clicks on canvas to focus it  
3. User presses Ctrl+V
4. System detects text in clipboard
5. New TextNode created with pasted content
6. User can edit text inline or move node
7. Toast notification: "Text pasted successfully"

## Security Considerations
- Validate image formats before processing
- Limit maximum image size to prevent memory issues
- Sanitize text content to prevent XSS
- Use data URLs instead of file system access

## Performance Considerations
- Optimize large images before creating nodes
- Debounce rapid paste events
- Use requestIdleCallback for non-critical processing
- Implement lazy loading for image display

## Accessibility
- Add proper alt text support for ImageNode
- Ensure keyboard navigation works with new nodes
- Add ARIA labels for paste functionality
- Support screen reader announcements for paste success

## Future Enhancements (Out of Scope)
- Drag and drop support for images
- Rich text formatting for TextNode
- Integration with vision analysis system
- Batch paste operations
- Paste from URLs

## Risks & Mitigations

### Risk: Browser compatibility for clipboard API
- **Mitigation**: Feature detection and graceful fallback
- **Testing**: Test on Safari, Firefox, Chrome

### Risk: Large images causing performance issues  
- **Mitigation**: Image optimization, size limits, and IndexedDB storage
- **Implementation**: Compress images on paste, store in IndexedDB, use blob URLs for display

### Risk: IndexedDB not supported or failing
- **Mitigation**: Graceful fallback to localStorage with size warnings
- **Implementation**: Feature detection and hybrid storage approach

### Risk: Conflicts with existing keyboard shortcuts
- **Mitigation**: Proper event handling and focus detection
- **Testing**: Verify paste only works when canvas focused

## Timeline Estimate
- **Planning**: 0.5 days (completed)
- **IndexedDB storage layer**: 2.5 days (new foundation requirement)
- **Clipboard utilities**: 1 day
- **ImageNode component**: 2 days  
- **Canvas integration**: 1.5 days
- **Testing & polish**: 1.5 days
- **Total**: 8.5 days

## Success Criteria
- [ ] Users can paste images from clipboard and they appear as draggable ImageNodes
- [ ] Users can paste text from clipboard and it creates TextNodes
- [ ] Paste only works when canvas is focused (doesn't interfere with input fields)
- [ ] Large images are automatically optimized and stored in IndexedDB
- [ ] Canvas save/load works seamlessly with images (no localStorage limits)
- [ ] Clear user feedback for successful/failed paste operations
- [ ] No performance degradation with multiple pasted images
- [ ] Feature works across Chrome, Firefox, and Safari
- [ ] Graceful fallback when IndexedDB is unavailable

## Discussion
- Decided to focus on canvas-only paste to avoid complexity with edit dialog
- Will reuse existing TextNode component for text paste consistency
- New ImageNode will follow same patterns as other native components
- Simple paste at viewport center rather than complex cursor tracking
- **Added IndexedDB requirement**: localStorage 5MB limit makes image storage impractical
- **Storage strategy**: Images in IndexedDB, metadata in localStorage, blob URLs for display
- **Migration planned**: Seamless upgrade from localStorage-only to hybrid approach