import React, { useState, useEffect } from 'react';
import { storageService } from '../services/StorageService.ts';
import { indexedDBUtils } from '../utils/indexedDBUtils.ts';

interface StorageInfo {
  localStorageSize: number;
  localStorageUsagePercent: number;
  indexedDBUsage: number;
  indexedDBQuota: number;
  indexedDBUsagePercent: number;
  imageCount: number;
  nodeCount: number;
  lastCleanup?: number;
}

interface StorageManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const StorageManagementDialog: React.FC<StorageManagementDialogProps> = ({ isOpen, onClose }) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStorageInfo();
    }
  }, [isOpen]);

  const loadStorageInfo = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const stats = await storageService.getEnhancedStorageStats();
      const usage = storageService.getStorageUsageSummary();

      let imageCount = 0;
      let indexedDBUsage = 0;
      let indexedDBQuota = 0;
      let indexedDBUsagePercent = 0;

      if (storageService.isIndexedDBReady()) {
        try {
          const images = await indexedDBUtils.listImages();
          imageCount = images.length;

          const quotaInfo = await indexedDBUtils.getStorageQuota();
          indexedDBUsage = quotaInfo.usage;
          indexedDBQuota = quotaInfo.quota;
          indexedDBUsagePercent = quotaInfo.usagePercentage;
        } catch (error) {
          console.warn('Failed to get IndexedDB info:', error);
        }
      }

      setStorageInfo({
        localStorageSize: usage.totalSize,
        localStorageUsagePercent: usage.usagePercent,
        indexedDBUsage,
        indexedDBQuota,
        indexedDBUsagePercent,
        imageCount,
        nodeCount: stats.nodeCount || 0,
        lastCleanup: stats.lastCleanup,
      });
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
    setIsLoading(false);
  };

  const handleCleanup = async (): Promise<void> => {
    setIsCleaningUp(true);
    try {
      await storageService.forceCleanup();
      await loadStorageInfo(); // Refresh data
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
    setIsCleaningUp(false);
  };

  const handleClearAll = async (): Promise<void> => {
    if (
      !confirm(
        'Are you sure you want to clear all storage? This will delete all saved components and images.',
      )
    ) {
      return;
    }

    try {
      storageService.clearAllStorage();
      if (storageService.isIndexedDBReady()) {
        // Clear IndexedDB images
        const images = await indexedDBUtils.listImages();
        for (const image of images) {
          await indexedDBUtils.deleteImage(image.id);
        }
      }
      await loadStorageInfo();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '12px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            Storage Management
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading storage information...
          </div>
        ) : (
          storageInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* LocalStorage Info */}
              <div>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                  }}
                >
                  LocalStorage
                </h3>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span>Size:</span>
                    <span>{formatBytes(storageInfo.localStorageSize)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span>Usage:</span>
                    <span>{storageInfo.localStorageUsagePercent.toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Components:</span>
                    <span>{storageInfo.nodeCount}</span>
                  </div>
                  {/* Usage bar */}
                  <div
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(storageInfo.localStorageUsagePercent, 100)}%`,
                        height: '100%',
                        backgroundColor:
                          storageInfo.localStorageUsagePercent > 80
                            ? '#ef4444'
                            : storageInfo.localStorageUsagePercent > 60
                              ? '#f59e0b'
                              : '#10b981',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* IndexedDB Info */}
              <div>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                  }}
                >
                  IndexedDB {!storageService.isIndexedDBReady() && '(Not Available)'}
                </h3>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                  {storageService.isIndexedDBReady() ? (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <span>Usage:</span>
                        <span>{formatBytes(storageInfo.indexedDBUsage)}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <span>Quota:</span>
                        <span>{formatBytes(storageInfo.indexedDBQuota)}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <span>Usage:</span>
                        <span>{storageInfo.indexedDBUsagePercent.toFixed(1)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Images:</span>
                        <span>{storageInfo.imageCount}</span>
                      </div>
                      {/* Usage bar */}
                      <div
                        style={{
                          marginTop: '12px',
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '3px',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(storageInfo.indexedDBUsagePercent, 100)}%`,
                            height: '100%',
                            backgroundColor:
                              storageInfo.indexedDBUsagePercent > 80
                                ? '#ef4444'
                                : storageInfo.indexedDBUsagePercent > 60
                                  ? '#f59e0b'
                                  : '#10b981',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      IndexedDB is not available in this browser. Images cannot be stored.
                    </p>
                  )}
                </div>
              </div>

              {/* Last Cleanup */}
              {storageInfo.lastCleanup && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#6b7280',
                      fontSize: '14px',
                    }}
                  >
                    <span>Last cleanup:</span>
                    <span>{formatDate(storageInfo.lastCleanup)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '20px',
                }}
              >
                <button
                  onClick={() => void loadStorageInfo()}
                  disabled={isLoading}
                  style={{
                    background: 'white',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  Refresh
                </button>

                <button
                  onClick={() => void handleCleanup()}
                  disabled={isLoading || isCleaningUp}
                  style={{
                    background: '#f59e0b',
                    border: 'none',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: isLoading || isCleaningUp ? 'not-allowed' : 'pointer',
                    opacity: isLoading || isCleaningUp ? 0.6 : 1,
                  }}
                >
                  {isCleaningUp ? 'Cleaning...' : 'Cleanup'}
                </button>

                <button
                  onClick={() => void handleClearAll()}
                  disabled={isLoading}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default StorageManagementDialog;
