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
   * Fix missing React hook imports in ESM code
   */
  static fixImports(code: string): ImportFixResult {
    try {
      // Check if this is ESM code with React imports
      const reactImportMatch = code.match(/import\s+React(?:\s*,\s*{([^}]*)})?[\s\S]*?from\s+['"]react['"];?/);
      
      if (!reactImportMatch) {
        // No React import found, can't fix
        return {
          success: true,
          code,
          warnings: ['No React import found, skipping import fixing']
        };
      }

      // Extract currently imported hooks
      const currentImports = reactImportMatch[1] 
        ? reactImportMatch[1].split(',').map(imp => imp.trim()).filter(imp => imp.length > 0)
        : [];

      // Find hooks used in the code but not imported
      const usedHooks = new Set<string>();
      
      for (const hook of this.REACT_HOOKS) {
        // Look for hook usage patterns: hookName( or hookName.
        const hookPattern = new RegExp(`\\b${hook}\\s*\\(`, 'g');
        if (hookPattern.test(code)) {
          usedHooks.add(hook);
        }
      }

      // Find missing imports
      const missingImports = Array.from(usedHooks).filter(
        hook => !currentImports.includes(hook)
      );

      if (missingImports.length === 0) {
        return {
          success: true,
          code,
          warnings: ['All React hooks are properly imported']
        };
      }

      // Create new import statement with missing hooks
      const allImports = [...currentImports, ...missingImports].sort();
      const newImportStatement = `import React, { ${allImports.join(', ')} } from 'react';`;

      // Replace the old import statement
      const fixedCode = code.replace(
        /import\s+React(?:\s*,\s*{[^}]*})?[\s\S]*?from\s+['"]react['"];?/,
        newImportStatement
      );

      return {
        success: true,
        code: fixedCode,
        addedImports: missingImports,
        warnings: missingImports.length > 0 
          ? [`Added missing React hook imports: ${missingImports.join(', ')}`]
          : []
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if code has missing React hook imports without fixing
   */
  static validateImports(code: string): { valid: boolean; missingImports: string[] } {
    const result = this.fixImports(code);
    return {
      valid: !result.addedImports || result.addedImports.length === 0,
      missingImports: result.addedImports || []
    };
  }
}