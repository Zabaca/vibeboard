import type {
  CacheEntry,
  ComponentFormat,
  ComponentSource,
  PipelineOptions,
  PipelineResult,
  UnifiedComponentNode,
  URLImportOptions,
} from '../types/component.types.ts';
import { esmExecutor } from '../utils/esmExecutor.ts';
import { ESMJsxTranspiler } from '../utils/esmJsxTranspiler.ts';
import { ImportFixer } from '../utils/importFixer.ts';

/**
 * ComponentPipeline Service
 *
 * Unified pipeline for processing all component types:
 * - AI-generated components
 * - Pre-built library components
 * - URL-imported components
 * - User-uploaded components
 *
 * Features:
 * - Code transformation and compilation
 * - Caching for performance
 * - Hash-based change detection
 * - Error handling and recovery
 * - Performance monitoring
 */
export class ComponentPipeline {
  private esmTranspiler: ESMJsxTranspiler;
  private cache: Map<string, CacheEntry>;
  private compilerVersion: string = '1.0.0';
  private performanceMetrics: Map<string, number[]>;

  constructor() {
    this.esmTranspiler = new ESMJsxTranspiler();
    this.cache = new Map();
    this.performanceMetrics = new Map();
    this.loadCacheFromStorage();
  }

  /**
   * Process a component through the pipeline
   */
  async processComponent(
    component: Partial<UnifiedComponentNode>,
    options: PipelineOptions = {},
  ): Promise<PipelineResult> {
    const startTime = performance.now();

    try {
      // Ensure component has required fields
      if (!(component.originalCode || component.compiledCode)) {
        return {
          success: false,
          error: 'Component must have either originalCode or compiledCode',
        };
      }

      // Create full component node with defaults
      const node: UnifiedComponentNode = {
        id: component.id || this.generateId(),
        originalCode: component.originalCode || '',
        source: component.source || 'ai-generated',
        format: component.format || this.detectFormat(component.originalCode || ''),
        ...component,
      };

      // Always process as ESM (ESM-first architecture)
      return this.processESMComponent(node, options);
    } catch (error) {
      this.recordMetric('compilation_errors', 1);

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('ComponentPipeline error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        processingTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Process an ESM component through the pipeline
   */
  async processESMComponent(
    node: UnifiedComponentNode,
    options: PipelineOptions = {},
  ): Promise<PipelineResult> {
    const startTime = performance.now();

    try {
      // Check cache for ESM modules
      const cacheKey = `esm-${this.getCacheKey(node)}`;
      if (options.useCache && !options.forceRecompile) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.recordMetric('esm_cache_hit', 1);
          return {
            success: true,
            component: cached.component,
            processingTime: performance.now() - startTime,
          };
        }
      }

      // First, fix any missing React hook imports
      let esmCode = node.originalCode;
      const importFixResult = ImportFixer.fixImports(esmCode);

      if (!importFixResult.success) {
        return {
          success: false,
          error: importFixResult.error || 'Failed to fix imports',
          processingTime: performance.now() - startTime,
        };
      }

      esmCode = importFixResult.code || esmCode;

      // Update the node's originalCode with the fixed imports
      if (importFixResult.addedImports && importFixResult.addedImports.length > 0) {
        node.originalCode = esmCode;
      }

      // Check if ESM module contains JSX
      const hasJSX = this.esmTranspiler.containsJSX(esmCode);

      // If this is legacy code that needs ESM conversion
      if (!this.isESMModule(esmCode)) {
        esmCode = esmExecutor.convertToESM(esmCode);
      }

      // If ESM contains JSX, we need to transpile it first
      if (hasJSX) {
        // Use the ESM-aware transpiler to preserve module structure
        const transformResult = this.esmTranspiler.transpile(esmCode, {
          debug: false, // Always disable debug to reduce CPU usage
        });

        if (!(transformResult.success && transformResult.code)) {
          return {
            success: false,
            error: transformResult.error || 'Failed to transpile JSX in ESM module',
            warnings: transformResult.warnings,
            processingTime: performance.now() - startTime,
          };
        }

        esmCode = transformResult.code;

        // Verify that the code is still a valid ESM module after transpilation
        if (!this.isESMModule(esmCode)) {
          return {
            success: false,
            error: 'ESM transpilation unexpectedly removed module structure',
            processingTime: performance.now() - startTime,
          };
        }
      }

      // Store the transpiled code first (before execution attempt)
      node.compiledCode = esmCode;
      node.compiledHash = this.hashCode(esmCode);
      node.originalHash = this.hashCode(node.originalCode);
      node.compiledAt = Date.now();
      node.compilerVersion = `${this.compilerVersion}-esm`;
      node.format = 'esm';

      if (!node.metrics) {
        node.metrics = {};
      }

      // Validate ESM module (attempt execution)
      const validation = await esmExecutor.executeModule(esmCode, {
        debug: options.debug,
        cache: false, // We handle caching at this level
      });

      if (!validation.success) {
        // Return error but include the transpiled component for debugging
        return {
          success: false,
          error: validation.error,
          component: node, // Include the node with transpiled code
          processingTime: performance.now() - startTime,
        };
      }

      // Store successful execution metadata
      node.moduleUrl = validation.moduleUrl;
      node.metrics.compilationTime = validation.metadata?.loadTime || 0;
      node.metrics.moduleSize = validation.metadata?.moduleSize;
      node.metrics.dependencies = validation.metadata?.dependencies;

      // Cache the ESM module
      if (options.useCache) {
        this.addToCache(cacheKey, node);
      }

      // Record metrics
      this.recordMetric('esm_modules_processed', 1);
      this.recordMetric('esm_processing_time', performance.now() - startTime);

      return {
        success: true,
        component: node,
        processingTime: performance.now() - startTime,
      };
    } catch (error) {
      this.recordMetric('esm_processing_errors', 1);

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('ESM processing error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        processingTime: performance.now() - startTime,
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

  // Note: containsJSX method removed - now using esmTranspiler.containsJSX for ESM components

  /**
   * Process a pre-built library component via URL
   * 
   * Note: This method now delegates to processURLComponent for unified architecture.
   * Library components should be accessed via their /components/ URLs.
   */
  async processLibraryComponent(
    component: {
      id?: string;
      name?: string;
      description?: string;
      url: string;  // Now required - must be a URL to the component
      category?: string;
      tags?: string[];
      author?: string;
      version?: string;
      thumbnail?: string;
    },
    options: PipelineOptions = {},
  ): Promise<PipelineResult> {
    // Use URL-only processing for unified architecture
    const result = await this.processURLComponent(component.url, {}, options);
    
    if (result.success && result.component) {
      // Enhance the component with additional metadata if provided
      result.component.name = component.name || result.component.name;
      result.component.description = component.description || result.component.description;
      result.component.metadata = {
        ...result.component.metadata,
        category: component.category,
        tags: component.tags,
        author: component.author,
        version: component.version,
        thumbnail: component.thumbnail,
      };
    }
    
    return result;
  }

  /**
   * Process an AI-generated component
   */
  async processAIComponent(
    code: string,
    prompt: string,
    generationTime: number,
    options: PipelineOptions = {},
  ): Promise<PipelineResult> {
    const detectedFormat = this.detectFormat(code);

    const unifiedComponent: Partial<UnifiedComponentNode> = {
      originalCode: code,
      description: prompt,
      source: 'ai-generated' as ComponentSource,
      format: detectedFormat, // Auto-detect format instead of hardcoding JSX
      metadata: {
        prompt,
        generationTime,
        aiProvider: 'cerebras',
      },
    };

    return this.processComponent(unifiedComponent, options);
  }


  /**
   * Import a component from URL (CDN or local)
   */
  async processURLComponent(
    url: string,
    _urlOptions: URLImportOptions = {},
    _pipelineOptions: PipelineOptions = {},
  ): Promise<PipelineResult> {
    const startTime = performance.now();

    try {
      // Check if it's a local URL (built-in components) or external CDN URL
      const isLocalUrl = url.startsWith('/') || url.startsWith('./');
      const isCDNUrl =
        url.startsWith('https://esm.sh/') ||
        url.startsWith('https://cdn.jsdelivr.net/') ||
        url.startsWith('https://unpkg.com/') ||
        url.startsWith('https://cdn.skypack.dev/');

      // Validate URL format
      if (!isLocalUrl && !isCDNUrl) {
        return {
          success: false,
          error: 'Please provide a valid URL (local /components/ or CDN URL like esm.sh, unpkg, jsdelivr, skypack)',
          processingTime: performance.now() - startTime,
        };
      }

      // Warn about React externals for CDN URLs only
      if (isCDNUrl && !url.includes('?external=react')) {
        console.warn(
          '⚠️  CDN URL should include ?external=react,react-dom to prevent React conflicts',
        );
      }

      let module: any;
      let code: string = '';
      let transpiled: string = '';
      
      if (isLocalUrl) {
        // For local URLs (public directory), fetch the code and create a blob URL
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch component from ${url}: ${response.status} ${response.statusText}`);
        }
        code = await response.text();
        
        // Check if code contains JSX and transpile if needed
        const hasJSX = this.esmTranspiler.containsJSX(code);
        transpiled = code;
        
        if (hasJSX) {
          const transformResult = this.esmTranspiler.transpile(code, {
            debug: false,
          });
          
          if (!transformResult.success || !transformResult.code) {
            throw new Error(`JSX transpilation failed: ${transformResult.error || 'Unknown error'}`);
          }
          
          transpiled = transformResult.code;
        }
        
        // Create a blob URL and import it
        const blob = new Blob([transpiled], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        
        try {
          module = await import(/* @vite-ignore */ blobUrl);
        } finally {
          // Clean up blob URL after import
          URL.revokeObjectURL(blobUrl);
        }
      } else {
        // For CDN URLs, use direct ES module import
        module = await import(/* @vite-ignore */ url);
      }

      // Extract component from module
      let component = null;

      // 1. Check for default export (most common)
      if (module.default && typeof module.default === 'function') {
        component = module.default;
      }
      // 2. Check for named 'Component' export
      else if (module.Component && typeof module.Component === 'function') {
        component = module.Component;
      }
      // 3. Check for any capitalized function export (React component naming convention)
      else {
        const moduleRecord = module as Record<string, unknown>;
        for (const key in moduleRecord) {
          if (
            typeof moduleRecord[key] === 'function' &&
            key !== '__esModule' &&
            /^[A-Z]/.test(key)
          ) {
            component = moduleRecord[key] as React.ComponentType;
            break;
          }
        }
      }

      // 4. If still no component, check if default export might be an object with a component
      if (!component && module.default && typeof module.default === 'object') {
        const defaultObj = module.default as Record<string, unknown>;
        for (const key in defaultObj) {
          if (typeof defaultObj[key] === 'function' && /^[A-Z]/.test(key)) {
            component = defaultObj[key] as React.ComponentType;
            break;
          }
        }
      }

      if (!component) {
        throw new Error(
          'No valid React component found in module. Make sure the URL exports a React component.',
        );
      }

      // Create UnifiedComponentNode for direct import
      const unifiedComponent: UnifiedComponentNode = {
        id: this.generateId(),
        originalCode: code, // Store original code for reference
        compiledCode: transpiled, // Store transpiled code for AsyncComponentLoader
        source: isLocalUrl ? 'library' : 'url-import',
        format: 'esm',
        sourceUrl: url,
        compiledAt: Date.now(),
        compilerVersion: this.compilerVersion,
        description: isLocalUrl ? `Built-in component from ${url}` : `CDN import from ${url}`,
      };

      return {
        success: true,
        component: unifiedComponent,
        processingTime: performance.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('URL import error:', errorMessage);

      return {
        success: false,
        error: `URL import failed: ${errorMessage}`,
        processingTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Detect the format of the code
   */
  private detectFormat(code: string): ComponentFormat {
    // Check for ESM first
    if (this.isESMModule(code)) {
      return 'esm';
    }
    // Check for TypeScript
    if (code.includes(': React.FC') || code.includes('interface') || code.includes('type ')) {
      return 'tsx';
    }
    // Default to JSX for React components
    if (
      code.includes('const Component') ||
      code.includes('function Component') ||
      code.includes('React')
    ) {
      return 'jsx';
    }
    return 'jsx'; // Default
  }

  /**
   * Generate a unique ID for a component
   */
  private generateId(): string {
    return `component-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate a hash for code content
   */
  private hashCode(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache key for a component
   */
  private getCacheKey(component: UnifiedComponentNode): string {
    return `${component.source}-${component.originalHash || this.hashCode(component.originalCode)}`;
  }

  /**
   * Add component to cache
   */
  private addToCache(key: string, component: UnifiedComponentNode): void {
    const entry: CacheEntry = {
      key,
      component: { ...component },
      timestamp: Date.now(),
      hits: 0,
      size: JSON.stringify(component).length,
    };

    this.cache.set(key, entry);
    this.saveCacheToStorage();

    // Limit cache size
    if (this.cache.size > 100) {
      this.pruneCache();
    }
  }

  /**
   * Get component from cache
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (entry) {
      entry.hits++;
      return entry;
    }
    return null;
  }

  /**
   * Prune old cache entries
   */
  private pruneCache(): void {
    const entries = Array.from(this.cache.entries());

    // Sort by least recently used (combination of timestamp and hits)
    entries.sort((a, b) => {
      const scoreA = a[1].timestamp + a[1].hits * 1000000;
      const scoreB = b[1].timestamp + b[1].hits * 1000000;
      return scoreA - scoreB;
    });

    // Remove oldest 25% of cache
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i];

      // Clean up blob URL if it's an ESM module
      if (entry.component.moduleUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(entry.component.moduleUrl);
      }

      this.cache.delete(key);
    }

    this.saveCacheToStorage();
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('componentPipelineCache');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === this.compilerVersion) {
          // Don't restore blob URLs as they won't be valid
          // ESM modules will be regenerated on demand
          const entries = (data.entries as [string, CacheEntry][]).filter(
            ([_key, entry]: [string, CacheEntry]) => {
              // Skip entries with blob URLs as they're no longer valid
              if (entry.component.moduleUrl?.startsWith('blob:')) {
                return false;
              }
              return true;
            },
          );
          this.cache = new Map<string, CacheEntry>(entries);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const data = {
        version: this.compilerVersion,
        entries: Array.from(this.cache.entries()),
      };
      localStorage.setItem('componentPipelineCache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
      // If storage is full, clear old entries
      if (error instanceof DOMException && error.code === 22) {
        this.clearCache();
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    // Clean up blob URLs for ESM modules
    for (const entry of this.cache.values()) {
      if (entry.component.moduleUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(entry.component.moduleUrl);
      }
    }

    this.cache.clear();
    localStorage.removeItem('componentPipelineCache');

    // Also clear ESM executor cache
    esmExecutor.clearCache();

    this.recordMetric('cache_cleared', 1);
  }

  /**
   * Record performance metric
   */
  private recordMetric(name: string, value: number): void {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }
    const metrics = this.performanceMetrics.get(name)!;
    metrics.push(value);

    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<
    string,
    | {
        count: number;
        sum: number;
        average: number;
        median: number;
        min: number;
        max: number;
      }
    | number
    | string
  > {
    const stats: Record<
      string,
      | {
          count: number;
          sum: number;
          average: number;
          median: number;
          min: number;
          max: number;
        }
      | number
      | string
    > = {};

    for (const [name, values] of this.performanceMetrics.entries()) {
      if (values.length === 0) {
        continue;
      }

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      stats[name] = {
        count: values.length,
        sum: Math.round(sum),
        average: Math.round(avg),
        median: Math.round(median),
        min: Math.round(Math.min(...values)),
        max: Math.round(Math.max(...values)),
      };
    }

    // Calculate cache hit rate
    const cacheHits = this.performanceMetrics.get('cache_hit') || [];
    const totalCompilations = this.performanceMetrics.get('successful_compilations') || [];
    if (totalCompilations.length > 0) {
      stats.cacheHitRate = (cacheHits.length / totalCompilations.length) * 100;
    }

    stats.cacheSize = this.cache.size;
    stats.compilerVersion = this.compilerVersion;

    return stats;
  }

  /**
   * Warm up cache with frequently used components
   */
  async warmCache(components: Partial<UnifiedComponentNode>[]): Promise<void> {
    const promises = components.map((component) =>
      this.processComponent(component, {
        useCache: true,
        skipIfCompiled: true,
        debug: false,
      }).catch((error) => {
        console.warn(`Failed to warm cache for component ${component.id}:`, error);
        return null;
      }),
    );

    const results = await Promise.allSettled(promises);
    // Track successful operations for potential future use
    results.filter((r) => r.status === 'fulfilled' && r.value?.success).length;
  }

}
