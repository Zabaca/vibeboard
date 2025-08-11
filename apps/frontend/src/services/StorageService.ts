/**
 * StorageService - Enhanced storage and persistence for the AI Whiteboard POC
 *
 * Features:
 * - Handles UnifiedComponentNode structure with compiled code
 * - Compression for large payloads
 * - Storage size monitoring and cleanup
 * - Versioning for migration support
 * - IndexedDB integration for image storage
 * - Fallback to localStorage for compatibility
 */

import type { Edge, Node } from '@xyflow/react';
import { z } from 'zod';
import type {
  ExportedCanvas,
  ExportedNode,
  StorageStats,
  UnifiedComponentNode,
} from '../types/component.types.ts';
import type { NativeComponentNode } from '../types/native-component.types.ts';
import { indexedDBUtils } from '../utils/indexedDBUtils.ts';

// Zod schemas for validation (currently unused but kept for future use)
// const storageVersionInfoSchema = z.object({
//   version: z.string(),
//   appVersion: z.string(),
//   compilerVersion: z.string(),
//   migratedAt: z.number().optional(),
// });

// const compressedDataSchema = z.object({
//   compressed: z.boolean(),
//   data: z.string(),
//   originalSize: z.number(),
//   compressedSize: z.number(),
// });

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  data: z.unknown().optional(),
});

const exportedNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: positionSchema,
  data: z.unknown(), // Will be validated separately based on component type
  width: z.number().optional(),
  height: z.number().optional(),
});

const exportedCanvasSchema = z.object({
  version: z.string(),
  exportedAt: z.number(),
  nodes: z.array(exportedNodeSchema),
  edges: z.array(edgeSchema),
  metadata: z
    .object({
      appVersion: z.string(),
      compilerVersion: z.string(),
      nodeCount: z.number(),
    })
    .optional(),
});

// const storageDataSchema = z.object({
//   version: z.string(),
//   timestamp: z.number(),
//   nodeCount: z.number().optional(),
//   nodes: z.array(exportedNodeSchema).optional(),
//   edges: z.array(edgeSchema).optional(),
// });

const storageStatsSchema = z.object({
  nodeCount: z.number().optional(),
  compiledCount: z.number().optional(),
  cacheHitRate: z.number().optional(),
  lastCleanup: z.number().optional(),
  totalSize: z.number().optional(),
});

// interface StorageVersionInfo {
//   version: string;
//   appVersion: string;
//   compilerVersion: string;
//   migratedAt?: number;
// }

interface CompressedData {
  compressed: boolean;
  data: string;
  originalSize: number;
  compressedSize: number;
}

export class StorageService {
  private static instance: StorageService;
  private readonly STORAGE_VERSION = '2.0.0'; // IndexedDB only
  private readonly APP_VERSION = '1.0.0';
  private readonly COMPILER_VERSION = '1.0.0';
  private indexedDBReady = false;
  private initializationPromise: Promise<void> | null = null;

  // Storage keys
  private readonly NODES_KEY = 'ai-whiteboard-nodes';
  private readonly EDGES_KEY = 'ai-whiteboard-edges';
  private readonly VERSION_KEY = 'ai-whiteboard-version';
  private readonly STATS_KEY = 'ai-whiteboard-stats';

  // Size limits (in bytes)
  private readonly MAX_LOCALSTORAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly COMPRESSION_THRESHOLD = 50 * 1024; // 50KB
  private readonly CLEANUP_THRESHOLD = 0.8; // Clean up when 80% full

