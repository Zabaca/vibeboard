/**
 * IndexedDB utilities for storing large data like images
 * Provides a robust storage layer with fallback support for localStorage
 */

interface ImageStorageData {
  id: string;
  data: ArrayBuffer;
  format: string;
  sizeKB: number;
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  metadata: {
    pastedAt: number;
    originalSize?: { width: number; height: number };
    compressed: boolean;
  };
  createdAt: number;
  lastAccessed: number;
}

interface CanvasData {
  id: string;
  name: string;
  nodes: unknown[]; // React Flow nodes
  edges: unknown[]; // React Flow edges
  viewport?: { x: number; y: number; zoom: number };
  createdAt: number;
  lastModified: number;
  version: string;
  metadata?: {
    nodeCount: number;
    edgeCount: number;
    imageReferences: string[];
    componentCount: number;
  };
}

interface StorageQuotaInfo {
  usage: number;
  quota: number;
  usagePercentage: number;
  available: number;
}

export interface IndexedDBUtilsInterface {
  // Database management
  initialize(): Promise<boolean>;
  isSupported(): boolean;

  // Image storage
  saveImage(
    imageData: Omit<ImageStorageData, 'id' | 'createdAt' | 'lastAccessed'>,
  ): Promise<string>;
  getImage(imageId: string): Promise<ImageStorageData | null>;
  deleteImage(imageId: string): Promise<boolean>;
  listImages(): Promise<ImageStorageData[]>;
  cleanupUnusedImages(referencedImageIds: string[]): Promise<number>;

  // Canvas data storage (complete canvas with nodes/edges)
  saveCanvas(canvas: Omit<CanvasData, 'id' | 'createdAt' | 'lastModified'>): Promise<string>;
  getCanvas(canvasId?: string): Promise<CanvasData | null>;
  updateCanvas(canvasId: string, updates: Partial<CanvasData>): Promise<boolean>;
  deleteCanvas(canvasId: string): Promise<boolean>;
  listCanvases(): Promise<CanvasData[]>;

  // Storage management
  getStorageQuota(): Promise<StorageQuotaInfo>;
  cleanup(maxAge?: number): Promise<{ deletedImages: number; freedSpace: number }>;
  migrate(legacyData?: unknown): Promise<boolean>;
  migrateFromLocalStorage(): Promise<boolean>;

  // Utility methods
  createBlobUrl(imageData: ArrayBuffer, format: string): string;
  revokeBlobUrl(url: string): void;
  optimizeImage(imageData: ArrayBuffer, format: string, maxSizeKB?: number): Promise<ArrayBuffer>;
}

class IndexedDBUtils implements IndexedDBUtilsInterface {
  private static instance: IndexedDBUtils;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ViveboardStorage';
  private readonly DB_VERSION = 2; // Bumped to force schema update
  private readonly STORES = {
    IMAGES: 'images',
    CANVAS: 'canvas', // Renamed from CANVAS_METADATA to store full canvas data
    SETTINGS: 'settings',
  };

