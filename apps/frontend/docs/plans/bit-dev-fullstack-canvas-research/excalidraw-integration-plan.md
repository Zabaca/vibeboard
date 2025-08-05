# Excalidraw Integration Plan for AI-Generated Apps

## Overview
Excalidraw is a powerful open-source whiteboard library that we can extend to support our AI-generated React components.

## Integration Approaches

### Approach 1: Iframe Elements (Simplest) ⭐
**Complexity**: Low
**Time**: 1-2 days

```jsx
import { Excalidraw } from "@excalidraw/excalidraw";
import { useEffect, useState } from "react";

const ExcalidrawCanvas = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [iframeElements, setIframeElements] = useState([]);

  const addGeneratedApp = (code, prompt) => {
    // Create an iframe element in Excalidraw
    const newElement = {
      type: "iframe",
      x: 100,
      y: 100,
      width: 300,
      height: 400,
      link: null, // We'll render this separately
      customData: {
        appCode: code,
        prompt: prompt,
        id: Date.now()
      }
    };

    excalidrawAPI.updateScene({
      elements: [...excalidrawAPI.getSceneElements(), newElement]
    });
  };

  return (
    <>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        renderEmbeddable={(element) => {
          if (element.type === "iframe" && element.customData?.appCode) {
            return (
              <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                <GeneratedApp code={element.customData.appCode} />
              </div>
            );
          }
          return null;
        }}
      />
    </>
  );
};
```

### Approach 2: Custom Element Type (More Control) ⭐⭐
**Complexity**: Medium
**Time**: 2-3 days

```jsx
import { 
  Excalidraw,
  MainMenu,
  WelcomeScreen 
} from "@excalidraw/excalidraw";

const ExcalidrawWithApps = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [generatedApps, setGeneratedApps] = useState(new Map());

  // Register custom element type
  useEffect(() => {
    if (excalidrawAPI) {
      // Add custom tool to toolbar
      excalidrawAPI.registerCustomTool({
        name: "ai-app",
        icon: "🤖",
        trackEvent: { category: "ai-app" },
        perform: (elements, appState) => {
          // Open prompt dialog
          const prompt = window.prompt("Describe your app:");
          if (prompt) {
            generateAndAddApp(prompt);
          }
        }
      });
    }
  }, [excalidrawAPI]);

  const generateAndAddApp = async (prompt) => {
    // Generate with Cerebras
    const code = await generateWithCerebras(prompt);
    
    // Create custom element
    const element = {
      id: `app-${Date.now()}`,
      type: "rectangle", // Use rectangle as base
      x: 200,
      y: 200,
      width: 300,
      height: 400,
      backgroundColor: "#ffffff",
      customData: {
        type: "ai-app",
        code: code,
        prompt: prompt
      }
    };

    // Add to scene
    excalidrawAPI.updateScene({
      elements: [...excalidrawAPI.getSceneElements(), element]
    });

    // Store app data
    generatedApps.set(element.id, { code, prompt });
  };

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onPointerDown={(event, element) => {
          // Handle clicks on AI app elements
          if (element?.customData?.type === "ai-app") {
            // Could open edit dialog, show preview, etc.
          }
        }}
      />
      
      {/* Overlay generated apps on top of rectangles */}
      {Array.from(generatedApps.entries()).map(([id, app]) => {
        const element = excalidrawAPI?.getSceneElements()
          .find(el => el.id === id);
        
        if (!element) return null;
        
        const zoom = excalidrawAPI.getAppState().zoom;
        const scrollX = excalidrawAPI.getAppState().scrollX;
        const scrollY = excalidrawAPI.getAppState().scrollY;
        
        return (
          <div
            key={id}
            style={{
              position: 'absolute',
              left: element.x * zoom + scrollX,
              top: element.y * zoom + scrollY,
              width: element.width * zoom,
              height: element.height * zoom,
              pointerEvents: 'auto',
              border: '2px solid #007bff',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white'
            }}
          >
            <GeneratedApp code={app.code} />
          </div>
        );
      })}
    </div>
  );
};
```

### Approach 3: Foreign Object Pattern (Most Flexible) ⭐⭐⭐
**Complexity**: High
**Time**: 3-4 days

