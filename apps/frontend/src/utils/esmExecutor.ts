import React from 'react';

/**
 * ESM Executor for dynamic module loading and execution
 * Provides infrastructure for loading ES modules dynamically using blob URLs
 * Works with import maps to ensure React singleton pattern
 */

export interface ESMExecutionOptions {
  debug?: boolean;
  cache?: boolean;
  timeout?: number;
}

export interface ESMExecutionResult {
  success: boolean;
  component?: React.ComponentType;
  error?: string;
  warnings?: string[];
  moduleUrl?: string;
  metadata?: {
    loadTime: number;
    moduleSize: number;
    dependencies?: string[];
  };
}

export interface ModuleCacheEntry {
  url: string;
  component: React.ComponentType;
  timestamp: number;
  hits: number;
}

export class ESMExecutor {
  private moduleCache: Map<string, ModuleCacheEntry> = new Map();
  private blobUrls: Set<string> = new Set();
  private pendingImports: Map<string, Promise<unknown>> = new Map();

  /**
   * Execute an ESM module and extract the React component
   */
  async executeModule(
    code: string,
    options: ESMExecutionOptions = {},
  ): Promise<ESMExecutionResult> {
    const startTime = performance.now();

    try {
      // Check if code is already an ESM module
      if (!this.isESMModule(code)) {
        return {
          success: false,
          error: 'Code is not a valid ES module. Use legacy executor for non-ESM code.',
        };
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(code);

      // Check cache if enabled
      if (options.cache && this.moduleCache.has(cacheKey)) {
        const cached = this.moduleCache.get(cacheKey)!;
        cached.hits++;

        if (options.debug) {
          console.log('✅ ESM module loaded from cache:', cacheKey);
        }

        return {
          success: true,
          component: cached.component,
          moduleUrl: cached.url,
          metadata: {
            loadTime: performance.now() - startTime,
            moduleSize: code.length,
          },
        };
      }

      // Resolve imports in the code
      const resolvedCode = await this.resolveImports(code, options);

      // Create blob URL for the module
      const moduleUrl = this.createModuleUrl(resolvedCode);

      // Import the module with timeout
      const module = await this.importWithTimeout(moduleUrl, options.timeout);

      // Extract component from module
      const component = this.extractComponent(module);

      if (!component) {
        throw new Error('No valid React component found in module');
      }

      // Cache the result if enabled
      if (options.cache) {
        this.addToCache(cacheKey, moduleUrl, component);
      }

      const loadTime = performance.now() - startTime;

      if (options.debug) {
        console.log(`✅ ESM module loaded successfully in ${loadTime.toFixed(2)}ms`);
      }

      return {
        success: true,
        component,
        moduleUrl,
        metadata: {
          loadTime,
          moduleSize: code.length,
          dependencies: this.extractDependencies(code),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (options.debug) {
        console.error('❌ ESM execution failed:', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        metadata: {
          loadTime: performance.now() - startTime,
          moduleSize: code.length,
        },
      };
    }
  }

  /**
   * Check if code is an ESM module
   */
  private isESMModule(code: string): boolean {
    // Check for ESM syntax patterns
    const esmPatterns = [
      /^import\s+/m, // import statements
      /^export\s+default/m, // default export
      /^export\s+{/m, // named exports
      /^export\s+(const|let|var|function|class)/m, // export declarations
    ];

    return esmPatterns.some((pattern) => pattern.test(code));
  }

  /**
   * Resolve imports in the code
   */
  private async resolveImports(code: string, options: ESMExecutionOptions): Promise<string> {
    let resolvedCode = code;

    // Pattern to match import statements
    const importPattern = /import\s+(?:(.+?)\s+from\s+)?['"]([@\w\-/.]+)['"]/g;
    const matches = [...code.matchAll(importPattern)];

    for (const match of matches) {
      const [fullMatch, importClause, moduleSpecifier] = match;

      // Resolve the module URL
      const resolvedUrl = this.resolveModuleUrl(moduleSpecifier);

      // Only replace if we actually resolved to a different URL
      // This allows import maps to handle React modules unchanged
      if (resolvedUrl !== moduleSpecifier) {
        const newImport = importClause
          ? `import ${importClause} from '${resolvedUrl}'`
          : `import '${resolvedUrl}'`;

        resolvedCode = resolvedCode.replace(fullMatch, newImport);

        if (options.debug) {
          console.log(`📦 Resolved import: ${moduleSpecifier} → ${resolvedUrl}`);
        }
      } else if (options.debug) {
        console.log(`📦 No resolution needed: ${moduleSpecifier}`);
      }
    }

    return resolvedCode;
  }

  /**
   * Resolve module specifier to a URL
   */
  private resolveModuleUrl(specifier: string): string {
    // Handle different types of imports

    // 1. Already a full URL
    if (specifier.startsWith('http://') || specifier.startsWith('https://')) {
      return specifier;
    }

    // 2. Relative imports (keep as-is for blob URLs)
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      return specifier;
    }

    // 3. Core React modules - import maps don't work in blob URLs, so resolve directly to shims
    // These shims export the singleton React instance from window.React
    // Use full URLs to ensure proper resolution from blob URL contexts
    const baseUrl = window.location.origin;
    if (specifier === 'react') {
      return `${baseUrl}/shims/react.js`;
    }
    if (specifier === 'react-dom' || specifier === 'react-dom/client') {
      return `${baseUrl}/shims/react-dom.js`;
    }
    if (specifier === 'react/jsx-runtime') {
      return `${baseUrl}/shims/react-jsx-runtime.js`;
    }

    // 4. Other node modules / bare imports - use ESM CDN
    // Note: We used to have explicit mappings here, but now our default logic
    // handles all packages consistently with ?external=react,react-dom

    // Default: Use ESM.sh for all other packages
    // ESM.sh handles both scoped (@org/pkg) and regular packages (pkg or pkg/subpath)
    // Always use external=react,react-dom to prevent any potential React duplication
    // ESM.sh will ignore the parameter for packages that don't use React
    return `https://esm.sh/${specifier}?external=react,react-dom`;
  }

  /**
   * Create a blob URL for the module
   */
  private createModuleUrl(code: string): string {
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    // Track blob URLs for cleanup
    this.blobUrls.add(url);

    return url;
  }

  /**
   * Import module with timeout
   */
  private async importWithTimeout(url: string, timeout: number = 5000): Promise<unknown> {
    // Check if already importing this URL
    if (this.pendingImports.has(url)) {
      return this.pendingImports.get(url);
    }

    const importPromise = import(/* @vite-ignore */ url);

    // Store pending import
    this.pendingImports.set(url, importPromise);

    try {
      // Race between import and timeout
      const module = await Promise.race([
        importPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Module import timeout')), timeout),
        ),
      ]);

      return module;
    } finally {
      // Clean up pending import
      this.pendingImports.delete(url);
    }
  }

  /**
   * Extract React component from module
   */
  private extractComponent(module: unknown): React.ComponentType | null {
    const mod = module as Record<string, unknown>;
    
    // Check for default export
    if (mod.default && typeof mod.default === 'function') {
      return mod.default as React.ComponentType;
    }

    // Check for named export 'Component'
    if (mod.Component && typeof mod.Component === 'function') {
      return mod.Component as React.ComponentType;
    }

    // Check for any function export
    for (const key in mod) {
      if (typeof mod[key] === 'function' && key !== '__esModule' && /^[A-Z]/.test(key)) {
        // React component naming convention
        return mod[key] as React.ComponentType;
      }
    }

    return null;
  }

  /**
   * Extract dependencies from code
   */
  private extractDependencies(code: string): string[] {
    const importPattern = /import\s+.*?\s+from\s+['"]([@\w\-/.]+)['"]/g;
    const dependencies: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = importPattern.exec(code)) !== null) {
      dependencies.push(match[1]);
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Generate cache key for code
   */
  private generateCacheKey(code: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `esm-${Math.abs(hash).toString(36)}`;
  }

  /**
   * Add module to cache
   */
  private addToCache(key: string, url: string, component: React.ComponentType): void {
    const entry: ModuleCacheEntry = {
      url,
      component,
      timestamp: Date.now(),
      hits: 0,
    };

    this.moduleCache.set(key, entry);

    // Limit cache size
    if (this.moduleCache.size > 50) {
      this.pruneCache();
    }
  }

  /**
   * Prune old cache entries
   */
  private pruneCache(): void {
    const entries = Array.from(this.moduleCache.entries());

    // Sort by least recently used
    entries.sort((a, b) => {
      const scoreA = a[1].timestamp + a[1].hits * 1000000;
      const scoreB = b[1].timestamp + b[1].hits * 1000000;
      return scoreA - scoreB;
    });

    // Remove oldest 25%
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i];
      this.moduleCache.delete(key);

      // Also revoke blob URL if it exists
      if (this.blobUrls.has(entry.url)) {
        URL.revokeObjectURL(entry.url);
        this.blobUrls.delete(entry.url);
      }
    }
  }

  /**
   * Clear all cached modules and blob URLs
   */
  clearCache(): void {
    // Revoke all blob URLs
    for (const url of this.blobUrls) {
      URL.revokeObjectURL(url);
    }

    this.blobUrls.clear();
    this.moduleCache.clear();
    this.pendingImports.clear();
  }

  /**
   * Convert legacy component format to ESM
   */
  convertToESM(legacyCode: string): string {
    // Check if already ESM
    if (this.isESMModule(legacyCode)) {
      return legacyCode;
    }

    // Extract the component definition
    const componentMatch = legacyCode.match(/const\s+Component\s*=\s*([\s\S]+)/);
    if (!componentMatch) {
      throw new Error('Could not find Component definition in legacy code');
    }

    // Build ESM module - using standard imports that will be resolved by import maps
    const esmCode = `
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

${legacyCode}

export default Component;
`;

    return esmCode.trim();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    urls: number;
  } {
    let totalHits = 0;
    for (const entry of this.moduleCache.values()) {
      totalHits += entry.hits;
    }

    return {
      size: this.moduleCache.size,
      hits: totalHits,
      urls: this.blobUrls.size,
    };
  }
}

// Export singleton instance
export const esmExecutor = new ESMExecutor();
