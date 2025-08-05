# POC Final Plan: AI Whiteboard with Excalidraw + Cerebras

## Overview
Build an AI-powered whiteboard where users can generate React components with natural language and place them on an Excalidraw canvas.

## Core Features
✅ **Excalidraw canvas** - Full whiteboard functionality  
✅ **AI generation** - Cerebras for < 5 second component creation  
✅ **React overlays** - Interactive components on the canvas  
✅ **Drawing tools** - Annotate and connect apps visually  

---

## Project Setup (30 minutes)

### 1. Create Project
```bash
# Create Vite React app
npm create vite@latest ai-whiteboard-poc -- --template react
cd ai-whiteboard-poc

# Install dependencies
npm install @excalidraw/excalidraw axios

# Create project structure
mkdir -p src/components src/services src/utils
touch .env.local
```

### 2. Environment Configuration
```bash
# .env.local
VITE_CEREBRAS_API_KEY=your_api_key_here
```

### 3. Project Structure
```
ai-whiteboard-poc/
├── src/
│   ├── App.jsx                    # Main app
│   ├── components/
│   │   ├── ExcalidrawCanvas.jsx   # Main canvas component
│   │   ├── GeneratedApp.jsx       # Renders generated components
│   │   ├── GenerationDialog.jsx   # Prompt input UI
│   │   └── AppOverlay.jsx         # Positions apps on canvas
│   ├── services/
│   │   └── cerebras.js            # AI generation service
│   └── utils/
│       └── prompts.js             # Prompt templates
├── .env.local
└── package.json
```

---

## Phase 1: Excalidraw + Cerebras Setup (Day 1)

### Morning: Basic Integration

#### 1. Main App Component
```jsx
// src/App.jsx
import ExcalidrawCanvas from './components/ExcalidrawCanvas';
import './App.css';

function App() {
  return (
    <div className="app">
      <ExcalidrawCanvas />
    </div>
  );
}

export default App;
```

#### 2. Cerebras Service
```javascript
// src/services/cerebras.js
class CerebrasService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.cerebras.ai/v1/chat/completions';
  }

  async generateComponent(prompt) {
    const systemPrompt = `You are an expert React developer. Create a single self-contained React component.
    
    Requirements:
    - Use functional components with hooks (useState, useEffect, etc.)
    - Include ALL styles as inline style objects
    - Make it visually appealing with colors, spacing, and modern design
    - No external dependencies or imports
    - Return ONLY the component code, no markdown or explanations
    - Export as: const Component = () => { ... }; at the end`;

    const startTime = Date.now();

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.1-70b', // or qwen3-coder when available
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a React component: ${prompt}` }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      const generationTime = (Date.now() - startTime) / 1000;

      return {
        success: true,
        code: data.choices[0].message.content,
        generationTime,
        prompt,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default CerebrasService;
```

#### 3. Basic Excalidraw Canvas
```jsx
// src/components/ExcalidrawCanvas.jsx
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import { useState, useCallback } from "react";
import CerebrasService from "../services/cerebras";
import GenerationDialog from "./GenerationDialog";

const cerebras = new CerebrasService(import.meta.env.VITE_CEREBRAS_API_KEY);

const ExcalidrawCanvas = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedApps, setGeneratedApps] = useState([]);

  const handleGenerate = async (prompt) => {
    setIsGenerating(true);
    
    try {
      const result = await cerebras.generateComponent(prompt);
      
      if (result.success) {
        // Add placeholder rectangle to Excalidraw
        const placeholder = {
          id: `app-${Date.now()}`,
          type: "rectangle",
          x: 400,
          y: 200,
          width: 320,
          height: 420,
          strokeColor: "#6366f1",
          backgroundColor: "#ffffff",
          fillStyle: "solid",
          strokeWidth: 2,
          roughness: 0,
          roundness: { type: 3, value: 16 },
        };

        // Add label
        const label = {
          id: `label-${Date.now()}`,
          type: "text",
          x: placeholder.x + 10,
          y: placeholder.y - 30,
          text: `🤖 ${prompt.substring(0, 40)}...`,
          fontSize: 16,
          fontFamily: 1,
        };

        // Update Excalidraw scene
        excalidrawAPI.updateScene({
          elements: [...excalidrawAPI.getSceneElements(), placeholder, label],
        });

        // Store app data for overlay
        setGeneratedApps(prev => [...prev, {
          id: placeholder.id,
          code: result.code,
          prompt: prompt,
          generationTime: result.generationTime,
        }]);

        console.log(`✅ Generated in ${result.generationTime.toFixed(2)}s`);
      } else {
        console.error('Generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
      setShowGenerator(false);
    }
  };

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          appState: {
            viewBackgroundColor: "#fafafa",
            gridSize: 20,
          },
        }}
      >
        <MainMenu>
          <MainMenu.Item onSelect={() => setShowGenerator(true)}>
            🤖 Generate AI App
          </MainMenu.Item>
        </MainMenu>
      </Excalidraw>

      {/* Generation Dialog */}
      {showGenerator && (
        <GenerationDialog
          onGenerate={handleGenerate}
          onClose={() => setShowGenerator(false)}
          isGenerating={isGenerating}
        />
      )}

      {/* Status Display */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        padding: '10px 20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        Apps Generated: {generatedApps.length}
      </div>
    </div>
  );
};

