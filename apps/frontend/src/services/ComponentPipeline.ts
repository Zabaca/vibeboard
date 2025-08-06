import { esmExecutor } from '../utils/esmExecutor.ts';
import { ESMJsxTranspiler } from '../utils/esmJsxTranspiler.ts';
import { ImportFixer } from '../utils/importFixer.ts';
import type {
  UnifiedComponentNode,
  ComponentSource,
  ComponentFormat,
  PipelineResult,
  PipelineOptions,
  CacheEntry,
  URLImportOptions,
} from '../types/component.types.ts';

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
    options: PipelineOptions = {}
  ): Promise<PipelineResult> {
    const startTime = performance.now();
    
    try {
      // Ensure component has required fields
      if (!component.originalCode && !component.compiledCode) {
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
      console.log('🚀 Processing component as ESM');
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
    options: PipelineOptions = {}
  ): Promise<PipelineResult> {
    const startTime = performance.now();
    
    try {
      // Check cache for ESM modules
      const cacheKey = `esm-${this.getCacheKey(node)}`;
      if (options.useCache && !options.forceRecompile) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          if (options.debug) {
            console.log('✅ ESM cache hit for component:', node.id);
          }
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
      
      if (importFixResult.addedImports && importFixResult.addedImports.length > 0 && options.debug) {
        console.log(`🔧 Fixed missing imports: ${importFixResult.addedImports.join(', ')}`);
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
        if (options.debug) {
          console.log('📦 Converting legacy code to ESM format');
        }
        esmCode = esmExecutor.convertToESM(esmCode);
      }
      
      // If ESM contains JSX, we need to transpile it first
      if (hasJSX) {
        // Use the ESM-aware transpiler to preserve module structure
        const transformResult = this.esmTranspiler.transpile(esmCode, {
          debug: false, // Always disable debug to reduce CPU usage
        });
        
        if (!transformResult.success || !transformResult.code) {
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
        if (options.debug) {
          console.log(`⚠️  ESM execution failed: ${validation.error}`);
          console.log('💾 Transpiled code saved, execution error returned');
        }
        
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
      /^import\s+/m,                          // import statements
      /^export\s+default/m,                   // default export
      /^export\s+{/m,                        // named exports
      /^export\s+(const|let|var|function|class)/m,  // export declarations
    ];
    
    return esmPatterns.some(pattern => pattern.test(code));
  }

  // Note: containsJSX method removed - now using esmTranspiler.containsJSX for ESM components

  /**
   * Process a pre-built library component
   */
  async processLibraryComponent(
    component: any,
    options: PipelineOptions = {}
  ): Promise<PipelineResult> {
    // Convert legacy library component to unified format
    const unifiedComponent: Partial<UnifiedComponentNode> = {
      id: component.id,
      name: component.name,
      description: component.description,
      originalCode: component.code,
      source: 'library' as ComponentSource,
      format: 'jsx' as ComponentFormat,
      metadata: {
        category: component.category,
        tags: component.tags,
        author: component.author,
        version: component.version,
        thumbnail: component.thumbnail,
      },
    };

    return this.processComponent(unifiedComponent, {
      ...options,
      useCache: true,
    });
  }

  /**
   * Process an AI-generated component
   */
  async processAIComponent(
    code: string,
    prompt: string,
    generationTime: number,
    options: PipelineOptions = {}
  ): Promise<PipelineResult> {
    const detectedFormat = this.detectFormat(code);
    
    if (options.debug) {
      console.log(`🤖 Processing AI-generated component (detected format: ${detectedFormat})`);
      console.log(`📝 Prompt: ${prompt.substring(0, 50)}...`);
    }
    
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
   * Import a component from CDN URL
   */
  async processURLComponent(
    url: string,
    _urlOptions: URLImportOptions = {},
    pipelineOptions: PipelineOptions = {}
  ): Promise<PipelineResult> {
    const startTime = performance.now();
    
    try {
      // Validate it's a CDN URL
      const isCDNUrl = url.startsWith('https://esm.sh/') || 
                      url.startsWith('https://cdn.jsdelivr.net/') ||
                      url.startsWith('https://unpkg.com/') ||
                      url.startsWith('https://cdn.skypack.dev/');
      
      if (!isCDNUrl) {
        return {
          success: false,
          error: 'Please provide a valid CDN URL (esm.sh, unpkg, jsdelivr, or skypack)',
          processingTime: performance.now() - startTime,
        };
      }

      // Ensure the URL has ?external=react,react-dom for React components
      if (!url.includes('?external=react')) {
        console.warn('⚠️  CDN URL should include ?external=react,react-dom to prevent React conflicts');
      }
      
      if (pipelineOptions.debug) {
        console.log('🚀 ComponentPipeline: Direct CDN import:', url);
      }
      
      // Direct ES module import - no blob URLs, no processing
      const module = await import(/* @vite-ignore */ url);
      
      // Extract component from module
      let component = null;
      
      if (pipelineOptions.debug) {
        console.log('🔍 Analyzing CDN module exports:', Object.keys(module));
      }
      
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
        for (const key in module) {
          if (typeof module[key] === 'function' && 
              key !== '__esModule' && 
              /^[A-Z]/.test(key)) {
            component = module[key];
            if (pipelineOptions.debug) {
              console.log(`🎯 Found component via capitalized export: ${key}`);
            }
            break;
          }
        }
      }
      
      // 4. If still no component, check if default export might be an object with a component
      if (!component && module.default && typeof module.default === 'object') {
        for (const key in module.default) {
          if (typeof module.default[key] === 'function' && /^[A-Z]/.test(key)) {
            component = module.default[key];
            if (pipelineOptions.debug) {
              console.log(`🎯 Found component in default object: ${key}`);
            }
            break;
          }
        }
      }
      
      if (!component) {
        throw new Error('No valid React component found in module. Make sure the URL exports a React component.');
      }
      
      // Create UnifiedComponentNode for direct import
      const unifiedComponent: UnifiedComponentNode = {
        id: this.generateId(),
        originalCode: '', // No source code for CDN imports
        compiledCode: '', // Component is already compiled
        source: 'url-import',
        format: 'esm',
        sourceUrl: url,
        compiledAt: Date.now(),
        compilerVersion: this.compilerVersion,
        description: `CDN import from ${url}`,
      };
      
      if (pipelineOptions.debug) {
        console.log('✅ ComponentPipeline: CDN import successful!');
      }
      
      return {
        success: true,
        component: unifiedComponent,
        processingTime: performance.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('CDN import error:', errorMessage);
      
      return {
        success: false,
        error: `CDN import failed: ${errorMessage}`,
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
    if (code.includes('const Component') || code.includes('function Component') || code.includes('React')) {
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
      hash = ((hash << 5) - hash) + char;
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
      const scoreA = a[1].timestamp + (a[1].hits * 1000000);
      const scoreB = b[1].timestamp + (b[1].hits * 1000000);
      return scoreA - scoreB;
    });

    // Remove oldest 25% of cache
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i];
      
      // Clean up blob URL if it's an ESM module
      if (entry.component.moduleUrl && entry.component.moduleUrl.startsWith('blob:')) {
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
          const entries = data.entries.filter(([_key, entry]: [string, CacheEntry]) => {
            // Skip entries with blob URLs as they're no longer valid
            if (entry.component.moduleUrl && entry.component.moduleUrl.startsWith('blob:')) {
              return false;
            }
            return true;
          });
          this.cache = new Map(entries);
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
      if (entry.component.moduleUrl && entry.component.moduleUrl.startsWith('blob:')) {
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
  getPerformanceStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, values] of this.performanceMetrics.entries()) {
      if (values.length === 0) continue;
      
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
    console.log(`🔥 Warming cache with ${components.length} components...`);
    
    const promises = components.map(component =>
      this.processComponent(component, {
        useCache: true,
        skipIfCompiled: true,
        debug: false,
      }).catch(error => {
        console.warn(`Failed to warm cache for component ${component.id}:`, error);
        return null;
      })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    
    console.log(`✅ Cache warming complete: ${successful}/${components.length} components cached`);
  }

  /**
   * Warm cache with library components in background
   */
  async warmCacheWithLibraryComponents(): Promise<void> {
    try {
      const { compiledComponents } = await import('../data/compiledComponents.generated.ts');
      
      if (compiledComponents && compiledComponents.length > 0) {
        // Warm cache with compiled components in background
        setTimeout(() => {
          this.warmCache(compiledComponents.map((comp: any) => ({
            id: comp.id,
            originalCode: comp.originalCode,
            compiledCode: comp.compiledCode,
            source: 'library' as const,
          })));
        }, 2000); // Delay to not block initial app load
      }
    } catch (error) {
      console.warn('Could not warm cache with library components:', error);
    }
  }
}