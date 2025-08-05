import * as Babel from '@babel/standalone';

/**
 * ESM-aware JSX transpiler that preserves ES module structure
 * Only transpiles JSX syntax while keeping imports/exports intact
 */

export interface ESMTranspileOptions {
  debug?: boolean;
}

export interface ESMTranspileResult {
  success: boolean;
  code?: string;
  error?: string;
  warnings?: string[];
}

export class ESMJsxTranspiler {
  /**
   * Transpile JSX while preserving ESM imports/exports
   */
  transpile(code: string, _options: ESMTranspileOptions = {}): ESMTranspileResult {
    try {
      // Use Babel with JSX preset but preserve ES modules
      const result = Babel.transform(code, {
        presets: [
          'react' // Use the simpler 'react' preset that's available in @babel/standalone
        ],
        filename: 'esm-component.jsx',
        // Keep ES modules intact
        sourceType: 'module',
        // Don't transform modules - only transform JSX
        compact: false,
        retainLines: false
      });

      if (!result.code) {
        throw new Error('Babel transpilation produced no output');
      }

      return {
        success: true,
        code: result.code,
        warnings: []
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: errorMessage,
        warnings: []
      };
    }
  }

  /**
   * Check if code contains JSX that needs transpilation
   */
  containsJSX(code: string): boolean {
    if (typeof code !== 'string') return false;
    
    // Check for JSX patterns
    const jsxPatterns = [
      /<[A-Z]\w*[^>]*>/,                        // React components
      /<(div|span|button|input|form|h[1-6]|p|a|ul|li|table|tbody|tr|td|th|select|textarea|option)[^>]*>/,  // HTML elements
      /<\/[A-Za-z]+>/,                          // Closing tags
      /\s*\w+\s*=\s*{[^}]*}/,                  // JSX props with expressions
    ];
    
    const hasJSXReturn = /return\s*\([\s\n]*</.test(code); // JSX return statements
    const hasJSX = jsxPatterns.some(pattern => pattern.test(code)) || hasJSXReturn;
    
    // Additional string-based checks for common JSX patterns
    const hasReactElements = code.includes('<div') || 
                           code.includes('<span') || 
                           code.includes('<button') ||
                           code.includes('<input') ||
                           code.includes('<form') ||
                           code.includes('<select') ||
                           code.includes('<textarea');
    
    return hasJSX || hasReactElements;
  }
}