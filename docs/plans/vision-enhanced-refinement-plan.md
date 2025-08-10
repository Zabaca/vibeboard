# Vision Enhanced Refinement Plan

## Objective
Enhance the component refinement workflow by capturing screenshots of rendered components and using vision AI to provide visual context to the code generation process, enabling more accurate and visually-aware component improvements.

## Context
- **Created**: 2025-01-09
- **Status**: [ ] Not Started / [ ] In Progress / [ ] Completed
- **Complexity**: High

## Prerequisites
- Groq API key with vision model access (✅ Already configured)
- Existing edit component modal functionality
- Current Cerebras integration with qwen-3-coder model
- React Flow canvas with rendered components

## Relevant Resources

### Guides
- [Vision AI Testing Results](../test-vision-verified.js) - Successfully tested Groq Llama-4-Maverick
- [Component Pipeline Architecture](../../apps/frontend/src/services/ComponentPipeline.ts)
- [Cerebras AI Service](../../apps/frontend/src/services/cerebras.ts)

### Files to Modify
- `apps/frontend/src/components/ReactFlowCanvas.tsx` - Add screenshot capture
- `apps/frontend/src/components/ComponentNode.tsx` - Individual component screenshot
- `apps/frontend/src/components/EditComponentModal.tsx` - Display screenshot + vision metadata
- `apps/frontend/src/services/cerebras.ts` - Two-step generation workflow
- `apps/frontend/src/services/vision.ts` - New vision service for Groq
- `apps/frontend/src/utils/screenshotUtils.ts` - New screenshot utilities
- `apps/frontend/src/types/ComponentTypes.ts` - Add vision metadata types

