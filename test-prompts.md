# Test Prompts for AI Whiteboard POC

## Quick Test Prompts (Copy & Paste)

### Level 1: Simple Components (Target: <2s)
1. **Color Button**: "Create a button that changes color when clicked"
2. **Character Counter**: "Make a text input with character counter"
3. **Toggle Switch**: "Build a toggle switch with on/off states"

### Level 2: Stateful Components (Target: <3s)
4. **Counter**: "Create a counter with increment and decrement buttons"
5. **Color Picker**: "Make a color picker that shows hex value"
6. **Progress Bar**: "Build a progress bar with percentage display"

### Level 3: Interactive Components (Target: <4s)
7. **Todo List**: "Create a todo list with add and delete functionality"
8. **Timer**: "Make a timer with start, pause, and reset controls"
9. **Note Card**: "Build a simple note card with title and content"

### Level 4: Complex Components (Target: <5s)
10. **Calculator**: "Create a calculator with basic math operations"

## Testing Instructions

1. Open http://localhost:5173
2. Click "🤖 Generate AI App" in the menu
3. Paste one of the prompts above
4. Click "Generate"
5. Observe:
   - Generation time (should be displayed)
   - Component renders without errors
   - Component is interactive
   - Component stays positioned when canvas is zoomed/panned

## Expected Results

✅ **Success Indicators:**
- Generation time < 5 seconds
- No console errors
- Component renders with styles
- Interactivity works (clicks, state changes)
- Component follows canvas movements

❌ **Known Issues to Watch:**
- If you see "Component not found" - the code structure wasn't recognized
- If you see syntax errors - Babel transpilation may have failed
- If overlay doesn't move with canvas - viewport sync issue

## Performance Metrics Log

| Prompt | Generation Time | Success | Notes |
|--------|----------------|---------|-------|
| Color Button | _____s | ☐ Yes ☐ No | |
| Counter | _____s | ☐ Yes ☐ No | |
| Todo List | _____s | ☐ Yes ☐ No | |
| Calculator | _____s | ☐ Yes ☐ No | |