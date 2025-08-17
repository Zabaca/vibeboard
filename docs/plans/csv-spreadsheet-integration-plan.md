# CSV Spreadsheet Integration Plan

## Objective
Refactor the existing CSV spreadsheet component to fit Stiqr's native component architecture and enhance the canvas paste functionality to automatically detect and render CSV data using the spreadsheet component.

## Context
- **Created**: August 17, 2025
- **Status**: [ ] Not Started / [ ] In Progress / [ ] Completed
- **Complexity**: Medium

## Prerequisites
- Existing CSV spreadsheet component at `/tmp/csv-spread.js`
- Current paste functionality in ReactFlowCanvas that handles text and images
- Native component structure in `apps/frontend/src/components/native/`

## Relevant Resources
### Guides
- Stiqr native component patterns in `CLAUDE.md`
- ESM-first architecture guidelines
- Component pipeline documentation

### Files
- `/tmp/csv-spread.js` - Source CSV component (compiled)
- `apps/frontend/src/components/ReactFlowCanvas.tsx` - Canvas paste logic
- `apps/frontend/src/components/native/` - Target directory for native component
- `apps/frontend/src/utils/ComponentPipeline.ts` - Component processing pipeline
- `apps/frontend/src/utils/importFixer.ts` - Import fixing utilities

### Documentation
- React component patterns in Stiqr
- CSV parsing best practices

## Goals

### Parent Goal 1: Refactor CSV Component as Native Component ✅
- [x] Convert compiled React.createElement syntax to JSX
- [x] Add proper TypeScript types and interfaces
- [x] Follow Stiqr's coding standards (no `any`, explicit types)
- [x] Add proper prop interface for component customization
- [x] Implement proper error handling and validation
- [x] Add component metadata and description
- [x] Create component in `apps/frontend/src/components/native/CSVSpreadsheet.tsx`

### Parent Goal 2: Create CSV Detection Utility ✅
- [x] Create `csvDetector.ts` utility in `apps/frontend/src/utils/`
- [x] Implement `isCSVFormat(text: string): boolean` function
- [x] Add validation for minimum 2 rows requirement
- [x] Handle edge cases (empty cells, quoted fields, various delimiters)
- [x] Add confidence scoring for CSV detection
- [x] Create comprehensive test cases for detection logic

### Parent Goal 3: Enhance Canvas Paste Functionality ✅
- [x] Locate existing paste handler in ReactFlowCanvas.tsx
- [x] Add CSV detection before text rendering
- [x] Integrate CSV component creation when CSV is detected
- [x] Maintain existing text/image paste functionality
- [x] Add user feedback for CSV detection and rendering
- [x] Handle CSV parsing errors gracefully

### Parent Goal 4: Component Integration and Testing
- [x] Add CSV component to native component library
- [ ] Test CSV detection with various data formats
- [ ] Verify component renders correctly in canvas nodes
- [ ] Test paste functionality integration
- [ ] Add error boundaries for CSV component
- [ ] Performance testing with large CSV datasets

## Implementation Notes

### Component Refactoring Requirements
1. **TypeScript Conversion**: Convert from compiled JS to proper TypeScript with:
   ```typescript
   interface CSVSpreadsheetProps {
     initialData?: string[][];
     onDataChange?: (data: string[][]) => void;
     readonly?: boolean;
     maxRows?: number;
     maxColumns?: number;
   }
   ```

2. **Coding Standards Compliance**:
   - No `any` types - use explicit interfaces
   - No `as` casting - use proper type guards
   - Early returns instead of nested conditionals
   - Functional component with hooks
   - Proper error handling

3. **Native Component Structure**:
   ```typescript
   export const CSVSpreadsheet: React.FC<CSVSpreadsheetProps> = ({
     initialData = [['']],
     onDataChange,
     readonly = false,
     maxRows = 100,
     maxColumns = 26
   }) => {
     // Implementation
   };
   
   export default CSVSpreadsheet;
   ```

### CSV Detection Logic
1. **Detection Criteria**:
   - Contains comma separators
   - At least 2 rows of data
   - Consistent column count across rows (±1 tolerance)
   - No more than 50% empty cells
   - Reasonable row/column limits

2. **Detection Function**:
   ```typescript
   interface CSVDetectionResult {
     isCSV: boolean;
     confidence: number;
     rowCount: number;
     columnCount: number;
     parsedData?: string[][];
   }
   
   export function detectCSV(text: string): CSVDetectionResult
   ```

### Paste Integration Points
1. **Existing Handler**: Locate in ReactFlowCanvas.tsx around paste event handling
2. **Detection Order**: 
   1. Check for images first (existing)
   2. Check for CSV format (new)
   3. Fall back to plain text (existing)
3. **Component Creation**: Use existing component pipeline to create CSV nodes

## Testing Strategy

### CSV Detection Tests
- [ ] Valid CSV with 2+ rows
- [ ] Invalid CSV (single row)
- [ ] Mixed data (CSV-like but not CSV)
- [ ] Empty strings and edge cases
- [ ] Large datasets (performance)
- [ ] Quoted fields with commas
- [ ] Inconsistent column counts

### Component Integration Tests
- [ ] Paste CSV data on canvas
- [ ] CSV component renders in node
- [ ] Data editing within component
- [ ] Component persistence and loading
- [ ] Error handling for malformed CSV
- [ ] Performance with large spreadsheets

### User Experience Tests
- [ ] Clear feedback when CSV is detected
- [ ] Graceful fallback to text for non-CSV
- [ ] Component resizing and layout
- [ ] Accessibility compliance

## Risks & Mitigations

### Risk: Performance with Large CSV Data
**Mitigation**: 
- Implement row virtualization for large datasets
- Add maximum size limits (rows/columns)
- Show loading states for large data processing

### Risk: CSV Detection False Positives
**Mitigation**:
- Use confidence scoring
- Allow user to override detection
- Provide clear visual feedback

### Risk: Integration Complexity
**Mitigation**:
- Maintain existing paste functionality
- Add feature flags for gradual rollout
- Comprehensive testing before deployment

## Timeline Estimate
- Planning: 2 hours
- Component Refactoring: 4 hours
- CSV Detection Utility: 3 hours
- Canvas Integration: 3 hours
- Testing & Refinement: 4 hours
- **Total: 16 hours**

## Discussion

### Clarifying Questions Addressed
1. **Component Type**: Native component in `/components/native/`
2. **CSV Format**: Comma-separated values only
3. **Detection Threshold**: Minimum 2 rows
4. **Integration Point**: Canvas paste functionality

### Key Decisions
1. **Separate Concerns**: CSV detection utility separate from component
2. **Graceful Degradation**: Fall back to text if CSV detection fails
3. **Performance**: Implement limits and virtualization for large data
4. **User Control**: Allow manual override of auto-detection

## Relevant Files

**Created:**
- `apps/frontend/src/components/native/CSVSpreadsheet.tsx` - Native CSV spreadsheet component with proper TypeScript types
- `apps/frontend/src/utils/csvDetector.ts` - CSV detection utility with confidence scoring

**Modified:**
- `apps/frontend/src/types/native-component.types.ts` - Added 'csv' type and CSV-specific state properties
- `apps/frontend/src/components/ReactFlowCanvas.tsx` - Added CSV detection to paste handler, CSV component integration, and nodeTypes registration
- `apps/frontend/src/components/native/NativeComponentsToolbar.tsx` - Added CSV spreadsheet button to native components toolbar

### Future Enhancements
- Support for other delimiters (TSV, semicolon)
- Export functionality (CSV download)
- Advanced formatting options
- Formula support for calculations
- Import from file upload