import { Handle, type NodeProps, NodeResizer, Position } from '@xyflow/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentState } from '../../types/native-component.types.ts';

interface ImageNodeData {
  // Native component fields
  componentType: 'native';
  nativeType: 'image';
  state: ComponentState;
  source: 'native';
  id: string;

  // UI-specific fields
  presentationMode?: boolean;
  onDelete?: (nodeId: string) => void;
  onUpdateState?: (nodeId: string, newState: ComponentState) => void;

  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

interface ImageNodeProps extends NodeProps {
  data: ImageNodeData;
}

const ImageNode = ({ id, data, selected = false }: ImageNodeProps) => {
  const { state, presentationMode, onDelete, onUpdateState } = data;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep for future use when dynamic sizing is implemented
  // const getDisplayDimensions = useCallback(() => {
  //   if (!state.dimensions) {
  //     return { width: 200, height: 200 };
  //   }

  //   const { width: originalWidth, aspectRatio } = state.dimensions;

  //   // Get container dimensions or use defaults
  //   const containerWidth = containerRef.current?.offsetWidth || 300;
  //   const containerHeight = containerRef.current?.offsetHeight || 300;

  //   // Calculate dimensions that fit within container while maintaining aspect ratio
  //   let displayWidth = Math.min(containerWidth, originalWidth);
  //   let displayHeight = displayWidth / aspectRatio;

  //   // If height is too large, scale down based on height
  //   if (displayHeight > containerHeight) {
  //     displayHeight = containerHeight;
  //     displayWidth = displayHeight * aspectRatio;
  //   }

  //   return {
  //     width: displayWidth,
  //     height: displayHeight
  //   };
  // }, [state.dimensions]);

  // Handle image load events
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setError('Failed to load image');
    setImageLoaded(false);
    setIsLoading(false);
  }, []);

  // Save image to local device
  const handleSaveImage = useCallback(async () => {
    if (!state.blobUrl) {
      return;
    }

    try {
      // Create download link
      const link = document.createElement('a');
      link.href = state.blobUrl;
      link.download = `image-${id}.${state.format?.split('/')[1] || 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to save image:', error);
    }
  }, [state.blobUrl, state.format, id]);

  // Copy image to clipboard
  const handleCopyImage = useCallback(async () => {
    if (!state.blobUrl) {
      return;
    }

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not supported');
      }

      const response = await fetch(state.blobUrl);
      const blob = await response.blob();

      if ('write' in navigator.clipboard) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      } else {
        // Fallback for older browsers - copy the blob URL
        const clipboard = navigator.clipboard as { writeText?: (text: string) => Promise<void> };
        if (clipboard.writeText) {
          await clipboard.writeText(state.blobUrl);
        }
      }
    } catch (error) {
      console.error('Failed to copy image:', error);
    }
  }, [state.blobUrl]);

  // Keep for future alt text editing functionality
  // const handleAltTextChange = useCallback((newAlt: string) => {
  //   if (onUpdateState) {
  //     onUpdateState(id, { ...state, alt: newAlt });
  //   }
  // }, [id, state, onUpdateState]);

  // Format file size for display
  const formatFileSize = useCallback((sizeKB?: number): string => {
    if (!sizeKB) {
      return 'Unknown size';
    }
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    }
    return `${(sizeKB / 1024).toFixed(1)} MB`;
  }, []);

  // Format dimensions for display
  const formatDimensions = useCallback((dimensions?: ComponentState['dimensions']): string => {
    if (!dimensions) {
      return 'Unknown dimensions';
    }
    return `${dimensions.width} × ${dimensions.height}`;
  }, []);

  // Show loading state initially
  useEffect(() => {
    if (state.blobUrl && !imageLoaded) {
      setIsLoading(true);
    }
  }, [state.blobUrl, imageLoaded]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '100px',
        minHeight: '100px',
        position: 'relative',
        cursor: state.locked ? 'not-allowed' : 'move',
        background: selected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
        border: selected && !presentationMode ? '2px solid #6366f1' : '2px solid transparent',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Node Resizer - only show if not locked */}
      {!state.locked && (
        <NodeResizer
          minWidth={50}
          minHeight={50}
          keepAspectRatio={true}
          isVisible={selected && !(presentationMode as boolean)}
          handleStyle={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#6366f1',
            border: '2px solid white',
          }}
          lineStyle={{
            stroke: '#6366f1',
            strokeWidth: 2,
            strokeDasharray: '5 5',
          }}
        />
      )}

      {/* Main image container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Loading state */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #6366f1',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              color: '#ef4444',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15L16 10L5 21" />
            </svg>
            <div style={{ marginTop: '8px' }}>{error}</div>
          </div>
        )}

        {/* Image display */}
        {state.blobUrl && !error && (
          <img
            ref={imgRef}
            src={state.blobUrl}
            alt={state.alt || 'Pasted image'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: imageLoaded ? 'block' : 'none',
              borderRadius: '4px',
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        )}

        {/* Fallback when no image */}
        {!(state.blobUrl || error) && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              color: '#6b7280',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15L16 10L5 21" />
            </svg>
            <div style={{ marginTop: '8px' }}>No image loaded</div>
          </div>
        )}
      </div>

      {/* Metadata overlay */}
      {showMetadata && state.sizeKB && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          <div>
            <strong>Format:</strong> {state.format?.toUpperCase() || 'Unknown'}
          </div>
          <div>
            <strong>Size:</strong> {formatFileSize(state.sizeKB)}
          </div>
          <div>
            <strong>Dimensions:</strong> {formatDimensions(state.dimensions)}
          </div>
          {state.metadata?.pastedAt && (
            <div>
              <strong>Added:</strong> {new Date(state.metadata.pastedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Control buttons - only show if not in presentation mode and not locked */}
      {!(presentationMode || state.locked) && selected && (
        <div
          className="nodrag"
          style={{
            position: 'absolute',
            top: '-36px',
            right: '0',
            display: 'flex',
            gap: '4px',
            background: 'white',
            padding: '4px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Metadata toggle button */}
          <button
            type="button"
            onClick={() => setShowMetadata(!showMetadata)}
            style={{
              background: showMetadata ? '#eef2ff' : 'transparent',
              color: showMetadata ? '#6366f1' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
            }}
            title="Toggle metadata"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6" />
              <path d="M1 12h6m6 0h6" />
            </svg>
          </button>

          {/* Save image button */}
          {state.blobUrl && (
            <button
              type="button"
              onClick={handleSaveImage}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                borderRadius: '4px',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              title="Save image"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          )}

          {/* Copy image button */}
          {state.blobUrl && (
            <button
              type="button"
              onClick={handleCopyImage}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                borderRadius: '4px',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              title="Copy image"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}

          {/* Lock button */}
          <button
            type="button"
            onClick={() => onUpdateState?.(id, { ...state, locked: true })}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
            }}
            title="Lock image"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </button>

          {/* Delete button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(id)}
              style={{
                background: 'transparent',
                color: '#ef4444',
                border: 'none',
                borderRadius: '4px',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              title="Delete image"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Unlock indicator for locked images */}
      {state.locked && !presentationMode && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '4px',
            padding: '2px',
            cursor: 'pointer',
          }}
          onClick={() => onUpdateState?.(id, { ...state, locked: false })}
          title="Click to unlock"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
          >
            <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
      )}

      {/* Connection handles */}
      {!presentationMode && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            style={{
              width: '8px',
              height: '8px',
              background: '#6366f1',
              border: '2px solid white',
              visibility: selected ? 'visible' : 'hidden',
            }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            style={{
              width: '8px',
              height: '8px',
              background: '#6366f1',
              border: '2px solid white',
              visibility: selected ? 'visible' : 'hidden',
            }}
          />
        </>
      )}

      {/* CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default memo(ImageNode);