### Documentation
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [dom-to-image Documentation](https://github.com/tsayen/dom-to-image)
- [Groq Vision API Documentation](https://console.groq.com/docs/vision)
- [Canvas.toBlob() MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

## Goals

### Parent Goal 1: Implement Component Screenshot Capture System ✅
- [x] Sub-goal 1.1: Research and select screenshot library (html2canvas vs dom-to-image vs native) ✅
- [x] Sub-goal 1.2: Create `screenshotUtils.ts` with component capture functions ✅
- [x] Sub-goal 1.3: Implement WebP compression with 85% quality and PNG fallback ✅
- [x] Sub-goal 1.4: Add screenshot capture method to ComponentNode component ✅
- [x] Sub-goal 1.5: Handle edge cases (empty components, loading states, errors) ✅
- [x] Sub-goal 1.6: Test screenshot quality and compression ratios ✅

### Parent Goal 2: Create Vision Analysis Service ✅
- [x] Sub-goal 2.1: Create new `vision.ts` service for Groq API integration ✅
- [x] Sub-goal 2.2: Implement base64 image encoding with 4MB size validation ✅
- [x] Sub-goal 2.3: Design vision prompts for component analysis based on user refinement requests ✅
- [x] Sub-goal 2.4: Add error handling for vision API failures ✅
- [x] Sub-goal 2.5: Create TypeScript interfaces for vision analysis responses ✅
- [x] Sub-goal 2.6: Add rate limiting and retry logic for vision API calls ✅

### Parent Goal 3: Enhance Component Metadata with Vision Data ✅
- [x] Sub-goal 3.1: Extend UnifiedComponentNode interface with vision metadata ✅
- [x] Sub-goal 3.2: Store screenshot data URL in component metadata ✅
- [x] Sub-goal 3.3: Store vision analysis results in component metadata ✅
- [x] Sub-goal 3.4: Add timestamp and version tracking for vision data ✅
- [x] Sub-goal 3.5: Implement cleanup for old/unused screenshot data ✅
- [x] Sub-goal 3.6: Export/import vision metadata with component data ✅

### Parent Goal 4: Enhance Edit Component Modal UI
- [ ] Sub-goal 4.1: Trigger screenshot capture when edit modal opens
- [ ] Sub-goal 4.2: Display captured screenshot in modal UI with proper styling
- [ ] Sub-goal 4.3: Show vision analysis results in expandable metadata section
- [ ] Sub-goal 4.4: Add loading states during screenshot capture and vision analysis
- [ ] Sub-goal 4.5: Handle capture/analysis failures gracefully in UI
- [ ] Sub-goal 4.6: Add option to retake screenshot and re-analyze if needed

### Parent Goal 5: Implement Two-Step AI Generation Workflow
- [ ] Sub-goal 5.1: Modify cerebras.ts to support vision-enhanced prompts
- [ ] Sub-goal 5.2: Create vision analysis step that processes screenshot + user prompt
- [ ] Sub-goal 5.3: Pass vision analysis results as context to qwen-3-coder
- [ ] Sub-goal 5.4: Update system prompts to utilize visual context effectively
- [ ] Sub-goal 5.5: Add fallback to original workflow if vision step fails
- [ ] Sub-goal 5.6: Log and track vision enhancement effectiveness metrics

## Implementation Notes

### Screenshot Compression Strategy
```javascript
// Preferred: WebP with 85% quality
canvas.toBlob(callback, 'image/webp', 0.85);

// Fallback: PNG with compression
if (!webpSupported) {
  canvas.toBlob(callback, 'image/png');
}
```

### Component Metadata Extension
```typescript
interface VisionMetadata {
  screenshot?: {
    dataUrl: string;
    format: 'webp' | 'png';
    capturedAt: number;
    sizeKB: number;
  };
  visionAnalysis?: {
    analysis: string;
    analyzedAt: number;
    prompt: string;
    model: string;
    confidence?: number;
  };
}

interface UnifiedComponentNode extends ExistingInterface {
  visionMetadata?: VisionMetadata;
}
```

### Vision Prompt Design
Structure prompts to extract:
- Visual layout and styling details
- Component structure and hierarchy  
- Color scheme and design patterns
- UI/UX issues visible in screenshot
- Specific elements mentioned in user's refinement request

### Two-Step Generation Flow
1. **Vision Step**: Analyze screenshot + user prompt → Visual context
2. **Code Step**: Use visual context + current code + user prompt → New code

## Testing Strategy

### Screenshot Capture Testing
- [ ] Test with various component sizes and types
- [ ] Verify WebP/PNG compression ratios
- [ ] Test on different browsers and devices
- [ ] Validate image quality for AI analysis

### Vision Analysis Testing
- [ ] Test with different component types (simple, complex, styled)
- [ ] Verify vision analysis accuracy and relevance
- [ ] Test API error scenarios and fallbacks
- [ ] Measure latency and optimize prompts

### Metadata Storage Testing
- [ ] Test component export/import with vision data
- [ ] Verify metadata persistence across sessions
- [ ] Test cleanup of outdated vision data
- [ ] Validate UI display of metadata

### Integration Testing
- [ ] End-to-end refinement workflow with vision
- [ ] Compare results with/without vision enhancement
- [ ] Test modal UI responsiveness and UX
- [ ] Validate code generation improvements

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Screenshot library performance issues | High | Test multiple libraries, implement lazy loading |
| Vision API rate limits | Medium | Add rate limiting, retry logic, graceful fallbacks |
| Large image sizes cause API failures | High | Implement image compression and size validation |
| Browser compatibility for screenshot capture | Medium | Provide fallbacks, test across browsers |
| Component metadata size growth | Medium | Implement cleanup strategies, compression |
| Vision analysis doesn't improve results | Low | A/B test, provide metrics tracking |
| Increased latency in refinement flow | Medium | Optimize prompts, add progress indicators |

## Timeline Estimate
- **Planning**: 1 day (completed)
- **Screenshot Implementation**: 2-3 days
- **Vision Service**: 2 days  
- **Metadata Enhancement**: 1-2 days
- **Modal UI Enhancement**: 2 days
- **AI Workflow Integration**: 2-3 days
- **Testing & Polish**: 2-3 days
- **Total**: 10-13 days

## Discussion

### Key Design Decisions Made
1. **Library Selection**: Will evaluate html2canvas vs dom-to-image for best results
2. **Compression**: WebP at 85% quality with PNG fallback for optimal size/quality
3. **UI Placement**: Screenshot and vision analysis shown in edit modal metadata section
4. **Vision Model**: Groq Llama-4-Maverick confirmed working in tests
5. **Data Storage**: Vision metadata stored as part of component data structure
6. **Fallback Strategy**: Original workflow continues if vision fails

### Success Metrics
- Screenshot capture success rate > 95%
- Vision analysis completion rate > 90% 
- User engagement with vision metadata display
- Measurable improvement in generated code quality
- Acceptable latency increase (< 5 seconds additional)
- Metadata size stays manageable (< 100KB per component)

## Relevant Files

### Created Files
- `apps/frontend/src/utils/screenshotUtils.ts` - Screenshot capture utilities with html2canvas integration and WebP compression
- `apps/frontend/src/components/ScreenshotTest.tsx` - Test component for validating screenshot functionality
- `apps/frontend/src/services/vision.ts` - Vision analysis service with Groq API integration, image validation, and error handling

### Modified Files
- `apps/frontend/src/types/component.types.ts` - Added VisionMetadata interface with screenshot and analysis metadata, version tracking fields
- `apps/frontend/src/components/ComponentNode.tsx` - Added screenshot capture functionality with camera button and callback handlers
- `apps/frontend/src/components/ReactFlowCanvas.tsx` - Added handleScreenshotCapture, handleVisionAnalysisComplete, and cleanupVisionData functions for complete vision metadata management
- `apps/frontend/package.json` - Added html2canvas dependency

### Implementation Priorities
1. **Phase 1**: Basic screenshot capture and storage ✅ **COMPLETED**
2. **Phase 2**: Vision analysis service integration ✅ **COMPLETED**
3. **Phase 3**: Enhanced component metadata with vision data ✅ **COMPLETED**
4. **Phase 4**: UI enhancements and metadata display
5. **Phase 5**: Two-step AI generation workflow
6. **Phase 6**: Performance optimization and polish