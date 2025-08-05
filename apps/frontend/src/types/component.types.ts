/**
 * Unified component type definitions for the AI Whiteboard POC
 * This file contains the shared interfaces used across the component pipeline
 */

/**
 * Component source types
 */
export type ComponentSource = 'ai-generated' | 'library' | 'url-import' | 'user-upload';

/**
 * Component format types
 */
export type ComponentFormat = 'jsx' | 'esm' | 'tsx' | 'compiled';

/**
 * Unified component node interface
 * This is the base interface for all components in the system
 */
export interface UnifiedComponentNode {
  /**
   * Unique identifier for the component
   */
  id: string;

  /**
   * Human-readable name or title
   */
  name?: string;

  /**
   * Component description or prompt that generated it
   */
  description?: string;

  /**
   * Original source code (JSX/TSX/ESM)
   */
  originalCode: string;

  /**
   * Compiled/transpiled JavaScript code ready for execution
   */
  compiledCode?: string;

  /**
   * Hash of the original code for change detection
   */
  originalHash?: string;

  /**
   * Hash of the compiled code for cache validation
   */
  compiledHash?: string;

  /**
   * Timestamp when the component was compiled
   */
  compiledAt?: number;

  /**
   * Source of the component
   */
  source: ComponentSource;

  /**
   * Original format of the component
   */
  format?: ComponentFormat;

  /**
   * URL if imported from external source
   */
  sourceUrl?: string;

  /**
   * Blob URL for ESM modules
   */
  moduleUrl?: string;

  /**
   * Version of the compiler used
   */
  compilerVersion?: string;

  /**
   * Metadata specific to the component source
   */
  metadata?: ComponentMetadata;

  /**
   * Error information if compilation failed
   */
  compilationError?: {
    message: string;
    line?: number;
    column?: number;
    stack?: string;
  };

  /**
   * Performance metrics
   */
  metrics?: {
    compilationTime?: number;
    lastRenderTime?: number;
    renderCount?: number;
    moduleSize?: number;
    dependencies?: string[];
  };
}

/**
 * Metadata that can vary based on component source
 */
export interface ComponentMetadata {
  /**
   * For AI-generated components
   */
  prompt?: string;
  generationTime?: number;
  aiProvider?: string;
  model?: string;

  /**
   * For library components
   */
  category?: string;
  tags?: string[];
  author?: string;
  version?: string;
  thumbnail?: string;

  /**
   * For URL imports
   */
  cdnProvider?: string;
  packageName?: string;
  packageVersion?: string;
  lastFetched?: number;
  etag?: string;
}

/**
 * Pipeline processing result
 */
export interface PipelineResult {
  success: boolean;
  component?: UnifiedComponentNode;
  error?: string;
  warnings?: string[];
  processingTime?: number;
}

/**
 * Cache entry for the component pipeline
 */
export interface CacheEntry {
  key: string;
  component: UnifiedComponentNode;
  timestamp: number;
  hits: number;
  size: number;
}

/**
 * Component validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
}

/**
 * Pipeline options for processing components
 */
export interface PipelineOptions {
  /**
   * Skip compilation if compiledCode exists
   */
  skipIfCompiled?: boolean;

  /**
   * Force recompilation even if cached
   */
  forceRecompile?: boolean;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Validate component after compilation
   */
  validateOutput?: boolean;

  /**
   * Use cache for compilation results
   */
  useCache?: boolean;

  /**
   * Custom compiler options
   */
  compilerOptions?: {
    presets?: string[];
    plugins?: any[];
  };
}

/**
 * URL import options
 */
export interface URLImportOptions {
  /**
   * Allowed domains for import
   */
  allowedDomains?: string[];

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Use cached version if available
   */
  useCache?: boolean;

  /**
   * Validate HTTPS only
   */
  requireHTTPS?: boolean;

  /**
   * Custom headers for the request
   */
  headers?: Record<string, string>;
}

/**
 * Export/Import format for persistence
 */
export interface ExportedCanvas {
  version: string;
  exportedAt: number;
  nodes: ExportedNode[];
  edges?: any[]; // React Flow edges
  metadata?: {
    appVersion?: string;
    compilerVersion?: string;
    nodeCount?: number;
  };
}

/**
 * Exported node format
 */
export interface ExportedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: UnifiedComponentNode;
  width?: number;
  height?: number;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalSize: number;
  nodeCount: number;
  compiledCount: number;
  cacheHitRate: number;
  lastCleanup?: number;
}