```jsx
// This approach embeds React components directly in the SVG canvas
import { Excalidraw } from "@excalidraw/excalidraw";
import { renderToStaticMarkup } from 'react-dom/server';

const ExcalidrawWithEmbeddedApps = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  // Custom renderer for the canvas
  const renderCustomElements = (elements, appState) => {
    const customElements = elements.filter(el => 
      el.customData?.type === 'ai-app'
    );

    return customElements.map(element => {
      const { x, y, width, height } = element;
      const { zoom, scrollX, scrollY } = appState;

      return (
        <foreignObject
          key={element.id}
          x={x * zoom + scrollX}
          y={y * zoom + scrollY}
          width={width * zoom}
          height={height * zoom}
        >
          <div xmlns="http://www.w3.org/1999/xhtml">
            <GeneratedApp code={element.customData.code} />
          </div>
        </foreignObject>
      );
    });
  };

  return (
    <Excalidraw
      excalidrawAPI={(api) => setExcalidrawAPI(api)}
      renderCustomElements={renderCustomElements}
    />
  );
};
```

## Recommended Approach for POC: Hybrid Solution

**Best of both worlds: Use Excalidraw + Overlay Layer**

```jsx
// src/components/ExcalidrawAICanvas.jsx
import { Excalidraw } from "@excalidraw/excalidraw";
import { useState, useEffect, useRef } from "react";
import CerebrasService from "../services/cerebras";

const ExcalidrawAICanvas = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [apps, setApps] = useState([]);
  const [pendingApp, setPendingApp] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef(null);

  // Initialize Excalidraw with custom settings
  const initialData = {
    elements: [],
    appState: {
      viewBackgroundColor: "#fafafa",
      gridSize: 20,
    },
  };

  // Add placeholder rectangle when app is generated
  const addAppPlaceholder = (code, prompt) => {
    const placeholder = {
      id: `app-${Date.now()}`,
      type: "rectangle",
      x: 300,
      y: 200,
      width: 320,
      height: 420,
      strokeColor: "#007bff",
      backgroundColor: "#ffffff",
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 0, // Make it clean, not sketchy
      roundness: { type: 3, value: 10 }, // Rounded corners
      customData: {
        type: "ai-app",
        prompt: prompt,
        code: code
      }
    };

    // Add text label
    const label = {
      type: "text",
      x: placeholder.x + 10,
      y: placeholder.y - 30,
      text: `🤖 ${prompt.substring(0, 30)}...`,
      fontSize: 16,
      fontFamily: 1,
      textAlign: "left",
      verticalAlign: "top",
    };

    excalidrawAPI.updateScene({
      elements: [...excalidrawAPI.getSceneElements(), placeholder, label],
    });

    // Add to apps list for overlay rendering
    setApps(prev => [...prev, {
      id: placeholder.id,
      code,
      prompt,
      elementId: placeholder.id
    }]);
  };

  // Generate app with Cerebras
  const handleGenerate = async () => {
    const prompt = window.prompt("Describe your app:");
    if (!prompt) return;

    setIsGenerating(true);
    try {
      const cerebras = new CerebrasService(import.meta.env.VITE_CEREBRAS_API_KEY);
      const result = await cerebras.generateComponent(prompt);
      
      if (result.success) {
        addAppPlaceholder(result.code, prompt);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    }
    setIsGenerating(false);
  };

  // Render apps as overlay
  const renderAppOverlays = () => {
    if (!excalidrawAPI) return null;

    const appState = excalidrawAPI.getAppState();
    const elements = excalidrawAPI.getSceneElements();

    return apps.map(app => {
      const element = elements.find(el => el.id === app.elementId);
      if (!element || element.isDeleted) return null;

      // Calculate position based on Excalidraw's viewport
      const { zoom, scrollX, scrollY } = appState;
      const left = element.x * zoom + scrollX;
      const top = element.y * zoom + scrollY;
      const width = element.width * zoom;
      const height = element.height * zoom;

      return (
        <div
          key={app.id}
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            pointerEvents: 'none', // Let Excalidraw handle interactions
            padding: '10px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            pointerEvents: 'auto', // Re-enable for app interaction
          }}>
            <GeneratedApp code={app.code} />
          </div>
        </div>
      );
    });
  };

  return (
    <div ref={containerRef} style={{ height: '100vh', position: 'relative' }}>
      {/* Excalidraw Canvas */}
      <Excalidraw
        initialData={initialData}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        UIOptions={{
          canvasActions: {
            export: false,
            loadScene: false,
            saveToActiveFile: false,
          },
        }}
      >
        <MainMenu>
          <MainMenu.Item onSelect={handleGenerate}>
            🤖 Generate AI App
          </MainMenu.Item>
        </MainMenu>
      </Excalidraw>

      {/* Overlay Layer for Apps */}
      {renderAppOverlays()}

      {/* Generation Status */}
      {isGenerating && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}>
          <div>⚡ Generating with Cerebras...</div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '300px',
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>🎨 AI Whiteboard</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
          <li>Click "🤖 Generate AI App" in menu</li>
          <li>Describe your app in natural language</li>
          <li>App appears on canvas in ~5 seconds</li>
          <li>Draw, annotate, and organize freely!</li>
        </ul>
      </div>
    </div>
  );
};

// Component to render generated apps
const GeneratedApp = ({ code }) => {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const func = new Function('React', `
        const { useState, useEffect, useRef } = React;
        ${code}
        return Component || (() => <div>No component exported</div>);
      `);
      
      const GeneratedComponent = func(React);
      setComponent(() => GeneratedComponent);
    } catch (err) {
      setError(err.message);
    }
  }, [code]);

  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  if (!Component) return <div style={{ padding: '20px' }}>Loading...</div>;
  
  return <Component />;
};

export default ExcalidrawAICanvas;
```