  // Storage limits and thresholds
  private readonly MAX_IMAGE_SIZE_KB = 10 * 1024; // 10MB per image
  private readonly CLEANUP_AGE_DAYS = 30; // Delete unused images after 30 days

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): IndexedDBUtils {
    if (!IndexedDBUtils.instance) {
      IndexedDBUtils.instance = new IndexedDBUtils();
    }
    return IndexedDBUtils.instance;
  }

  /**
   * Check if IndexedDB is supported in the current browser
   */
  isSupported(): boolean {
    return 'indexedDB' in window && window.indexedDB !== null;
  }

  /**
   * Initialize the IndexedDB database with required object stores
   */
  initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('IndexedDB not supported in this browser');
      return false;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // @ts-ignore - Transaction available but not used in createObjectStores
        const _transaction = (event.target as IDBOpenDBRequest).transaction;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Create object stores during database upgrade
   */
  private createObjectStores(db: IDBDatabase): void {
    try {
      // Images store - for storing compressed image data
      if (db.objectStoreNames.contains(this.STORES.IMAGES)) {
      } else {
        const imageStore = db.createObjectStore(this.STORES.IMAGES, {
          keyPath: 'id',
        });
        imageStore.createIndex('createdAt', 'createdAt', { unique: false });
        imageStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        imageStore.createIndex('format', 'format', { unique: false });
      }

      // Canvas store - for storing complete canvas data (nodes, edges, etc.)
      if (db.objectStoreNames.contains(this.STORES.CANVAS)) {
      } else {
        const canvasStore = db.createObjectStore(this.STORES.CANVAS, {
          keyPath: 'id',
        });
        canvasStore.createIndex('lastModified', 'lastModified', { unique: false });
        canvasStore.createIndex('name', 'name', { unique: false });
      }

      // Settings store - for storing application settings and migration info
      if (db.objectStoreNames.contains(this.STORES.SETTINGS)) {
      } else {
        db.createObjectStore(this.STORES.SETTINGS, { keyPath: 'key' });
      }
    } catch (error) {
      console.error('❌ Failed to create object stores:', error);
      throw error;
    }
  }

  /**
   * Save image data to IndexedDB
   */
  saveImage(
    imageData: Omit<ImageStorageData, 'id' | 'createdAt' | 'lastAccessed'>,
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const storageData: ImageStorageData = {
      id: imageId,
      ...imageData,
      createdAt: now,
      lastAccessed: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORES.IMAGES], 'readwrite');
      if (!transaction) {
        reject(new Error('Database transaction failed'));
        return;
      }
      const store = transaction.objectStore(this.STORES.IMAGES);
      const request = store.add(storageData);

      request.onsuccess = () => {
        resolve(imageId);
      };

      request.onerror = () => {
        console.error('Failed to save image:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get image data from IndexedDB
   */
  getImage(imageId: string): Promise<ImageStorageData | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORES.IMAGES], 'readwrite');
      if (!transaction) {
        reject(new Error('Database transaction failed'));
        return;
      }
      const store = transaction.objectStore(this.STORES.IMAGES);
      const request = store.get(imageId);

      request.onsuccess = () => {
        const imageData = request.result as ImageStorageData | undefined;

        if (imageData) {
          // Update last accessed time
          const updateRequest = store.put({
            ...imageData,
            lastAccessed: Date.now(),
          });

          updateRequest.onsuccess = () => resolve(imageData);
          updateRequest.onerror = () => resolve(imageData); // Still return data even if access time update fails
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to get image:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete image from IndexedDB
   */
  deleteImage(imageId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORES.IMAGES], 'readwrite');
      if (!transaction) {
        reject(new Error('Database transaction failed'));
        return;
      }
      const store = transaction.objectStore(this.STORES.IMAGES);
      const request = store.delete(imageId);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to delete image:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * List all images in storage
   */
  listImages(): Promise<ImageStorageData[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORES.IMAGES], 'readonly');
      if (!transaction) {
        reject(new Error('Database transaction failed'));
        return;
      }
      const store = transaction.objectStore(this.STORES.IMAGES);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as ImageStorageData[]);
      };

      request.onerror = () => {
        console.error('Failed to list images:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clean up unused images that are not referenced by any canvas
   */
  async cleanupUnusedImages(referencedImageIds: string[]): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const allImages = await this.listImages();
    const referencedSet = new Set(referencedImageIds);
    const unreferencedImages = allImages.filter((img) => !referencedSet.has(img.id));

    let deletedCount = 0;
    for (const image of unreferencedImages) {
      try {
        await this.deleteImage(image.id);
        deletedCount++;
      } catch (error) {
        console.warn(`Failed to delete unused image ${image.id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Save complete canvas data
   */
  saveCanvas(canvas: Omit<CanvasData, 'id' | 'createdAt' | 'lastModified'>): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Use 'current' as the default canvas ID (single canvas for now)
    const canvasId = 'current';
    const now = Date.now();

    const canvasData: CanvasData = {
      id: canvasId,
      ...canvas,
      createdAt: now,
      lastModified: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORES.CANVAS], 'readwrite');
      if (!transaction) {
        reject(new Error('Database transaction failed'));
        return;
      }
      const store = transaction.objectStore(this.STORES.CANVAS);
      const request = store.put(canvasData);

      request.onsuccess = () => {
        resolve(canvasId);
      };

      request.onerror = () => {
        console.error('Failed to save canvas:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get canvas data
   */
  getCanvas(canvasId: string = 'current'): Promise<CanvasData | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db?.transaction([this.STORES.CANVAS], 'readonly');
        if (!transaction) {
          reject(new Error('Database transaction failed'));
          return;
        }
        const store = transaction.objectStore(this.STORES.CANVAS);
        const request = store.get(canvasId);

        request.onsuccess = () => {
          const canvas = request.result as CanvasData | null;
          resolve(canvas);
        };

        request.onerror = () => {
          console.error('Failed to get canvas:', request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error('❌ Failed to create transaction for canvas:', error);
        reject(error);
      }
    });
  }

  /**
   * Update canvas data
   */
  async updateCanvas(canvasId: string, updates: Partial<CanvasData>): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const existing = await this.getCanvas(canvasId);
    if (!existing) {
      console.warn(`Canvas ${canvasId} not found`);
      return false;
    }

    const updated: CanvasData = {
      ...existing,
      ...updates,
      id: canvasId, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation time
      lastModified: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORES.CANVAS], 'readwrite');
      if (!transaction) {
        reject(new Error('Database transaction failed'));
        return;
      }
      const store = transaction.objectStore(this.STORES.CANVAS);
      const request = store.put(updated);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to update canvas:', request.error);
        resolve(false);
      };
    });
  }

  /**
   * Delete canvas data
   */
  deleteCanvas(canvasId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORES.CANVAS], 'readwrite');
      if (!transaction) {
        reject(new Error('Database transaction failed'));
        return;
      }
      const store = transaction.objectStore(this.STORES.CANVAS);
      const request = store.delete(canvasId);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to delete canvas:', request.error);
        resolve(false);
      };
    });
  }

  /**
   * List all canvases
   */
  listCanvases(): Promise<CanvasData[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORES.CANVAS], 'readonly');
      if (!transaction) {
        reject(new Error('Database transaction failed'));
        return;
      }
      const store = transaction.objectStore(this.STORES.CANVAS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as CanvasData[]);
      };

      request.onerror = () => {
        console.error('Failed to list canvases:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage quota information
   */
  async getStorageQuota(): Promise<StorageQuotaInfo> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;

        return {
          usage,
          quota,
          usagePercentage: quota > 0 ? (usage / quota) * 100 : 0,
          available: quota - usage,
        };
      }
    } catch (error) {
      console.warn('Failed to get storage estimate:', error);
    }

    // Fallback for browsers that don't support storage.estimate()
    return {
      usage: 0,
      quota: 0,
      usagePercentage: 0,
      available: 0,
    };
  }

  /**
   * Clean up old and unused data
   */
  async cleanup(
    maxAge: number = this.CLEANUP_AGE_DAYS,
  ): Promise<{ deletedImages: number; freedSpace: number }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const cutoffDate = Date.now() - maxAge * 24 * 60 * 60 * 1000;
    const images = await this.listImages();

    let deletedImages = 0;
    let freedSpace = 0;

    // Delete old images that haven't been accessed recently
    for (const image of images) {
      if (image.lastAccessed < cutoffDate) {
        try {
          await this.deleteImage(image.id);
          deletedImages++;
          freedSpace += image.sizeKB * 1024; // Convert KB to bytes
        } catch (error) {
          console.warn(`Failed to delete old image ${image.id}:`, error);
        }
      }
    }

    return { deletedImages, freedSpace };
  }

  /**
   * Migrate data from localStorage to IndexedDB
   */
  async migrate(legacyData?: unknown): Promise<boolean> {
    try {
      // Migration logic would depend on the legacy data format
      // For now, just mark migration as complete
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const transaction = this.db.transaction([this.STORES.SETTINGS], 'readwrite');
      const store = transaction.objectStore(this.STORES.SETTINGS);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          key: 'migrationInfo',
          version: '2.0.0', // Updated for full IndexedDB migration
          migratedAt: Date.now(),
          legacyDataMigrated: !!legacyData,
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (error) {
      console.error('Failed to migrate to IndexedDB:', error);
      return false;
    }
  }

  /**
   * Migrate existing localStorage data to IndexedDB
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      // Check if we've already migrated
      const migrationInfo = await this.getMigrationInfo();
      if (migrationInfo?.version === '2.0.0') {
        return true;
      }

      // Try to get nodes and edges from localStorage
      const nodesKey = 'ai-whiteboard-nodes';
      const edgesKey = 'ai-whiteboard-edges';

      const nodesData = localStorage.getItem(nodesKey);
      const edgesData = localStorage.getItem(edgesKey);

      if (nodesData || edgesData) {
        let nodes: unknown[] = [];
        let edges: unknown[] = [];

        try {
          if (nodesData) {
            const parsed = JSON.parse(nodesData);
            // Handle compressed data
            if (parsed.compressed && parsed.data) {
              const decompressed = this.simpleDecompress(parsed.data);
              const nodeData = JSON.parse(decompressed);
              nodes = nodeData.nodes || [];
            } else if (parsed.nodes) {
              nodes = parsed.nodes;
            }
          }

          if (edgesData) {
            const parsed = JSON.parse(edgesData);
            if (parsed.compressed && parsed.data) {
              const decompressed = this.simpleDecompress(parsed.data);
              const edgeData = JSON.parse(decompressed);
              edges = edgeData.edges || [];
            } else if (parsed.edges) {
              edges = parsed.edges;
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse localStorage data:', parseError);
        }

        // Save to IndexedDB
        if (nodes.length > 0 || edges.length > 0) {
          await this.saveCanvas({
            name: 'Migrated Canvas',
            nodes,
            edges,
            version: '2.0.0',
            metadata: {
              nodeCount: nodes.length,
              edgeCount: edges.length,
              imageReferences: [],
              componentCount: nodes.length,
            },
          });
        }
      }

      // Mark migration as complete
      await this.migrate({ fromLocalStorage: true });

      // Optionally clean up localStorage (commented out for safety)
      // localStorage.removeItem(nodesKey);
      // localStorage.removeItem(edgesKey);

      return true;
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error);
      return false;
    }
  }

  /**
   * Get migration info from settings
   */
  getMigrationInfo(): Promise<{ version: string; migratedAt: number } | null> {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve) => {
      const transaction = this.db?.transaction([this.STORES.SETTINGS], 'readonly');
      if (!transaction) {
        resolve(null);
        return;
      }
      const store = transaction.objectStore(this.STORES.SETTINGS);
      const request = store.get('migrationInfo');

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Simple decompression (matching StorageService compression)
   */
  private simpleDecompress(data: string): string {
    try {
      return decodeURIComponent(escape(atob(data)));
    } catch {
      return data; // Assume uncompressed
    }
  }

  /**
   * Create blob URL for image display
   */
  createBlobUrl(imageData: ArrayBuffer, format: string): string {
    const mimeType = this.formatToMimeType(format);
    const blob = new Blob([imageData], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Revoke blob URL to free memory
   */
  revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Optimize image by compressing it (placeholder for now)
   */
  optimizeImage(
    imageData: ArrayBuffer,
    _format: string,
    maxSizeKB: number = this.MAX_IMAGE_SIZE_KB,
  ): Promise<ArrayBuffer> {
    // For now, just return the original data
    // In a real implementation, you might use canvas to resize/compress
    const currentSizeKB = imageData.byteLength / 1024;

    if (currentSizeKB <= maxSizeKB) {
      return imageData;
    }

    console.warn(
      `Image size (${currentSizeKB}KB) exceeds maximum (${maxSizeKB}KB). Consider implementing compression.`,
    );
    return imageData;
  }

  /**
   * Convert format string to MIME type
   */
  private formatToMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/png'; // Default fallback
    }
  }
}

// Export singleton instance
export const indexedDBUtils = IndexedDBUtils.getInstance();

// Export types for external use
export type { ImageStorageData, CanvasData, StorageQuotaInfo };
