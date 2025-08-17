/**
 * Import Fixer - Automatically adds missing React hook imports
 * Detects usage of React hooks and ensures they are imported
 */

export interface ImportFixResult {
  success: boolean;
  code?: string;
  error?: string;
  warnings?: string[];
  addedImports?: string[];
}

export class ImportFixer {
  /**
   * React hooks that might be missing from imports
   */
  private static readonly REACT_HOOKS = [
    'useState',
    'useEffect',
    'useRef',
    'useMemo',
    'useCallback',
    'useContext',
    'useReducer',
    'useLayoutEffect',
    'useImperativeHandle',
    'useDebugValue',
    'useDeferredValue',
    'useTransition',
    'useId',
    'useSyncExternalStore',
    'useInsertionEffect',
  ];

  /**
   * Fix unsafe cleanup patterns in AI-generated code
   */
  private static fixCleanupPatterns(code: string): string {
    let fixedCode = code;
    
    // Fix unsafe removeChild patterns - be more comprehensive
    fixedCode = fixedCode.replace(
      /(\w+)\.current\.removeChild\(([^)]+)\)/g,
      'if ($1.current && $1.current.contains && $1.current.contains($2)) { $1.current.removeChild($2); }'
    );
    
    // Fix direct DOM element removeChild calls
    fixedCode = fixedCode.replace(
      /(\w+)\.removeChild\(([^)]+)\)/g,
      'if ($1 && $1.contains && typeof $1.contains === "function" && $1.contains($2)) { $1.removeChild($2); }'
    );
    
    // Fix unsafe renderer.domElement.parentNode patterns (common in Three.js)
    fixedCode = fixedCode.replace(
      /(\w+)\.domElement\.parentNode\.removeChild\(([^)]+)\)/g,
      'if ($1.domElement?.parentNode && $1.domElement.parentNode.contains && $1.domElement.parentNode.contains($2)) { $1.domElement.parentNode.removeChild($2); }'
    );
    
    // Fix unsafe DOM element access in cleanup functions
    fixedCode = fixedCode.replace(
      /return\s*\(\)\s*=>\s*{([^}]*(?:containerRef|ref)\.current[^}]*(?:removeChild|appendChild)[^}]*)}/g,
      (match, cleanupBody) => {
        // Wrap entire cleanup in try-catch
        return `return () => {
          try {
            ${cleanupBody}
          } catch (cleanupError) {
            console.warn('🔧 Component cleanup handled safely:', cleanupError.message);
          }
        }`;
      }
    );
    
    // Fix unsafe renderer.domElement access
    fixedCode = fixedCode.replace(
      /(\w+)\.domElement\.removeEventListener/g,
      '$1.domElement?.removeEventListener'
    );
    
    // Wrap Three.js specific cleanup methods
    if (fixedCode.includes('THREE') || fixedCode.includes('renderer')) {
      fixedCode = fixedCode.replace(
        /(renderer\.dispose\(\)|renderer\.clear\(\)|scene\.dispose\(\))/g,
        'try { $1 } catch (e) { console.warn("Three.js cleanup warning:", e); }'
      );
    }
    
    return fixedCode;
  }

  /**
   * Fix missing React hook imports in ESM code
   */
  static fixImports(code: string): ImportFixResult {
    try {
      // Check if this is ESM code with React imports
      const reactImportMatch = code.match(
        /import\s+React(?:\s*,\s*{([^}]*)})?[\s\S]*?from\s+['"]react['"];?/,
      );

      if (!reactImportMatch) {
        // No React import found, can't fix
        return {
          success: true,
          code,
          warnings: ['No React import found, skipping import fixing'],
        };
      }

      // Extract currently imported hooks
      const currentImports = reactImportMatch[1]
        ? reactImportMatch[1]
            .split(',')
            .map((imp) => imp.trim())
            .filter((imp) => imp.length > 0)
        : [];

      // Find hooks used in the code but not imported
      const usedHooks = new Set<string>();

      for (const hook of ImportFixer.REACT_HOOKS) {
        // Look for hook usage patterns: hookName( or hookName.
        const hookPattern = new RegExp(`\\b${hook}\\s*\\(`, 'g');
        if (hookPattern.test(code)) {
          usedHooks.add(hook);
        }
      }

      // Find missing imports
      const missingImports = Array.from(usedHooks).filter((hook) => !currentImports.includes(hook));

      if (missingImports.length === 0) {
        // Still apply cleanup pattern fixes even if imports are correct
        const cleanedCode = ImportFixer.fixCleanupPatterns(code);
        const hasCleanupFixes = cleanedCode !== code;
        
        return {
          success: true,
          code: cleanedCode,
          warnings: hasCleanupFixes 
            ? ['All React hooks are properly imported', 'Applied safer cleanup patterns for DOM operations']
            : ['All React hooks are properly imported'],
        };
      }

      // Create new import statement with missing hooks
      const allImports = [...currentImports, ...missingImports].sort();
      const newImportStatement = `import React, { ${allImports.join(', ')} } from 'react';`;

      // Replace the old import statement
      let fixedCode = code.replace(
        /import\s+React(?:\s*,\s*{[^}]*})?[\s\S]*?from\s+['"]react['"];?/,
        newImportStatement,
      );

      // Apply cleanup pattern fixes to prevent runtime errors
      fixedCode = ImportFixer.fixCleanupPatterns(fixedCode);

      const warnings = [];
      if (missingImports.length > 0) {
        warnings.push(`Added missing React hook imports: ${missingImports.join(', ')}`);
      }
      
      // Check if cleanup patterns were fixed
      if (fixedCode !== code.replace(/import\s+React(?:\s*,\s*{[^}]*})?[\s\S]*?from\s+['"]react['"];?/, newImportStatement)) {
        warnings.push('Applied safer cleanup patterns for DOM operations');
      }

      return {
        success: true,
        code: fixedCode,
        addedImports: missingImports,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if code has missing React hook imports without fixing
   */
  static validateImports(code: string): { valid: boolean; missingImports: string[] } {
    const result = ImportFixer.fixImports(code);
    return {
      valid: !result.addedImports || result.addedImports.length === 0,
      missingImports: result.addedImports || [],
    };
  }
}
