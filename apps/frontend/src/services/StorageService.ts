/**
 * StorageService - Enhanced storage and persistence for the AI Whiteboard POC
 * 
 * Features:
 * - Handles UnifiedComponentNode structure with compiled code
 * - Compression for large payloads 
 * - Storage size monitoring and cleanup
 * - Versioning for migration support
 * - Fallback to IndexedDB for large canvases
 */

import { z } from 'zod';
import type { 
  UnifiedComponentNode, 
  ExportedCanvas, 
  ExportedNode, 
  StorageStats 
} from '../types/component.types.ts';
import type { 
  NativeComponentNode
} from '../types/native-component.types.ts';
import type { Node, Edge } from '@xyflow/react';

// Zod schemas for validation
const storageVersionInfoSchema = z.object({
  version: z.string(),
  appVersion: z.string(),
  compilerVersion: z.string(),
  migratedAt: z.number().optional(),
});

const compressedDataSchema = z.object({
  compressed: z.boolean(),
  data: z.string(),
  originalSize: z.number(),
  compressedSize: z.number(),
});

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
  metadata: z.object({
    appVersion: z.string(),
    compilerVersion: z.string(),
    nodeCount: z.number(),
  }).optional(),
});

const storageDataSchema = z.object({
  version: z.string(),
  timestamp: z.number(),
  nodeCount: z.number().optional(),
  nodes: z.array(exportedNodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
});

const storageStatsSchema = z.object({
  nodeCount: z.number().optional(),
  compiledCount: z.number().optional(),
  cacheHitRate: z.number().optional(),
  lastCleanup: z.number().optional(),
  totalSize: z.number().optional(),
});

interface StorageVersionInfo {
  version: string;
  appVersion: string;
  compilerVersion: string;
  migratedAt?: number;
}

interface CompressedData {
  compressed: boolean;
  data: string;
  originalSize: number;
  compressedSize: number;
}

export class StorageService {
  private static instance: StorageService;
  private readonly STORAGE_VERSION = '1.1.0'; // Updated to support native components
  private readonly APP_VERSION = '1.0.0';
  private readonly COMPILER_VERSION = '1.0.0';
  
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
    this.initializeStorage();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initialize storage system and handle migrations
   */
  private initializeStorage(): void {
    try {
      const versionInfo = this.getVersionInfo();
      
      if (!versionInfo || versionInfo.version !== this.STORAGE_VERSION) {
        console.log(`🔄 Migrating storage from version ${versionInfo?.version || 'unknown'} to ${this.STORAGE_VERSION}`);
        this.migrateStorage(versionInfo);
      }

      // Check storage size and cleanup if needed
      this.checkStorageSize();
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      this.clearAllStorage();
    }
  }

  /**
   * Save nodes with compiled code and compression
   */
  async saveNodes(nodes: Node[]): Promise<boolean> {
    try {
      // Convert to enhanced node format
      const enhancedNodes: ExportedNode[] = nodes.map(node => ({
        id: node.id,
        type: node.type || 'aiComponent',
        position: node.position,
        data: this.enhanceNodeData(node.data),
        width: node.width,
        height: node.height,
      }));

      const nodeData = {
        version: this.STORAGE_VERSION,
        timestamp: Date.now(),
        nodeCount: enhancedNodes.length,
        nodes: enhancedNodes,
      };

      const success = await this.saveToStorage(this.NODES_KEY, nodeData);
      
      if (success) {
        this.updateStorageStats({
          nodeCount: enhancedNodes.length,
          compiledCount: enhancedNodes.filter(n => n.data.compiledCode).length,
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to save nodes:', error);
      return false;
    }
  }

  /**
   * Load nodes with compiled code restoration
   */
  async loadNodes(): Promise<Node[]> {
    try {
      const stored = await this.loadFromStorage(this.NODES_KEY);
      
      if (!stored || !(stored as any).nodes) {
        return [];
      }

      // Convert back to React Flow format
      const nodes: Node[] = (stored as any).nodes.map((exportedNode: ExportedNode) => ({
        id: exportedNode.id,
        type: exportedNode.type || 'aiComponent',
        position: exportedNode.position,
        data: exportedNode.data,
        width: exportedNode.width,
        height: exportedNode.height,
      }));

      console.log(`✅ Loaded ${nodes.length} nodes from storage`);
      return nodes;
    } catch (error) {
      console.error('Failed to load nodes:', error);
      return [];
    }
  }

  /**
   * Save edges
   */
  async saveEdges(edges: Edge[]): Promise<boolean> {
    try {
      const edgeData = {
        version: this.STORAGE_VERSION,
        timestamp: Date.now(),
        edges,
      };

      return await this.saveToStorage(this.EDGES_KEY, edgeData);
    } catch (error) {
      console.error('Failed to save edges:', error);
      return false;
    }
  }

  /**
   * Load edges
   */
  async loadEdges(): Promise<Edge[]> {
    try {
      const stored = await this.loadFromStorage(this.EDGES_KEY);
      return (stored as any)?.edges || [];
    } catch (error) {
      console.error('Failed to load edges:', error);
      return [];
    }
  }

  /**
   * Export canvas with enhanced format
   */
  async exportCanvas(nodes: Node[], edges: Edge[]): Promise<ExportedCanvas> {
    const exportedNodes: ExportedNode[] = nodes.map(node => ({
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
        console.warn(`⚠️ Importing canvas from version ${canvas.version}, current version is ${this.STORAGE_VERSION}`);
      }

      // Handle version differences
      let processedCanvas = canvas;
      if (canvas.version !== this.STORAGE_VERSION) {
        console.log(`🔄 Migrating imported canvas from version ${canvas.version} to ${this.STORAGE_VERSION}`);
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
                console.warn(`⚠️ Invalid compiled code for node ${validatedData.id}, will recompile on demand`);
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

      console.log(`✅ Imported ${nodes.length} nodes and ${edges.length} edges (${invalidNodes.length} invalid nodes skipped)`);
      return { nodes, edges };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Canvas validation failed:', error.issues);
        throw new Error(`Invalid canvas format: ${error.issues.map(e => e.message).join(', ')}`);
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
      console.log('🧹 Starting storage cleanup...');

      // Remove old cache entries
      this.cleanupCache();

      // Compress large entries
      await this.compressLargeEntries();

      // Update cleanup timestamp
      this.updateStorageStats({ lastCleanup: Date.now() });

      console.log('✅ Storage cleanup completed');
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
      
      console.log('🗑️ All storage cleared');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
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
  private validateAndEnhanceNodeData(nodeData: unknown): UnifiedComponentNode | NativeComponentNode {
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
   * Save data to storage with compression if needed
   */
  private async saveToStorage(key: string, data: unknown): Promise<boolean> {
    try {
      const serialized = JSON.stringify(data);
      const payload = serialized.length > this.COMPRESSION_THRESHOLD 
        ? await this.compressData(serialized)
        : { compressed: false, data: serialized, originalSize: serialized.length, compressedSize: serialized.length };

      localStorage.setItem(key, JSON.stringify(payload));
      return true;
    } catch (error) {
      // Handle storage quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        await this.cleanupStorage();
        
        // Try again after cleanup
        try {
          const serialized = JSON.stringify(data);
          const payload = await this.compressData(serialized);
          localStorage.setItem(key, JSON.stringify(payload));
          return true;
        } catch (retryError) {
          console.error('Storage failed even after cleanup:', retryError);
          return false;
        }
      }
      
      console.error(`Failed to save to storage (${key}):`, error);
      return false;
    }
  }

  /**
   * Load data from storage with decompression and validation
   */
  private async loadFromStorage(key: string): Promise<unknown> {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const rawPayload = JSON.parse(stored);
      
      // Handle compressed data
      if (rawPayload.compressed) {
        const payload = compressedDataSchema.parse(rawPayload);
        const decompressed = await this.decompressData(payload);
        return JSON.parse(decompressed);
      }

      // Handle both new format and legacy direct data
      const data = rawPayload.data ? JSON.parse(rawPayload.data) : rawPayload;
      
      // Validate storage data structure for nodes/edges
      if (key === this.NODES_KEY || key === this.EDGES_KEY) {
        return storageDataSchema.parse(data);
      }
      
      return data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`Storage validation failed for ${key}:`, error.issues);
        return null;
      }
      console.error(`Failed to load from storage (${key}):`, error);
      return null;
    }
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
   * Decompress data
   */
  private async decompressData(payload: CompressedData): Promise<string> {
    return this.simpleDecompress(payload.data);
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
   * Simple decompression
   */
  private simpleDecompress(data: string): string {
    try {
      return decodeURIComponent(escape(atob(data)));
    } catch {
      return data; // Fallback to assume uncompressed
    }
  }

  /**
   * Get version information
   */
  private getVersionInfo(): StorageVersionInfo | null {
    try {
      const stored = localStorage.getItem(this.VERSION_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return storageVersionInfoSchema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Version info validation failed:', error.issues);
      }
      return null;
    }
  }

  /**
   * Set version information
   */
  private setVersionInfo(versionInfo: StorageVersionInfo): void {
    localStorage.setItem(this.VERSION_KEY, JSON.stringify(versionInfo));
  }

  /**
   * Migrate storage between versions
   */
  private migrateStorage(oldVersion: StorageVersionInfo | null): void {
    // Handle migration from legacy format
    if (!oldVersion) {
      this.migrateLegacyStorage();
    }

    // Set new version info
    this.setVersionInfo({
      version: this.STORAGE_VERSION,
      appVersion: this.APP_VERSION,
      compilerVersion: this.COMPILER_VERSION,
      migratedAt: Date.now(),
    });
  }

  /**
   * Migrate from legacy localStorage format
   */
  private migrateLegacyStorage(): void {
    try {
      const legacyNodes = localStorage.getItem('reactflow-nodes');
      if (legacyNodes) {
        const nodes = JSON.parse(legacyNodes);
        console.log(`🔄 Migrating ${nodes.length} legacy nodes`);
        
        // Convert to new format and save
        this.saveNodes(nodes);
        
        // Remove legacy key
        localStorage.removeItem('reactflow-nodes');
      }
    } catch (error) {
      console.warn('Failed to migrate legacy storage:', error);
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
      const hasComponent = compiledCode.includes('Component') || compiledCode.includes('function') || compiledCode.includes('=>');
      
      return hasReactImport || hasComponent; // Should have either React or be a component
    } catch (error) {
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

    const nodeIds = new Set(nodes.map(node => node.id));
    
    return edges.filter((edge: unknown) => {
      // Type guard to check if edge has required properties
      if (typeof edge !== 'object' || edge === null) {
        return false;
      }
      
      const edgeObj = edge as Record<string, unknown>;
      
      // Validate edge structure
      if (!edgeObj.id || !edgeObj.source || !edgeObj.target) {
        console.warn('⚠️ Skipping edge with missing required fields:', edge);
        return false;
      }

      const id = String(edgeObj.id);
      const source = String(edgeObj.source);
      const target = String(edgeObj.target);

      // Validate edge references existing nodes
      if (!nodeIds.has(source) || !nodeIds.has(target)) {
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
        nodes: Array.isArray(canvas.nodes) ? (canvas.nodes as unknown[]).map((node: unknown) => {
          if (!node || typeof node !== 'object') return node;
          const n = node as Record<string, unknown>;
          const nodeData = n.data as Record<string, unknown> || {};
          
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
        }) : [],
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
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
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
    } catch (error) {
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
      if (!stored) return {};
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
    setInterval(() => {
      this.checkStorageSize();
    }, 5 * 60 * 1000);

    // Run full cleanup every hour if needed
    setInterval(() => {
      const usage = this.calculateStorageUsage();
      if (usage.usagePercent > 60) { // Clean if over 60% full
        this.cleanupStorage();
      }
    }, 60 * 60 * 1000);
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
    } catch (error) {
      return 0;
    }
  }

  /**
   * Force cleanup now (for manual trigger)
   */
  async forceCleanup(): Promise<void> {
    console.log('🧹 Forcing storage cleanup...');
    await this.cleanupStorage();
    
    // Also cleanup component pipeline cache
    try {
      const ComponentPipeline = (await import('./ComponentPipeline.ts')).ComponentPipeline;
      const pipeline = new ComponentPipeline();
      pipeline.clearCache();
    } catch (error) {
      console.warn('Could not cleanup component pipeline cache:', error);
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();