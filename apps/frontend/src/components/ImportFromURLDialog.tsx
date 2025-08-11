import React, { useState, useCallback, useEffect } from 'react';
import { ComponentPipeline } from '../services/ComponentPipeline.ts';
import { URLImportService } from '../services/URLImportService.ts';
import type { UnifiedComponentNode } from '../types/component.types.ts';

interface ImportFromURLDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (component: UnifiedComponentNode) => void;
}

const EXAMPLE_URLS = [
  {
    url: 'http://localhost:5173/test-component.js',
    label: 'Local Test Component',
    description: 'Colorful counter component (localhost)',
  },
  {
    url: 'http://localhost:5173/test-unpkg-component.js',
    label: 'Unpkg-style Test',
    description: 'Animated component example',
  },
  {
    url: 'https://esm.sh/react-colorful@5.6.1',
    label: 'React Colorful (ESM)',
    description: 'Color picker component - Note: ESM module',
  },
  {
    url: 'https://cdn.skypack.dev/react-confetti@6.1.0',
    label: 'React Confetti (Skypack)',
    description: 'Confetti animation - Note: ESM module',
  },
  {
    url: 'https://raw.githubusercontent.com/vercel/swr/main/examples/basic-data-fetching/pages/index.js',
    label: 'GitHub SWR Example',
    description: 'Data fetching example from GitHub',
  },
];