export default ExcalidrawCanvas;
```

#### 4. Generation Dialog
```jsx
// src/components/GenerationDialog.jsx
import { useState } from 'react';

const GenerationDialog = ({ onGenerate, onClose, isGenerating }) => {
  const [prompt, setPrompt] = useState('');

  const examples = [
    "Todo list with checkboxes and delete buttons",
    "Calculator with basic math operations",
    "Timer with start, pause, and reset",
    "Color palette generator",
    "Markdown editor with live preview",
    "Weather widget with temperature display",
    "Note-taking app with categories",
    "Expense tracker with charts",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      zIndex: 10000,
      minWidth: '500px',
    }}>
      <h2 style={{ marginTop: 0 }}>🤖 Generate AI App</h2>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your app in natural language..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            resize: 'vertical',
          }}
          autoFocus
          disabled={isGenerating}
        />
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            style={{
              padding: '10px 20px',
              background: isGenerating ? '#9ca3af' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: isGenerating ? 'wait' : 'pointer',
              flex: 1,
            }}
          >
            {isGenerating ? '⚡ Generating...' : 'Generate App'}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px' }}>
        <h4>Example Prompts:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {examples.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              style={{
                padding: '6px 12px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {isGenerating && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          background: '#fef3c7',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          ⚡ Generating with Cerebras... Should take less than 5 seconds!
        </div>
      )}
    </div>
  );
};

export default GenerationDialog;
```

### Afternoon: Test Generation Speed

#### Test Prompts (Increasing Complexity)
1. "A button that changes color when clicked" - Target: < 2s
2. "Counter with increment and decrement" - Target: < 3s
3. "Todo list with add and delete" - Target: < 4s
4. "Calculator with four operations" - Target: < 5s
5. "Kanban board with drag and drop" - Target: < 6s

#### Success Metrics
- [ ] Average generation time < 5 seconds
- [ ] 80% first-attempt success rate
- [ ] All components render without errors
- [ ] Components are interactive

---

## Phase 2: React Component Overlay (Day 2)

### Morning: Overlay System

```jsx
// src/components/ExcalidrawCanvas.jsx (Enhanced)
import AppOverlay from "./AppOverlay";

const ExcalidrawCanvas = () => {
  // ... previous state ...

  // Render overlay for each generated app
  const renderOverlays = () => {
    if (!excalidrawAPI) return null;

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();

    return generatedApps.map(app => {
      const element = elements.find(el => el.id === app.id);
      if (!element || element.isDeleted) return null;

      return (
        <AppOverlay
          key={app.id}
          app={app}
          element={element}
          appState={appState}
        />
      );
    });
  };

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <Excalidraw ... />
      {renderOverlays()}
    </div>
  );
};
```

```jsx
// src/components/AppOverlay.jsx
import GeneratedApp from './GeneratedApp';

const AppOverlay = ({ app, element, appState }) => {
  const { zoom, scrollX, scrollY } = appState;
  
  // Calculate position
  const left = element.x * zoom + scrollX;
  const top = element.y * zoom + scrollY;
  const width = element.width * zoom;
  const height = element.height * zoom;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        padding: '10px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        borderRadius: '12px',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '2px solid #6366f1',
        pointerEvents: 'auto',
      }}>
        <div style={{
          padding: '8px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
          fontSize: '12px',
          color: '#6b7280',
        }}>
          ⚡ {app.generationTime.toFixed(2)}s | {app.prompt.substring(0, 30)}...
        </div>
        <div style={{ padding: '10px' }}>
          <GeneratedApp code={app.code} />
        </div>
      </div>
    </div>
  );
};