## Installation & Setup

```bash
# Install Excalidraw
npm install @excalidraw/excalidraw

# If you want to customize further
npm install @excalidraw/excalidraw-next  # Beta with more features
```

## Benefits of Using Excalidraw

### What You Get for Free:
✅ **Professional canvas** with pan, zoom, infinite space  
✅ **Drawing tools** to annotate and connect apps  
✅ **Collaboration features** (if needed later)  
✅ **Export capabilities** (PNG, SVG, JSON)  
✅ **Keyboard shortcuts** out of the box  
✅ **Touch support** for tablets  
✅ **Undo/redo** system  
✅ **Selection tools** for multiple elements  
✅ **Copy/paste** functionality  
✅ **Grid snapping** and alignment guides  

### Additional Benefits for Your Use Case:
- Users can **draw arrows** between apps
- **Annotate** with text and shapes
- **Group** related apps together
- **Export** entire whiteboard as image
- **Save/load** canvas state

## POC Implementation Strategy

### Phase 1: Basic Integration (Day 1)
1. Set up Excalidraw
2. Add "Generate AI App" button
3. Create placeholder rectangles for apps
4. Test with simple components

### Phase 2: Overlay System (Day 2)
1. Implement overlay rendering
2. Sync positions with Excalidraw elements
3. Handle zoom/pan updates
4. Test with multiple apps

### Phase 3: Polish (Day 3)
1. Improve visual design
2. Add app management features
3. Performance optimization
4. Create demo

## Comparison with Custom Canvas

| Feature | Custom Canvas | Excalidraw |
|---------|--------------|------------|
| Development Time | 2-3 days | 1-2 days |
| Features | Basic | Comprehensive |
| Drawing Tools | None | Full suite |
| Export | Manual | Built-in |
| Touch Support | Extra work | Built-in |
| Collaboration | Future work | Ready |
| Learning Curve | None | Minimal |
| Customization | Full control | Some limits |

## Recommendation

**Use Excalidraw with the Hybrid Overlay Approach**

Why?
1. **Faster development** - 1-2 days vs 2-3 days
2. **Better features** - Drawing, export, collaboration
3. **Professional feel** - Polished UX out of the box
4. **Future-proof** - Can add collaboration later
5. **User value** - They can annotate and organize visually

The only downside is slightly less control over the exact rendering, but the benefits far outweigh this limitation for a POC.

## Next Steps

1. Install Excalidraw
2. Implement basic integration
3. Add Cerebras generation
4. Test the hybrid approach
5. Iterate based on performance

This gives you the best of both worlds: Excalidraw's powerful canvas with your AI-generated React components!