export const ImportFromURLDialog: React.FC<ImportFromURLDialogProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const pipeline = React.useRef(new ComponentPipeline()).current;
  const urlImportService = React.useRef(new URLImportService()).current;

  useEffect(() => {
    // Load recent URLs from localStorage
    const stored = localStorage.getItem('recentImportUrls');
    if (stored) {
      try {
        const urls = JSON.parse(stored);
        setRecentUrls(urls.slice(0, 5)); // Keep only last 5
      } catch (e) {
        console.error('Failed to load recent URLs:', e);
      }
    }
  }, []);

  const validateUrl = useCallback(
    (urlString: string) => {
      if (!urlString) {
        setValidationMessage(null);
        return false;
      }

      try {
        const urlObj = new URL(urlString);

        // Check if it's HTTPS or localhost
        if (urlObj.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(urlObj.hostname)) {
          setValidationMessage('⚠️ URL must use HTTPS for security');
          return false;
        }

        // Check if domain is trusted
        const trustedDomains = urlImportService.getTrustedDomains();
        const hostname = urlObj.hostname;
        const isTrusted = trustedDomains.some(
          (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
        );

        if (!isTrusted) {
          setValidationMessage(`⚠️ Domain ${hostname} is not in the trusted list`);
          return false;
        }

        // Special warning for ESM CDNs that often have issues
        if (
          hostname === 'esm.sh' ||
          hostname === 'cdn.skypack.dev' ||
          hostname.includes('unpkg.com')
        ) {
          setValidationMessage(
            '⚠️ ESM modules may require special handling - try local test components instead',
          );
          return true;
        }

        // Check file extension
        const pathname = urlObj.pathname.toLowerCase();
        const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.esm.js'];
        const hasValidExtension = validExtensions.some((ext) => pathname.endsWith(ext));

        if (!hasValidExtension && !pathname.includes('esm.sh') && !pathname.includes('skypack')) {
          setValidationMessage('ℹ️ URL may not contain a valid JavaScript module');
        } else {
          setValidationMessage('✅ URL appears valid');
        }

        return true;
      } catch {
        setValidationMessage('❌ Invalid URL format');
        return false;
      }
    },
    [urlImportService],
  );

  const handleImport = useCallback(async () => {
    if (!url || !validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const result = await pipeline.processURLComponent(
        url,
        {
          requireHTTPS: true,
          timeout: 15000,
          useCache: true,
        },
        {
          debug: true,
          validateOutput: true,
          useCache: true,
        },
      );

      if (result.success && result.component) {
        // Save to recent URLs
        const newRecent = [url, ...recentUrls.filter((u) => u !== url)].slice(0, 5);
        setRecentUrls(newRecent);
        localStorage.setItem('recentImportUrls', JSON.stringify(newRecent));

        // Import successful
        onImport(result.component);
        setUrl('');
        onClose();
      } else {
        setError(result.error || 'Failed to import component');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsImporting(false);
    }
  }, [url, validateUrl, pipeline, onImport, onClose, recentUrls]);

  const handleExampleClick = useCallback(
    (exampleUrl: string) => {
      setUrl(exampleUrl);
      validateUrl(exampleUrl);
      // Don't hide examples immediately so user can see the URL was populated
      // setShowExamples(false);
    },
    [validateUrl],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isImporting) {
        e.preventDefault();
        handleImport();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleImport, isImporting, onClose],
  );

  useEffect(() => {
    if (url) {
      validateUrl(url);
    }
  }, [url, validateUrl]);

  if (!isOpen) return null;

  return (
    <>
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
          zIndex: 9999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 10000,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
          Import Component from URL
        </h2>

        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f0f9ff',
            borderRadius: '6px',
            border: '1px solid #bfdbfe',
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#1e40af',
          }}
        >
          <strong>📦 Supported Formats:</strong>
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
            <li>
              JSX/JS files with <code>const Component = ...</code>
            </li>
            <li>Local development server (http://localhost:5173/...)</li>
            <li>GitHub raw content URLs</li>
            <li>ESM modules (esm.sh, skypack.dev) - experimental</li>
          </ul>
          <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.9 }}>
            <strong>Note:</strong> Most unpkg.com URLs are ESM modules that need special handling.
            Use the local test components for best results.
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
            Component URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://esm.sh/react-colorful@5.6.1"
            disabled={isImporting}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxSizing: 'border-box',
            }}
            autoFocus
          />
          {validationMessage && (
            <div
              style={{
                marginTop: '4px',
                fontSize: '12px',
                color: validationMessage.startsWith('✅')
                  ? '#10b981'
                  : validationMessage.startsWith('❌')
                    ? '#ef4444'
                    : validationMessage.startsWith('⚠️')
                      ? '#f59e0b'
                      : '#6b7280',
              }}
            >
              {validationMessage}
            </div>
          )}
        </div>

        {/* Example URLs */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => setShowExamples(!showExamples)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#4b5563',
            }}
          >
            {showExamples ? 'Hide' : 'Show'} Example URLs
          </button>

          {showExamples && (
            <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
              {EXAMPLE_URLS.map((example, index) => {
                const isSelected = url === example.url;
                return (
                  <div
                    key={index}
                    onClick={() => handleExampleClick(example.url)}
                    style={{
                      padding: '8px 12px',
                      marginBottom: '8px',
                      backgroundColor: isSelected ? '#dbeafe' : '#f9fafb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isSelected && <span>✓</span>}
                      {example.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                      {example.description}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#3b82f6',
                        marginTop: '2px',
                        wordBreak: 'break-all',
                      }}
                    >
                      {example.url}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent URLs */}
        {recentUrls.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}
            >
              Recent Imports
            </label>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {recentUrls.map((recentUrl, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setUrl(recentUrl);
                    validateUrl(recentUrl);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  {recentUrl}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              marginBottom: '16px',
              color: '#c00',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Supported CDNs info */}
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#0369a1',
          }}
        >
          <strong>Supported sources:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>ESM CDNs: esm.sh, skypack.dev, unpkg.com, jsdelivr.net</li>
            <li>GitHub: raw.githubusercontent.com, gist.githubusercontent.com</li>
            <li>Local development: localhost, 127.0.0.1</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isImporting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              opacity: isImporting ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || !url}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: isImporting || !url ? '#9ca3af' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: isImporting || !url ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isImporting ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
                Importing...
              </>
            ) : (
              'Import Component'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};
