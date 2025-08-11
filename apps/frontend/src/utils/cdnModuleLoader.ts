/**
 * CDN Module Loader - Handles loading ES modules from CDNs with proper import resolution
 *
 * This utility solves the problem of loading external ESM modules that have
 * server-relative imports which don't work in blob URL contexts.
 */

// Removed unused import

export interface CDNModuleLoaderOptions {
  debug?: boolean;
  cache?: boolean;
}

export class CDNModuleLoader {
  private cache = new Map<string, any>();

  /**
   * Load a module from a CDN URL, resolving all imports properly
   */
  async load(url: string, options: CDNModuleLoaderOptions = {}): Promise<any> {
    if (options.cache && this.cache.has(url)) {
      if (options.debug) {
        console.log(`📦 Loading from cache: ${url}`);
      }
      return this.cache.get(url);
    }

    try {
      if (options.debug) {
        console.log(`🌐 Fetching module from: ${url}`);
      }

      // First, try to load and follow any re-exports
      const code = await this.loadAndBundle(url, options);

      if (options.debug) {
        console.log('📝 Original code (first 500 chars):', code.substring(0, 500));
      }

      // Try different loading strategies based on what the code looks like
      const module = await this.tryLoadStrategies(code, url, options);

      if (module) {
        if (options.cache) {
          this.cache.set(url, module);
        }
        return module;
      }
      throw new Error('Failed to load module with any strategy');
    } catch (error) {
      if (options.debug) {
        console.error(`❌ Failed to load module from ${url}:`, error);
      }
      throw error;
    }
  }

  /**
   * Rewrite imports in the code to absolute URLs
   */
  private rewriteImports(code: string, sourceUrl: string, options: CDNModuleLoaderOptions): string {
    // Parse the source URL to get the origin
    const url = new URL(sourceUrl);
    const origin = url.origin;

    let rewrittenCode = code;

    // Handle all forms of imports/exports with server-relative paths
    rewrittenCode = rewrittenCode.replace(
      /((?:import|export)\s+(?:\*|\{[^}]*\}|\w+)?(?:\s+(?:as\s+\w+)?)?(?:\s+from)?\s*)['"]([^'"]+)['"]/g,
      (match, prefix, importPath) => {
        // Only rewrite if it's a server-relative path
        if (importPath.startsWith('/') && !importPath.startsWith('//')) {
          const absoluteUrl = `${origin}${importPath}`;
          if (options.debug) {
            console.log(`  Rewriting: ${importPath} → ${absoluteUrl}`);
          }
          return `${prefix}'${absoluteUrl}'`;
        }
        return match;
      },
    );

    // Make sure the code is still recognized as ESM
    // Add a comment to ensure it's treated as a module
    if (!(code.includes('export') || code.includes('import'))) {
      rewrittenCode = `// ESM Module\n${rewrittenCode}\nexport default null;`;
    }

