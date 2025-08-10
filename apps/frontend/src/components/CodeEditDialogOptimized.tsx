import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CodeEditorSimple from './CodeEditorSimple.tsx';
import { codeEditDialogStyles } from './CodeEditDialog.styles.ts';
import { captureElementScreenshot } from '../utils/screenshotUtils.ts';
import type { VisionMetadata } from '../types/component.types.ts';

interface CodeEditDialogOptimizedProps {
  isOpen: boolean;
  code: string;
  prompt: string;
  nodeId?: string;
  onSave: (newCode: string) => void;
  onRegenerate: (refinementPrompt: string, currentCode: string, screenshotDataUrl?: string) => void;
  onCancel: () => void;
  isGenerating?: boolean;
  getNodeCode?: (nodeId: string) => string;
  getComponentElement?: (nodeId: string) => HTMLElement | null;
  visionMetadata?: VisionMetadata;
}

// Isolated component for refinement section to prevent re-renders
const RefinementSection = React.memo(({ 
  refinementPrompt, 
  setRefinementPrompt, 
  onRegenerate, 
  editedCode, 
  isGenerating,
  screenshotDataUrl 
}: {
  refinementPrompt: string;
  setRefinementPrompt: (value: string) => void;
  onRegenerate: (prompt: string, code: string, screenshotDataUrl?: string) => void;
  editedCode: string;
  isGenerating: boolean;
  screenshotDataUrl?: string;
}) => {
  const [debouncedRefinementPrompt, setDebouncedRefinementPrompt] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRefinementPrompt(refinementPrompt);
    }, 300);
    return () => clearTimeout(timer);
  }, [refinementPrompt]);
  
  return (
    <div style={{ 
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <label style={{
        display: 'block',
        marginBottom: '12px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#e5e5e5',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        Request Adjustments
      </label>
      <textarea
        value={refinementPrompt}
        onChange={(e) => setRefinementPrompt(e.target.value)}
        style={codeEditDialogStyles.textarea}
        onFocus={(e) => {
          Object.assign(e.currentTarget.style, codeEditDialogStyles.textareaFocused);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        placeholder="Describe what changes you want to make to the component..."
      />
      <button
        onClick={() => onRegenerate(debouncedRefinementPrompt, editedCode, screenshotDataUrl)}
        disabled={isGenerating || !debouncedRefinementPrompt.trim()}
        style={{
          marginTop: '16px',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: isGenerating ? '#4a4a4a' : '#6366f1',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isGenerating || !refinementPrompt.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isGenerating && debouncedRefinementPrompt.trim()) {
            e.currentTarget.style.backgroundColor = '#5558e3';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isGenerating) {
            e.currentTarget.style.backgroundColor = '#6366f1';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isGenerating ? (
          <>
            <span style={{
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
            }}>⚡</span>
            Regenerating...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Regenerate
          </>
        )}
      </button>
    </div>
  );
});

RefinementSection.displayName = 'RefinementSection';

// Vision Metadata Section Component
const VisionMetadataSection = React.memo(({ 
  visionMetadata, 
  isCapturingScreenshot, 
  isAnalyzing, 
  onRetakeScreenshot 
}: {
  visionMetadata?: VisionMetadata;
  isCapturingScreenshot: boolean;
  isAnalyzing: boolean;
  onRetakeScreenshot: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasVisionData = visionMetadata?.screenshot || visionMetadata?.visionAnalysis;
  
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#e5e5e5',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Visual Analysis
        </label>
        
        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCapturingScreenshot && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#f59e0b',
              fontSize: '12px'
            }}>
              <span style={{
                animation: 'spin 1s linear infinite',
                display: 'inline-block'
              }}>📷</span>
              Capturing...
            </div>
          )}
          
          {isAnalyzing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6366f1',
              fontSize: '12px'
            }}>
              <span style={{
                animation: 'spin 1s linear infinite',
                display: 'inline-block'
              }}>🔍</span>
              Analyzing...
            </div>
          )}
          
          {hasVisionData && !isCapturingScreenshot && !isAnalyzing && (
            <button
              onClick={onRetakeScreenshot}
              style={{
                background: '#2a2a2a',
                color: '#e5e5e5',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              📷 Retake
            </button>
          )}
          
          {hasVisionData && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'transparent',
                color: '#e5e5e5',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              ▼
            </button>
          )}
        </div>
      </div>
      
      {/* Vision Content */}
      <div style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        backgroundColor: '#0d0d0d',
        overflow: 'hidden',
      }}>
        {!hasVisionData && !isCapturingScreenshot && !isAnalyzing && (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#888',
            fontSize: '14px',
          }}>
            Screenshot will be captured automatically when you open this dialog
          </div>
        )}
        
        {hasVisionData && (
          <>
            {/* Screenshot Preview */}
            {visionMetadata?.screenshot && (
              <div style={{
                padding: '12px',
                borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <img
                    src={visionMetadata.screenshot.dataUrl}
                    alt="Component Screenshot"
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: '#e5e5e5',
                      fontSize: '13px',
                      fontWeight: '500',
                      marginBottom: '4px',
                    }}>
                      Screenshot Captured
                    </div>
                    <div style={{
                      color: '#888',
                      fontSize: '11px',
                    }}>
                      {visionMetadata.screenshot.format.toUpperCase()} • {visionMetadata.screenshot.sizeKB.toFixed(1)}KB
                      {visionMetadata.screenshot.capturedAt && (
                        <> • {new Date(visionMetadata.screenshot.capturedAt).toLocaleTimeString()}</>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Vision Analysis (Expandable) */}
            {isExpanded && visionMetadata?.visionAnalysis && (
              <div style={{
                padding: '16px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                <div style={{
                  color: '#e5e5e5',
                  fontSize: '13px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  🔍 AI Analysis
                  <span style={{
                    color: '#888',
                    fontSize: '11px',
                    fontWeight: 'normal',
                  }}>
                    ({visionMetadata.visionAnalysis.model})
                  </span>
                </div>
                <div style={{
                  color: '#ccc',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  {visionMetadata.visionAnalysis.analysis}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

VisionMetadataSection.displayName = 'VisionMetadataSection';

// Isolated component for code editor section
const CodeEditorSection = React.memo(({ 
  editedCode, 
  setEditedCode, 
  leftWidth, 
  copyFeedback, 
  handleCopyCode 
}: {
  editedCode: string;
  setEditedCode: (code: string) => void;
  leftWidth: number;
  copyFeedback: string | null;
  handleCopyCode: () => void;
}) => {
  return (
    <div style={{ 
      width: `${leftWidth}%`,
      display: 'flex',
      flexDirection: 'column',
      paddingRight: '12px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#e5e5e5',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Code
        </label>
        <button
          onClick={handleCopyCode}
          style={{
            background: copyFeedback ? '#10b981' : '#2a2a2a',
            color: copyFeedback ? 'white' : '#e5e5e5',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!copyFeedback) {
              e.currentTarget.style.backgroundColor = '#3a3a3a';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copyFeedback) {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          {copyFeedback ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {copyFeedback}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Code
            </>
          )}
        </button>
      </div>
      <div style={{
        flex: 1,
        minHeight: 0,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <CodeEditorSimple
          value={editedCode}
          onChange={setEditedCode}
          placeholder="// Enter your component code here..."
        />
      </div>
    </div>
  );
});

CodeEditorSection.displayName = 'CodeEditorSection';

const CodeEditDialogOptimized: React.FC<CodeEditDialogOptimizedProps> = ({
  isOpen,
  code,
  prompt,
  nodeId,
  onSave,
  onRegenerate,
  onCancel,
  isGenerating = false,
  getNodeCode,
  getComponentElement,
  visionMetadata,
}) => {
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [editedCode, setEditedCode] = useState(code);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentVisionMetadata, setCurrentVisionMetadata] = useState<VisionMetadata | undefined>(visionMetadata);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Memoize the node code to prevent expensive recalculations
  const nodeCode = useMemo(() => {
    if (nodeId && getNodeCode && isOpen) {
      return getNodeCode(nodeId);
    }
    return code;
  }, [nodeId, getNodeCode, isOpen, code]);

  // Vision service initialization removed - analysis now handled by backend

  // Update vision metadata when prop changes
  useEffect(() => {
    setCurrentVisionMetadata(visionMetadata);
  }, [visionMetadata]);

  // Perform vision analysis on screenshot
  const performVisionAnalysis = useCallback(async (screenshotDataUrl: string, metadata: VisionMetadata) => {
    if (!screenshotDataUrl) {
      console.warn('Cannot perform vision analysis: no screenshot data');
      return;
    }

    setIsAnalyzing(true);
    console.log('🔍 Starting vision analysis...');

    try {
      // Create a simple VisionService instance (no API key needed - handled server-side)
      const visionService = new (await import('../services/vision.ts')).default();
      
      // Trigger vision analysis with a generic analysis prompt
      const analysisResult = await visionService.analyzeComponent({
        imageDataUrl: screenshotDataUrl,
        userPrompt: 'Analyze this component for visual design, layout, and potential improvements',
        componentCode: nodeCode,
        preferredModel: 'llama-4-maverick'
      });

      if (analysisResult.success && analysisResult.analysis) {
        console.log('✅ Vision analysis completed');
        
        // Update metadata with analysis results
        const updatedMetadata: VisionMetadata = {
          ...metadata,
          visionAnalysis: {
            analysis: analysisResult.analysis,
            analyzedAt: Date.now(),
            prompt: 'Analyze this component for visual design, layout, and potential improvements',
            model: analysisResult.model || 'llama-4-maverick',
            confidence: analysisResult.confidence
          }
        };

        setCurrentVisionMetadata(updatedMetadata);
      } else {
        console.warn('⚠️ Vision analysis failed:', analysisResult.error);
      }
    } catch (error) {
      console.error('❌ Vision analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [nodeCode]);

  // Capture screenshot of component
  const captureComponentScreenshot = useCallback(async () => {
    if (!nodeId || !getComponentElement) {
      console.warn('Cannot capture screenshot: missing nodeId or getComponentElement function');
      return;
    }

    const componentElement = getComponentElement(nodeId);
    if (!componentElement) {
      console.warn('Cannot capture screenshot: component element not found');
      return;
    }

    setIsCapturingScreenshot(true);

    try {
      const screenshotResult = await captureElementScreenshot(componentElement, {
        format: 'webp',
        quality: 0.85,
        maxWidth: 1024,
        maxHeight: 1024,
        backgroundColor: '#ffffff',
        debug: false,
      });

      if (screenshotResult.success && screenshotResult.dataUrl) {
        console.log('✅ Screenshot captured successfully:', screenshotResult);
        
        // Update local metadata with screenshot
        const updatedMetadata: VisionMetadata = {
          ...currentVisionMetadata,
          screenshot: {
            dataUrl: screenshotResult.dataUrl,
            format: screenshotResult.format || 'webp',
            capturedAt: screenshotResult.capturedAt,
            sizeKB: screenshotResult.sizeKB || 0,
          },
        };
        
        setCurrentVisionMetadata(updatedMetadata);
        
        // Automatically trigger vision analysis after screenshot capture
        await performVisionAnalysis(screenshotResult.dataUrl, updatedMetadata);
      } else {
        console.error('❌ Screenshot capture failed:', screenshotResult.error);
      }
    } catch (error) {
      console.error('❌ Screenshot capture error:', error);
    } finally {
      setIsCapturingScreenshot(false);
    }
  }, [nodeId, getComponentElement, currentVisionMetadata, performVisionAnalysis]);

  // Reset state and capture screenshot when modal opens
  useEffect(() => {
    if (isOpen) {
      setRefinementPrompt('');
      setEditedCode(nodeCode);
      
      // Always clear existing vision metadata when switching components
      setCurrentVisionMetadata(undefined);
      
      // Always trigger fresh screenshot capture when modal opens for a component
      if (nodeId && getComponentElement) {
        captureComponentScreenshot();
      }
    }
  }, [nodeCode, isOpen, nodeId]); // Removed captureComponentScreenshot and getComponentElement from deps

  // Vision analysis is now handled by the backend during regeneration

  // Handle retake screenshot
  const handleRetakeScreenshot = useCallback(() => {
    setCurrentVisionMetadata(prev => ({
      ...prev,
      screenshot: undefined,
      visionAnalysis: undefined,
    }));
    captureComponentScreenshot();
  }, [captureComponentScreenshot]);

  // Note: Vision analysis is now handled in the backend during regeneration
  // We no longer auto-trigger vision analysis on prompt changes

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedCode);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [editedCode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !contentRef.current) return;
    
    const content = contentRef.current;
    const rect = content.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    const newWidth = Math.min(Math.max(percentage, 30), 70);
    setLeftWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove]);

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
    }}>
      <div 
        ref={containerRef}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '90vw',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '600',
            color: '#ffffff',
            letterSpacing: '-0.5px',
          }}>
            Edit Component
          </h2>
        </div>

        {/* Content - Two Column Layout */}
        <div 
          ref={contentRef}
          style={{
            flex: 1,
            display: 'flex',
            padding: '24px 32px',
            gap: '0',
            minHeight: 0,
            position: 'relative',
          }}
        >
          {/* Left Column - Code Editor */}
          <CodeEditorSection
            editedCode={editedCode}
            setEditedCode={setEditedCode}
            leftWidth={leftWidth}
            copyFeedback={copyFeedback}
            handleCopyCode={handleCopyCode}
          />

          {/* Resize Handle */}
          <div
            style={{
              width: '4px',
              backgroundColor: isResizing ? '#6366f1' : 'transparent',
              cursor: 'ew-resize',
              position: 'relative',
              margin: '0 8px',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
            }}
            onMouseDown={() => setIsResizing(true)}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '4px',
              height: '40px',
              backgroundColor: isResizing ? '#6366f1' : 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
            }} />
          </div>

          {/* Right Column - Original Prompt and Refinement */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: '12px',
            gap: '24px',
          }}>
            {/* Original Prompt Section */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
            }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e5e5e5',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Original Prompt
              </label>
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#0d0d0d',
                color: '#e5e5e5',
                fontSize: '14px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minHeight: '80px',
                maxHeight: '140px',
                overflowY: 'auto',
              }}>
                {prompt || 'No prompt provided'}
              </div>
            </div>

            {/* Vision Metadata Section */}
            <VisionMetadataSection
              visionMetadata={currentVisionMetadata}
              isCapturingScreenshot={isCapturingScreenshot}
              isAnalyzing={isAnalyzing}
              onRetakeScreenshot={handleRetakeScreenshot}
            />

            {/* Refinement Section */}
            <RefinementSection
              refinementPrompt={refinementPrompt}
              setRefinementPrompt={setRefinementPrompt}
              onRegenerate={onRegenerate}
              editedCode={editedCode}
              isGenerating={isGenerating}
              screenshotDataUrl={currentVisionMetadata?.screenshot?.dataUrl}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(to top, #2a2a2a, #1a1a1a)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={isGenerating}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#e5e5e5',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedCode)}
            disabled={isGenerating || !editedCode.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#6366f1',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isGenerating || !editedCode.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating && editedCode.trim()) {
                e.currentTarget.style.backgroundColor = '#5558e3';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366f1';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Code
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default React.memo(CodeEditDialogOptimized, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.code === nextProps.code &&
    prevProps.prompt === nextProps.prompt &&
    prevProps.nodeId === nextProps.nodeId &&
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.getNodeCode === nextProps.getNodeCode
  );
});