  private constructor() {
    console.log('🚀 StorageService constructor called');
    // Initialize asynchronously but don't wait for it
    this.initializationPromise = this.initializeStorage().catch((error) => {
      console.error('❌ Failed to initialize storage:', error);
      throw error;
    });
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Wait for storage to be initialized
   */
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Initialize IndexedDB storage
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Initialize IndexedDB
      this.indexedDBReady = await indexedDBUtils.initialize();
      if (this.indexedDBReady) {
      } else {
        console.error('❌ IndexedDB not available - app will not work');
        throw new Error('IndexedDB is required for this application');
      }
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Save nodes to IndexedDB
   */
  async saveNodes(nodes: Node[]): Promise<boolean> {
    // Wait for initialization to complete if not ready
    if (!this.indexedDBReady) {
      try {
        await this.waitForInitialization();
      } catch (error) {
        console.error('❌ IndexedDB initialization failed, cannot save nodes:', error);
        return false;
      }
    }

    if (!this.indexedDBReady) {
      console.error('❌ IndexedDB still not ready after initialization wait');
      return false;
    }

    try {
      // Get current edges to save complete canvas
      const edges = await this.loadEdges();

      // Convert to enhanced node format (sanitizing callback functions)
      const enhancedNodes: ExportedNode[] = nodes.map((node) => ({
        id: node.id,
        type: node.type || 'aiComponent',
        position: node.position,
        data: this.sanitizeNodeDataForStorage(this.enhanceNodeData(node.data)),
        width: node.width,
        height: node.height,
      }));

      // Extract image references
      const imageReferences: string[] = [];
      for (const node of enhancedNodes) {
        if (node.data && typeof node.data === 'object' && 'imageId' in node.data) {
          imageReferences.push(node.data.imageId as string);
        }
      }

      // Save complete canvas to IndexedDB
      await indexedDBUtils.saveCanvas({
        name: 'Current Canvas',
        nodes: enhancedNodes,
        edges,
        version: this.STORAGE_VERSION,
        metadata: {
          nodeCount: enhancedNodes.length,
          edgeCount: edges.length,
          imageReferences,
          componentCount: enhancedNodes.filter((n) => n.type === 'aiComponent').length,
        },
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to save nodes to IndexedDB:', error);
      return false;
    }
  }

  /**
   * Load nodes from IndexedDB
   */
  async loadNodes(): Promise<Node[]> {
    // Wait for initialization to complete if not ready
    if (!this.indexedDBReady) {
      try {
        await this.waitForInitialization();
      } catch (error) {
        console.error('❌ IndexedDB initialization failed, cannot load nodes:', error);
        return [];
      }
    }

    if (!this.indexedDBReady) {
      console.error('❌ IndexedDB still not ready after initialization wait');
      return [];
    }

    try {
      const canvas = await indexedDBUtils.getCanvas();

      if (!canvas?.nodes) {
        console.log('No canvas data found in IndexedDB');
        return [];
      }

      const nodes = canvas.nodes as ExportedNode[];

      // Process image nodes to restore blob URLs
      const processedNodes = await Promise.all(
        nodes.map(async (node) => {
          if (node.data && typeof node.data === 'object' && 'imageId' in node.data) {
            const imageData = await this.getImageData(node.data.imageId as string);
            if (imageData) {
              return {
                ...node,
                data: {
                  ...node.data,
                  blobUrl: imageData.blobUrl,
                },
              };
            }
          }
          return node;
        }),
      );

      return processedNodes.map((n) => ({
        id: n.id,
        type: n.type || 'aiComponent',
        position: n.position,
        data: n.data as Record<string, unknown>,
        width: n.width,
        height: n.height,
      }));
    } catch (error) {
      console.error('Failed to load nodes from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Save edges to IndexedDB
   */
  async saveEdges(edges: Edge[]): Promise<boolean> {
    // Wait for initialization to complete if not ready
    if (!this.indexedDBReady) {
      try {
        await this.waitForInitialization();
      } catch (error) {
        console.error('❌ IndexedDB initialization failed, cannot save edges:', error);
        return false;
      }
    }

    if (!this.indexedDBReady) {
      console.error('❌ IndexedDB still not ready after initialization wait');
      return false;
    }

    try {
      // Get current nodes to save complete canvas
      const nodes = await this.loadNodes();

      // Extract image references
      const imageReferences: string[] = [];
      for (const node of nodes) {
        if (node.data && typeof node.data === 'object' && 'imageId' in node.data) {
          imageReferences.push(node.data.imageId as string);
        }
      }

      // Save complete canvas to IndexedDB
      await indexedDBUtils.saveCanvas({
        name: 'Current Canvas',
        nodes: nodes as unknown[],
        edges,
        version: this.STORAGE_VERSION,
        metadata: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          imageReferences,
          componentCount: nodes.filter((n) => n.type === 'aiComponent').length,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to save edges to IndexedDB:', error);
      return false;
    }
  }

  /**
   * Load edges from IndexedDB
   */
  async loadEdges(): Promise<Edge[]> {
    // Wait for initialization to complete if not ready
    if (!this.indexedDBReady) {
      try {
        await this.waitForInitialization();
      } catch (error) {
        console.error('❌ IndexedDB initialization failed, cannot load edges:', error);
        return [];
      }
    }

    if (!this.indexedDBReady) {
      console.error('❌ IndexedDB still not ready after initialization wait');
      return [];
    }

    try {
      const canvas = await indexedDBUtils.getCanvas();

      if (!canvas?.edges) {
        return [];
      }

      return canvas.edges as Edge[];
    } catch (error) {
      console.error('Failed to load edges from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Export canvas with enhanced format
   */
  async exportCanvas(nodes: Node[], edges: Edge[]): Promise<ExportedCanvas> {
    const exportedNodes: ExportedNode[] = nodes.map((node) => ({
      id: node.id,
      type: node.type || 'aiComponent',
      position: node.position,
      data: this.enhanceNodeData(node.data),
      width: node.width,
      height: node.height,
    }));

    const exportData: ExportedCanvas = {
      version: this.STORAGE_VERSION,
      exportedAt: Date.now(),
      nodes: exportedNodes,
      edges: edges as Edge[], // Include edges in export
      metadata: {
        appVersion: this.APP_VERSION,
        compilerVersion: this.COMPILER_VERSION,
        nodeCount: exportedNodes.length,
      },
    };

    return exportData;
  }

  /**
   * Import canvas with validation and migration
   */
  async importCanvas(canvasData: unknown): Promise<{ nodes: Node[]; edges: Edge[] }> {
    try {
      // Validate canvas data with Zod
      const canvas = exportedCanvasSchema.parse(canvasData);

      // Validate version compatibility
      if (!this.isVersionCompatible(canvas.version)) {
        console.warn(
          `⚠️ Importing canvas from version ${canvas.version}, current version is ${this.STORAGE_VERSION}`,
        );
      }

      // Handle version differences
      let processedCanvas = canvas;
      if (canvas.version !== this.STORAGE_VERSION) {
        const migrated = this.migrateCanvasData(canvas);
        processedCanvas = exportedCanvasSchema.parse(migrated);
      }

      // Validate and convert nodes
      const nodes: Node[] = [];
      const invalidNodes: unknown[] = [];

      for (const exportedNode of processedCanvas.nodes) {
        try {
          const validatedData = this.validateAndEnhanceNodeData(exportedNode.data);

          // Skip compiled code validation for native components
          if (!('componentType' in validatedData && validatedData.componentType === 'native')) {
            // Validate compiled code if present for regular components
            if (validatedData.compiledCode) {
              const isValidCompiled = this.validateCompiledCode(validatedData.compiledCode);
              if (!isValidCompiled) {
                console.warn(
                  `⚠️ Invalid compiled code for node ${validatedData.id}, will recompile on demand`,
                );
                validatedData.compiledCode = undefined;
              }
            }
          }

          nodes.push({
            id: exportedNode.id,
            type: exportedNode.type || 'aiComponent',
            position: exportedNode.position,
            data: validatedData as unknown as Record<string, unknown>,
            width: exportedNode.width,
            height: exportedNode.height,
          });
        } catch (nodeError) {
          console.error(`Failed to import node ${exportedNode.id}:`, nodeError);
          invalidNodes.push(exportedNode);
        }
      }

      if (invalidNodes.length > 0) {
        console.warn(`⚠️ Skipped ${invalidNodes.length} invalid nodes during import`);
      }

      // Validate edges
      const edges: Edge[] = this.validateEdges(processedCanvas.edges || [], nodes);

      return { nodes, edges };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Canvas validation failed:', error.issues);
        throw new Error(`Invalid canvas format: ${error.issues.map((e) => e.message).join(', ')}`);
      }
      console.error('Failed to import canvas:', error);
      throw error;
    }
  }

  /**
   * Get storage utilization statistics
   */
  getStorageStats(): StorageStats {
    const stats = this.loadStorageStats();
    const storageUsage = this.calculateStorageUsage();

    return {
      totalSize: storageUsage.totalSize,
      nodeCount: stats.nodeCount || 0,
      compiledCount: stats.compiledCount || 0,
      cacheHitRate: stats.cacheHitRate || 0,
      lastCleanup: stats.lastCleanup,
    };
  }

  /**
   * Clean up old and unused storage entries
   */
  async cleanupStorage(): Promise<void> {
    try {
      // Remove old cache entries
      this.cleanupCache();

      // Compress large entries
      await this.compressLargeEntries();

      // Update cleanup timestamp
      this.updateStorageStats({ lastCleanup: Date.now() });
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }

  /**
   * Clear all application storage
   */
  clearAllStorage(): void {
    try {
      localStorage.removeItem(this.NODES_KEY);
      localStorage.removeItem(this.EDGES_KEY);
      localStorage.removeItem(this.VERSION_KEY);
      localStorage.removeItem(this.STATS_KEY);
      localStorage.removeItem('reactflow-nodes'); // Legacy key
      localStorage.removeItem('componentPipelineCache');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Remove callback functions from node data before saving to IndexedDB
   */
  private sanitizeNodeDataForStorage(
    nodeData: UnifiedComponentNode | NativeComponentNode,
  ): UnifiedComponentNode | NativeComponentNode {
    if (!nodeData || typeof nodeData !== 'object') {
      return nodeData;
    }

    // Create a copy without callback functions
    const sanitized = { ...nodeData };

    // Remove common callback functions that can't be serialized
    const callbackKeys = [
      'onDelete',
      'onEdit',
      'onDuplicate',
      'onCompilationComplete',
      'onScreenshotCapture',
      'onStateUpdate',
      'handleDeleteComponent',
      'handleRegenerateComponent',
      'handleDuplicateComponent',
      'handleCompilationComplete',
    ];

    // Remove any property that is a function
    Object.keys(sanitized).forEach((key) => {
      const value = (sanitized as unknown as Record<string, unknown>)[key];
      if (typeof value === 'function' || callbackKeys.includes(key)) {
        delete (sanitized as unknown as Record<string, unknown>)[key];
      }
    });

    return sanitized;
  }

  /**
   * Enhanced node data with compiled code preservation
   */
  private enhanceNodeData(nodeData: unknown): UnifiedComponentNode | NativeComponentNode {
    if (!nodeData || typeof nodeData !== 'object') {
      throw new Error('Invalid node data');
    }

    const data = nodeData as Record<string, unknown>;

    // Check if it's a native component
    if (data.componentType === 'native' && data.nativeType && data.state) {
      // It's already a NativeComponentNode, return as is
      return data as unknown as NativeComponentNode;
    }

    // If it's already a UnifiedComponentNode, return as is
    if (data.originalCode !== undefined) {
      return data as unknown as UnifiedComponentNode;
    }

    // Convert legacy ComponentNodeData to UnifiedComponentNode
    return {
      id: String(data.id || `component-${Date.now()}`),
      originalCode: String(data.code || ''),
      compiledCode: data.compiledCode as string | undefined,
      description: data.prompt as string | undefined,
      source: 'ai-generated',
      format: 'jsx',
      metadata: {
        prompt: data.prompt as string | undefined,
        generationTime: data.generationTime as number | undefined,
        aiProvider: 'cerebras',
      },
      metrics: {
        compilationTime: data.compilationTime as number | undefined,
      },
    };
  }

  /**
   * Validate and enhance imported node data
   */
  private validateAndEnhanceNodeData(
    nodeData: unknown,
  ): UnifiedComponentNode | NativeComponentNode {
    const enhanced = this.enhanceNodeData(nodeData);

    // For native components, validate state instead of code
    if ('componentType' in enhanced && enhanced.componentType === 'native') {
      const nativeNode = enhanced as NativeComponentNode;
      if (!nativeNode.state) {
        throw new Error(`Native node ${nativeNode.id} missing required state`);
      }
      if (!nativeNode.nativeType) {
        throw new Error(`Native node ${nativeNode.id} missing required nativeType`);
      }
      return nativeNode;
    }

    // For regular components, validate required fields
    if (!enhanced.originalCode) {
      throw new Error(`Node ${enhanced.id} missing required originalCode`);
    }

    return enhanced;
  }

  /**
   * Compress data using built-in compression or simple encoding
   */
  private async compressData(data: string): Promise<CompressedData> {
    // For now, use simple compression (could be enhanced with proper compression library)
    const compressed = this.simpleCompress(data);

    return {
      compressed: true,
      data: compressed,
      originalSize: data.length,
      compressedSize: compressed.length,
    };
  }

  /**
   * Simple compression using base64 encoding with some optimization
   */
  private simpleCompress(data: string): string {
    try {
      return btoa(unescape(encodeURIComponent(data)));
    } catch {
      return data; // Fallback to uncompressed
    }
  }

  /**
   * Check if version is compatible
   */
  private isVersionCompatible(version: string): boolean {
    // Simple version compatibility check
    const supportedVersions = ['1.0.0', '1.1.0', '2.0', this.STORAGE_VERSION];
    return supportedVersions.includes(version);
  }

  /**
   * Validate compiled code format
   */
  private validateCompiledCode(compiledCode: string): boolean {
    try {
      // Basic validation - check if it's valid JavaScript
      if (!compiledCode || typeof compiledCode !== 'string') {
        return false;
      }

      // Check for basic React component structure
      const hasReactImport = compiledCode.includes('React') || compiledCode.includes('react');
      const hasComponent =
        compiledCode.includes('Component') ||
        compiledCode.includes('function') ||
        compiledCode.includes('=>');

      return hasReactImport || hasComponent; // Should have either React or be a component
    } catch {
      return false;
    }
  }

  /**
   * Validate edges array and filter out invalid edges
   */
  private validateEdges(edges: unknown, nodes: Node[]): Edge[] {
    if (!Array.isArray(edges)) {
      return [];
    }

    const nodeIds = new Set(nodes.map((node) => node.id));

    return edges.filter((edge: unknown) => {
      // Type guard to check if edge has required properties
      if (typeof edge !== 'object' || edge === null) {
        return false;
      }

      const edgeObj = edge as Record<string, unknown>;

      // Validate edge structure
      if (!(edgeObj.id && edgeObj.source && edgeObj.target)) {
        console.warn('⚠️ Skipping edge with missing required fields:', edge);
        return false;
      }

      const id = String(edgeObj.id);
      const source = String(edgeObj.source);
      const target = String(edgeObj.target);

      // Validate edge references existing nodes
      if (!(nodeIds.has(source) && nodeIds.has(target))) {
        console.warn(`⚠️ Skipping edge ${id} with invalid node references: ${source} -> ${target}`);
        return false;
      }

      return true;
    }) as Edge[];
  }

  /**
   * Migrate canvas data between versions
   */
  private migrateCanvasData(canvasData: unknown): unknown {
    if (!canvasData || typeof canvasData !== 'object') {
      return canvasData;
    }

    const canvas = canvasData as Record<string, unknown>;
    const version = canvas.version;

    // Handle legacy v1.0 format
    if (!version || version === '1.0') {
      return {
        ...canvas,
        version: this.STORAGE_VERSION,
        nodes: Array.isArray(canvas.nodes)
          ? (canvas.nodes as unknown[]).map((node: unknown) => {
              if (!node || typeof node !== 'object') {
                return node;
              }
              const n = node as Record<string, unknown>;
              const nodeData = (n.data as Record<string, unknown>) || {};

              return {
                ...n,
                data: {
                  ...nodeData,
                  // Convert legacy fields to unified structure
                  originalCode: nodeData.code || nodeData.originalCode || '',
                  source: 'ai-generated',
                  format: 'jsx',
                  description: nodeData.prompt || nodeData.description || '',
                  metadata: {
                    prompt: nodeData.prompt,
                    generationTime: nodeData.generationTime,
                    aiProvider: 'cerebras',
                  },
                },
              };
            })
          : [],
      };
    }

    // Handle v1.0.0 format - no native components
    if (version === '1.0.0') {
      return {
        ...canvas,
        version: this.STORAGE_VERSION,
        // Nodes remain the same, native components didn't exist in 1.0.0
      };
    }

    // Handle v2.0 format - minimal changes needed
    if (version === '2.0') {
      return {
        ...canvas,
        version: this.STORAGE_VERSION,
      };
    }

    return canvas;
  }

  /**
   * Calculate current storage usage
   */
  private calculateStorageUsage(): { totalSize: number; usagePercent: number } {
    let totalSize = 0;

    for (const key in localStorage) {
      if (Object.hasOwn(localStorage, key)) {
        totalSize += localStorage[key].length;
      }
    }

    return {
      totalSize,
      usagePercent: (totalSize / this.MAX_LOCALSTORAGE_SIZE) * 100,
    };
  }

  /**
   * Check storage size and trigger cleanup if needed
   */
  private checkStorageSize(): void {
    const usage = this.calculateStorageUsage();

    if (usage.usagePercent > this.CLEANUP_THRESHOLD * 100) {
      console.warn(`⚠️ Storage usage at ${usage.usagePercent.toFixed(1)}%, cleaning up...`);
      this.cleanupStorage();
    }
  }

  /**
   * Clean up cache entries
   */
  private cleanupCache(): void {
    // This could be enhanced to work with ComponentPipeline cache
    const cacheKey = 'componentPipelineCache';
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.entries && Array.isArray(data.entries)) {
          // Keep only most recent 50 entries
          data.entries = data.entries.slice(-50);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      }
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  /**
   * Compress large storage entries
   */
  private async compressLargeEntries(): Promise<void> {
    for (const key of [this.NODES_KEY, this.EDGES_KEY]) {
      try {
        const stored = localStorage.getItem(key);
        if (stored && stored.length > this.COMPRESSION_THRESHOLD) {
          const data = JSON.parse(stored);
          if (!data.compressed) {
            const compressed = await this.compressData(JSON.stringify(data));
            localStorage.setItem(key, JSON.stringify(compressed));
          }
        }
      } catch (error) {
        console.warn(`Failed to compress ${key}:`, error);
      }
    }
  }

  /**
   * Load storage statistics
   */
  private loadStorageStats(): Partial<StorageStats> {
    try {
      const stored = localStorage.getItem(this.STATS_KEY);
      if (!stored) {
        return {};
      }
      const parsed = JSON.parse(stored);
      return storageStatsSchema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Storage stats validation failed:', error.issues);
      }
      return {};
    }
  }

  /**
   * Update storage statistics
   */
  private updateStorageStats(updates: Partial<StorageStats>): void {
    try {
      const current = this.loadStorageStats();
      const updated = { ...current, ...updates };
      localStorage.setItem(this.STATS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update storage stats:', error);
    }
  }

  /**
   * Schedule automatic cleanup based on storage usage
   */
  scheduleAutomaticCleanup(): void {
    // Check storage usage every 5 minutes
    setInterval(
      () => {
        this.checkStorageSize();
      },
      5 * 60 * 1000,
    );

    // Run full cleanup every hour if needed
    setInterval(
      () => {
        const usage = this.calculateStorageUsage();
        if (usage.usagePercent > 60) {
          // Clean if over 60% full
          this.cleanupStorage();
        }
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Get storage usage summary for monitoring
   */
  getStorageUsageSummary(): {
    totalSize: number;
    usagePercent: number;
    cacheSize: number;
    lastCleanup?: number;
    recommendation?: string;
  } {
    const usage = this.calculateStorageUsage();
    const stats = this.loadStorageStats();

    let recommendation: string | undefined;
    if (usage.usagePercent > 80) {
      recommendation = 'High storage usage. Consider clearing cache or old components.';
    } else if (usage.usagePercent > 60) {
      recommendation = 'Moderate storage usage. Cleanup will run automatically.';
    } else {
      recommendation = 'Storage usage is healthy.';
    }

    return {
      totalSize: usage.totalSize,
      usagePercent: usage.usagePercent,
      cacheSize: this.getCacheSize(),
      lastCleanup: stats.lastCleanup,
      recommendation,
    };
  }

  /**
   * Get cache size in bytes
   */
  private getCacheSize(): number {
    try {
      const cacheData = localStorage.getItem('componentPipelineCache');
      return cacheData ? cacheData.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Force cleanup now (for manual trigger)
   */
  async forceCleanup(): Promise<void> {
    await this.cleanupStorage();

    // Also cleanup IndexedDB if available
    if (this.indexedDBReady) {
      try {
        await indexedDBUtils.cleanup();
      } catch (error) {
        console.warn('Could not cleanup IndexedDB:', error);
      }
    }

    // Also cleanup component pipeline cache
    try {
      const ComponentPipeline = (await import('./ComponentPipeline.ts')).ComponentPipeline;
      const pipeline = new ComponentPipeline();
      pipeline.clearCache();
    } catch (error) {
      console.warn('Could not cleanup component pipeline cache:', error);
    }
  }

  /**
   * Save image data to IndexedDB storage
   */
  async saveImageData(
    imageData: ArrayBuffer,
    format: string,
    dimensions: { width: number; height: number },
  ): Promise<string | null> {
    if (!this.indexedDBReady) {
      console.warn('IndexedDB not available for image storage');
      return null;
    }

    try {
      const sizeKB = imageData.byteLength / 1024;
      const aspectRatio = dimensions.width / dimensions.height;

      const imageId = await indexedDBUtils.saveImage({
        data: imageData,
        format,
        sizeKB,
        dimensions: {
          ...dimensions,
          aspectRatio,
        },
        metadata: {
          pastedAt: Date.now(),
          originalSize: dimensions,
          compressed: false, // TODO: Implement compression
        },
      });

      return imageId;
    } catch (error) {
      console.error('Failed to save image to IndexedDB:', error);
      return null;
    }
  }

  /**
   * Get image data from IndexedDB storage
   */
  async getImageData(
    imageId: string,
  ): Promise<{ data: ArrayBuffer; format: string; blobUrl: string } | null> {
    if (!this.indexedDBReady) {
      console.warn('IndexedDB not available for image retrieval');
      return null;
    }

    try {
      const imageData = await indexedDBUtils.getImage(imageId);
      if (!imageData) {
        return null;
      }

      // Create blob URL for display
      const blobUrl = indexedDBUtils.createBlobUrl(imageData.data, imageData.format);

      return {
        data: imageData.data,
        format: imageData.format,
        blobUrl,
      };
    } catch (error) {
      console.error('Failed to get image from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Delete image from IndexedDB storage
   */
  async deleteImageData(imageId: string): Promise<boolean> {
    if (!this.indexedDBReady) {
      console.warn('IndexedDB not available for image deletion');
      return false;
    }

    try {
      return await indexedDBUtils.deleteImage(imageId);
    } catch (error) {
      console.error('Failed to delete image from IndexedDB:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics including IndexedDB
   */
  async getEnhancedStorageStats(): Promise<
    StorageStats & { indexedDBQuota?: { usage: number; quota: number; usagePercentage: number } }
  > {
    const localStorageStats = this.getStorageStats();

    if (this.indexedDBReady) {
      try {
        const quotaInfo = await indexedDBUtils.getStorageQuota();
        return {
          ...localStorageStats,
          indexedDBQuota: quotaInfo,
        };
      } catch (error) {
        console.warn('Failed to get IndexedDB quota info:', error);
      }
    }

    return localStorageStats;
  }

  /**
   * Clean up unused images when nodes are deleted
   */
  async cleanupUnusedImages(currentNodes: Node[]): Promise<void> {
    if (!this.indexedDBReady) {
      return;
    }

    try {
      // Extract image IDs from current nodes
      const imageIds: string[] = [];

      for (const node of currentNodes) {
        // Check for ImageNode types that reference images
        if (node.data && typeof node.data === 'object') {
          const data = node.data as Record<string, unknown>;
          if (data.imageId && typeof data.imageId === 'string') {
            imageIds.push(data.imageId);
          }
        }
      }

      const deletedCount = await indexedDBUtils.cleanupUnusedImages(imageIds);
      if (deletedCount > 0) {
      }
    } catch (error) {
      console.error('Failed to cleanup unused images:', error);
    }
  }

  /**
   * Check if IndexedDB is ready for use
   */
  isIndexedDBReady(): boolean {
    return this.indexedDBReady;
  }

  /**
   * Force initialization and migration (for debugging)
   */
  async forceInitialization(): Promise<void> {
    await this.initializeStorage();
  }

  /**
   * Debug storage state
   */
  async getDebugInfo(): Promise<{
    indexedDBReady: boolean;
    storageVersion: string;
    canvas: unknown;
    migrationInfo: unknown;
    localStorage: {
      nodes: boolean;
      edges: boolean;
    };
  }> {
    const canvas = this.indexedDBReady ? await indexedDBUtils.getCanvas().catch(() => null) : null;
    const migrationInfo = this.indexedDBReady
      ? await indexedDBUtils.getMigrationInfo().catch(() => null)
      : null;

    return {
      indexedDBReady: this.indexedDBReady,
      storageVersion: this.STORAGE_VERSION,
      canvas,
      migrationInfo,
      localStorage: {
        nodes: !!localStorage.getItem(this.NODES_KEY),
        edges: !!localStorage.getItem(this.EDGES_KEY),
      },
    };
  }

  /**
   * Save complete canvas (nodes + edges) in one operation
   */
  async saveCanvas(nodes: Node[], edges: Edge[]): Promise<boolean> {
    if (!this.indexedDBReady) {
      console.error('IndexedDB not ready');
      return false;
    }

    try {
      // Convert to enhanced node format (sanitizing callback functions)
      const enhancedNodes: ExportedNode[] = nodes.map((node) => ({
        id: node.id,
        type: node.type || 'aiComponent',
        position: node.position,
        data: this.sanitizeNodeDataForStorage(this.enhanceNodeData(node.data)),
        width: node.width,
        height: node.height,
      }));

      // Extract image references
      const imageReferences: string[] = [];
      for (const node of enhancedNodes) {
        if (node.data && typeof node.data === 'object' && 'imageId' in node.data) {
          imageReferences.push(node.data.imageId as string);
        }
      }

      // Save complete canvas to IndexedDB
      await indexedDBUtils.saveCanvas({
        name: 'Current Canvas',
        nodes: enhancedNodes,
        edges,
        version: this.STORAGE_VERSION,
        metadata: {
          nodeCount: enhancedNodes.length,
          edgeCount: edges.length,
          imageReferences,
          componentCount: enhancedNodes.filter((n) => n.type === 'aiComponent').length,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to save canvas:', error);
      return false;
    }
  }

  /**
   * Load complete canvas (nodes + edges) in one operation
   */
  async loadCanvas(): Promise<{ nodes: Node[]; edges: Edge[] }> {
    try {
      const nodes = await this.loadNodes();
      const edges = await this.loadEdges();
      return { nodes, edges };
    } catch (error) {
      console.error('Failed to load canvas:', error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Clear all canvas data
   */
  async clearCanvas(): Promise<boolean> {
    if (!this.indexedDBReady) {
      console.error('IndexedDB not ready');
      return false;
    }

    try {
      const success = await indexedDBUtils.deleteCanvas('current');
      if (success) {
      }
      return success;
    } catch (error) {
      console.error('Failed to clear canvas:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