    return rewrittenCode;
  }

  /**
   * Recursively load and bundle a module with its dependencies
   */
  private async loadAndBundle(
    url: string,
    options: CDNModuleLoaderOptions,
    depth = 0,
  ): Promise<string> {
    if (depth > 5) {
      throw new Error('Maximum dependency depth exceeded');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    let code = await response.text();

    // Check if this has BOTH a re-export AND actual code (esm.sh issue)
    const reExportMatch = code.match(/^export\s+\*\s+from\s+['"]([^'"]+)['"]/m);
    const hasActualExports =
      /export\s+{[^}]+}/m.test(code) || /export\s+(const|let|var|function|class)/m.test(code);

    if (reExportMatch && hasActualExports) {
      // This is the problematic case - strip the re-export line
      if (options.debug) {
        console.log(`  Stripping duplicate re-export from ${url}`);
      }
      code = code.replace(/^export\s+\*\s+from\s+['"][^'"]+['"];?\s*\n?/m, '');
    } else if (reExportMatch && !hasActualExports) {
      // This is a pure re-export, follow it
      const targetPath = reExportMatch[1];
      let targetUrl: string;

      if (targetPath.startsWith('/')) {
        // Server-relative path
        const urlObj = new URL(url);
        targetUrl = `${urlObj.origin}${targetPath}`;
      } else if (targetPath.startsWith('http')) {
        targetUrl = targetPath;
      } else if (targetPath.startsWith('./') || targetPath.startsWith('../')) {
        // Relative path
        targetUrl = new URL(targetPath, url).href;
      } else {
        // Bare import - might be a CDN-specific path
        targetUrl = new URL(targetPath, url).href;
      }

      if (options.debug) {
        console.log(`  Following re-export: ${url} → ${targetUrl}`);
      }

      // Recursively load the target module
      return this.loadAndBundle(targetUrl, options, depth + 1);
    }

    // Check if this has relative imports that need resolving
    if (code.includes("from './") || code.includes('from "../')) {
      code = this.rewriteImports(code, url, options);
    }

    return code;
  }

  /**
   * Try multiple CDN strategies to load a module
   */
  async loadWithFallback(packageName: string, options: CDNModuleLoaderOptions = {}): Promise<any> {
    const strategies = [
      // Strategy 1: unpkg direct file (often the simplest)
      {
        name: 'unpkg direct',
        url: `https://unpkg.com/${packageName}/nanoid.js`,
      },
      // Strategy 2: jsDelivr ESM (pre-bundled)
      {
        name: 'jsDelivr +esm',
        url: `https://cdn.jsdelivr.net/npm/${packageName}/+esm`,
      },
      // Strategy 3: esm.sh with standalone flag
      {
        name: 'esm.sh standalone',
        url: `https://esm.sh/${packageName}?standalone`,
      },
      // Strategy 4: esm.sh with bundle flag
      {
        name: 'esm.sh bundle',
        url: `https://esm.sh/${packageName}?bundle`,
      },
      // Strategy 5: Skypack
      {
        name: 'Skypack',
        url: `https://cdn.skypack.dev/${packageName}`,
      },
      // Strategy 6: unpkg with module flag
      {
        name: 'unpkg module',
        url: `https://unpkg.com/${packageName}?module`,
      },
    ];

    const errors: Array<{ strategy: string; error: string }> = [];

    for (const strategy of strategies) {
      if (options.debug) {
        console.log(`\n🔄 Trying ${strategy.name}...`);
      }

      try {
        const module = await this.load(strategy.url, options);
        if (options.debug) {
          console.log(`✅ Success with ${strategy.name}!`);
        }
        return module;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({ strategy: strategy.name, error: errorMsg });
        if (options.debug) {
          console.log(`❌ ${strategy.name} failed: ${errorMsg}`);
        }
      }
    }

    // All strategies failed
    const errorReport = errors.map((e) => `  - ${e.strategy}: ${e.error}`).join('\n');

    throw new Error(`Failed to load ${packageName} from any CDN:\n${errorReport}`);
  }

  /**
   * Try different loading strategies for the module
   */
  private async tryLoadStrategies(
    code: string,
    _url: string,
    options: CDNModuleLoaderOptions,
  ): Promise<any> {
    const strategies = [
      // Strategy 1: Direct evaluation as a function (for IIFE modules)
      async () => {
        if (options.debug) {
          console.log('🔄 Trying Strategy 1: Direct evaluation...');
        }
        try {
          // Create a function that returns the module
          const moduleFunc = new Function(
            'window',
            'global',
            'exports',
            'module',
            `${code}\nreturn (typeof exports !== "undefined" ? exports : {});`,
          );
          const exports = {};
          const module = { exports };
          const global = window;
          const result = moduleFunc(window, global, exports, module);

          // Check what we got
          const finalExports = module.exports || exports || result;
          if (options.debug) {
            console.log('  Result type:', typeof finalExports);
            console.log('  Keys:', Object.keys(finalExports));
          }

          // Look for the main export
          if (typeof finalExports === 'function') {
            return finalExports;
          }
          if (finalExports.default && typeof finalExports.default === 'function') {
            return finalExports.default;
          }
          if (finalExports.nanoid && typeof finalExports.nanoid === 'function') {
            return finalExports.nanoid;
          }

          // Return the whole exports object
          return finalExports;
        } catch (e) {
          if (options.debug) {
            console.log('  Strategy 1 failed:', e instanceof Error ? e.message : String(e));
          }
          return null;
        }
      },

      // Strategy 2: Try as ESM with blob URL
      async () => {
        if (options.debug) {
          console.log('🔄 Trying Strategy 2: ESM via blob URL...');
        }
        try {
          // The code is already valid ESM, but we need to handle it properly
          const finalCode = code;

          // Check what kind of exports we have
          const hasNamedExport = /export\s+\{[^}]*nanoid[^}]*\}/m.test(code);
          const hasDefaultExport = /export\s+default/m.test(code);
          const hasDirectExport = /export\s+(let|const|var|function)\s+nanoid/m.test(code);

          if (options.debug) {
            console.log(`  Has named export with nanoid: ${hasNamedExport}`);
            console.log(`  Has default export: ${hasDefaultExport}`);
            console.log(`  Has direct export: ${hasDirectExport}`);
          }

          // Create a blob URL for the module
          const blob = new Blob([finalCode], { type: 'application/javascript' });
          const blobUrl = URL.createObjectURL(blob);

          try {
            // Import the module directly
            const module = await import(/* @vite-ignore */ blobUrl);

            if (options.debug) {
              console.log('  Module imported:', module);
              console.log('  Module keys:', Object.keys(module));
            }

            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);

            // Extract the function we need
            if (typeof module.nanoid === 'function') {
              return module.nanoid;
            }
            if (typeof module.default === 'function') {
              return module.default;
            }
            if (module.default && typeof module.default.nanoid === 'function') {
              return module.default.nanoid;
            }

            // Return the whole module if we can't find the specific function
            return module;
          } catch (importError) {
            URL.revokeObjectURL(blobUrl);
            throw importError;
          }
        } catch (e) {
          if (options.debug) {
            console.log('  Strategy 2 failed:', e instanceof Error ? e.message : String(e));
          }
          return null;
        }
      },

      // Strategy 3: Script tag injection (last resort)
      async () => {
        if (options.debug) {
          console.log('🔄 Trying Strategy 3: Script tag injection...');
        }
        try {
          // Create a unique global name
          const globalName = `__cdnModule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Wrap the code to capture exports
          const wrappedCode = `
            (function() {
              var exports = {};
              var module = { exports: exports };
              ${code}
              window['${globalName}'] = module.exports || exports;
            })();
          `;

          // Create and inject script
          const script = document.createElement('script');
          script.textContent = wrappedCode;
          document.head.appendChild(script);

          // Get the module from global
          const moduleExports = (window as any)[globalName];

          // Clean up
          document.head.removeChild(script);
          delete (window as any)[globalName];

          if (options.debug) {
            console.log('  Module from global:', typeof moduleExports);
          }

          // Extract the function
          if (typeof moduleExports === 'function') {
            return moduleExports;
          }
          if (moduleExports && typeof moduleExports.nanoid === 'function') {
            return moduleExports.nanoid;
          }
          if (moduleExports && typeof moduleExports.default === 'function') {
            return moduleExports.default;
          }

          return moduleExports;
        } catch (e) {
          if (options.debug) {
            console.log('  Strategy 3 failed:', e instanceof Error ? e.message : String(e));
          }
          return null;
        }
      },
    ];

    // Try each strategy in order
    for (const strategy of strategies) {
      const result = await strategy();
      if (result) {
        if (options.debug) {
          console.log('✅ Strategy succeeded!');
        }
        return result;
      }
    }

    return null;
  }

  /**
   * Clear the module cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const cdnModuleLoader = new CDNModuleLoader();