export default AppOverlay;
```

```jsx
// src/components/GeneratedApp.jsx
import { useState, useEffect } from 'react';

const GeneratedApp = ({ code }) => {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Create component from code string
      const func = new Function('React', `
        const { useState, useEffect, useRef, useMemo, useCallback } = React;
        ${code}
        return Component;
      `);
      
      const GeneratedComponent = func(React);
      setComponent(() => GeneratedComponent);
    } catch (err) {
      setError(err.message);
      console.error('Component creation error:', err);
    }
  }, [code]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ef4444' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!Component) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading component...
      </div>
    );
  }

  return <Component />;
};

export default GeneratedApp;
```

### Afternoon: Synchronization & Performance

#### Key Tasks:
1. Sync overlay position on pan/zoom
2. Handle element deletion
3. Optimize re-renders
4. Test with 10+ apps

---

## Phase 3: Polish & Demo (Day 3)

### Morning: UI Enhancements

#### Features to Add:
1. **Generation Stats Dashboard**
   - Total apps generated
   - Average generation time
   - Success rate

2. **Keyboard Shortcuts**
   - `Cmd/Ctrl + G`: Generate new app
   - `Esc`: Close dialogs

3. **Visual Polish**
   - Smooth animations
   - Better loading states
   - Error boundaries

4. **App Management**
   - Delete apps from canvas
   - Regenerate failed apps
   - Copy app code

### Afternoon: Demo Preparation

#### Demo Script:
1. **Opening** (30s)
   - Show empty Excalidraw canvas
   - Explain the concept

2. **First Generation** (1 min)
   - Generate a todo list
   - Show < 5 second speed
   - Interact with the app

3. **Multiple Apps** (2 min)
   - Generate 3-4 different apps
   - Show variety of components
   - Arrange on canvas

4. **Whiteboard Features** (1 min)
   - Draw connections between apps
   - Add annotations
   - Show zoom/pan

5. **Export** (30s)
   - Export canvas as image
   - Show apps remain interactive

---

## Success Criteria Checklist

### Must Have ✅
- [ ] Excalidraw canvas working
- [ ] AI generation < 5 seconds
- [ ] Apps render on canvas
- [ ] Basic interaction works
- [ ] Can generate 5+ different app types

### Should Have 🎯
- [ ] Apps stay synced with canvas
- [ ] Error handling for bad generations
- [ ] Generation stats display
- [ ] Clean visual design

### Nice to Have ⭐
- [ ] Export canvas with apps
- [ ] Copy generated code
- [ ] Keyboard shortcuts
- [ ] Animation polish

---

## Testing Checklist

### Day 1 Testing
- [ ] Excalidraw loads correctly
- [ ] Generation dialog appears
- [ ] Cerebras API connects
- [ ] Placeholder rectangles created
- [ ] Generation time logged

### Day 2 Testing
- [ ] Apps render on rectangles
- [ ] Position stays synced
- [ ] Zoom/pan works correctly
- [ ] Multiple apps work
- [ ] Performance acceptable

### Day 3 Testing
- [ ] Full workflow smooth
- [ ] Demo script works
- [ ] No critical bugs
- [ ] Export functionality
- [ ] 10+ apps without crashes

---

## Common Issues & Solutions

### Issue: CORS with Cerebras API
**Solution**: Use Vite proxy configuration
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api/cerebras': {
        target: 'https://api.cerebras.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cerebras/, ''),
      },
    },
  },
};
```

### Issue: Component Won't Render
**Solution**: Check for these common issues:
- Missing `const Component = `
- Syntax errors in generated code
- External dependencies referenced

### Issue: Overlay Position Drift
**Solution**: Recalculate on every render
```jsx
useEffect(() => {
  const updatePositions = () => {
    // Force re-render of overlays
    forceUpdate();
  };
  
  excalidrawAPI.onChange(updatePositions);
}, [excalidrawAPI]);
```

---

## Final Deliverable

A working POC demonstrating:
1. **Natural language prompt** → Working React app
2. **< 5 second generation** with Cerebras
3. **Professional whiteboard** experience with Excalidraw
4. **Interactive components** on an infinite canvas
5. **Draw and annotate** around generated apps

This POC proves that AI + visual canvas = the future of rapid prototyping!