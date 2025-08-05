interface GenerationResult {
  success: boolean;
  code?: string;
  generationTime?: number;
  prompt?: string;
  error?: string;
}

class CerebrasService {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Use proxy to avoid CORS issues
    // In development: Vite proxy
    // In production: Netlify Function
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    this.baseURL = isLocalhost
      ? '/api/cerebras/v1/chat/completions'  // Vite proxy
      : '/api/cerebras';  // Netlify Function
  }

  async generateComponent(prompt: string): Promise<GenerationResult> {
    // Always use ESM format (ESM-first architecture)
    const systemPrompt = this.getESMSystemPrompt();

    const startTime = Date.now();

    try {
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      // Only send API key for local development (Vite proxy)
      // Netlify Function uses server-side env var
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (isLocalhost) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'qwen-3-coder-480b', // Cerebras fast coding model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a React component: ${prompt}` },
          ],
          temperature: 0.3,
          max_tokens: 20000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cerebras API error:', response.status, errorText);
        return {
          success: false,
          error: `API Error: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();
      const generationTime = (Date.now() - startTime) / 1000;

      // Clean up the generated code based on format
      let code = data.choices[0].message.content;

      // Remove any markdown code blocks
      code = code.replace(/```[\w]*\n?/g, '');
      code = code.replace(/```$/g, '');

      // Always process as ESM format
      code = this.processESMCode(code);

      console.log('Generated code:', code);
      console.log('Generation metrics:', {
        time: generationTime,
        tokens: data.usage?.total_tokens,
        model: data.model,
      });

      return {
        success: true,
        code,
        generationTime,
        prompt,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getESMSystemPrompt(): string {
    return `You are an expert React developer. Create a modern ES module React component.
    
    CRITICAL Requirements:
    - Use JSX syntax normally - it will be transpiled automatically
    - START with: import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
    - Import any needed hooks at the top, don't destructure later
    - Create a functional React component using modern patterns
    - Include ALL styles as inline style objects
    - Make it visually appealing with colors, spacing, and modern design
    - RESPONSIVE DESIGN: Use width: '100%' and height: '100%' for main container
    - Component must fill its container completely - NO fixed pixel dimensions
    - For canvas/threejs: use container dimensions, not fixed sizes
    - Use flexbox with flex: 1 for flexible layouts
    - For responsive canvases: Use ResizeObserver on container, NOT window resize events
    - Canvas/WebGL components MUST observe their container element for size changes
    - END with: export default YourComponentName;
    - Return ONLY the component code, no markdown, no explanations, no backticks
    
    EXTERNAL LIBRARIES:
    - For external libraries, use ES module imports with bare specifiers:
      * import * as THREE from 'three';
      * import { motion } from 'framer-motion';
      * import Chart from 'chart.js/auto';
    - NEVER use require() - this is an ES module environment
    - NEVER assume global variables like window.THREE
    - Common libraries available: three, framer-motion, chart.js, lodash, date-fns, axios
    
    FORBIDDEN:
    - NO require() statements
    - NO CommonJS syntax (module.exports)
    - NO script tags or CDN links
    - NO assuming libraries are global (window.THREE, etc)
    
    Example structure:
    import React, { useState, useEffect } from 'react';
    import * as THREE from 'three'; // if needed
    
    const MyComponent = () => {
      const [count, setCount] = useState(0);
      
      return (
        <div style={{ padding: '20px' }}>
          <h2>Count: {count}</h2>
          <button onClick={() => setCount(count + 1)}>
            Increment
          </button>
        </div>
      );
    };
    
    export default MyComponent;
    
    CANVAS/WEBGL RESPONSIVE PATTERN:
    const containerRef = useRef(null);
    
    useEffect(() => {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          // Update canvas/renderer size here
          if (renderer) renderer.setSize(width, height);
          if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
        }
      });
      
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      
      return () => resizeObserver.disconnect();
    }, [renderer, camera]);
    
    // Container must use 100% width and height
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />`;
  }


  private processESMCode(code: string): string {
    // Check if the code contains JSX (looking for < followed by capital letter or lowercase HTML elements)
    const hasJSX = /<[A-Z]|\<(div|span|button|input|form|h[1-6]|p|a|ul|li|table|tbody|tr|td|th)/g.test(code);
    
    if (hasJSX) {
      // If JSX is present, we need to transpile it
      // For now, we'll return an error message suggesting to use React.createElement
      console.warn('ESM code contains JSX which requires transpilation. Consider using React.createElement instead.');
      
      // Attempt to auto-convert simple JSX to React.createElement
      // This is a simplified conversion and may not handle all cases
      // For production, we should use a proper JSX transformer
    }
    
    // Ensure the code has proper imports
    if (!code.includes('import React')) {
      // Add React import at the beginning
      const hooks = [];
      if (code.includes('useState')) hooks.push('useState');
      if (code.includes('useEffect')) hooks.push('useEffect');
      if (code.includes('useRef')) hooks.push('useRef');
      if (code.includes('useMemo')) hooks.push('useMemo');
      if (code.includes('useCallback')) hooks.push('useCallback');
      
      const hooksImport = hooks.length > 0 ? `, { ${hooks.join(', ')} }` : '';
      code = `import React${hooksImport} from 'react';\n\n${code}`;
    }

    // Ensure the code has a default export
    if (!code.includes('export default')) {
      // Try to find the main component name
      const patterns = [
        /const\s+(\w+)\s*=\s*\(\)\s*=>/, // Arrow function
        /const\s+(\w+)\s*=\s*function/, // Function expression
        /function\s+(\w+)\s*\(/, // Function declaration
      ];

      for (const pattern of patterns) {
        const match = code.match(pattern);
        if (match) {
          // Add export default at the end
          code += `\n\nexport default ${match[1]};`;
          break;
        }
      }
    }

    // Remove any legacy Component assignment
    code = code.replace(/const\s+Component\s*=\s*\w+;?/g, '');

    return code.trim();
  }

}

export default CerebrasService;
