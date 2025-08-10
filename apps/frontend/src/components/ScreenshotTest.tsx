/**
 * Test component for verifying screenshot capture functionality
 * This component can be used to test the screenshotUtils and validate image quality
 */

import React, { useRef, useState } from 'react';
import { captureElementScreenshot, getOptimalScreenshotOptions, type ScreenshotResult } from '../utils/screenshotUtils.ts';

const ScreenshotTest: React.FC = () => {
  const testElementRef = useRef<HTMLDivElement>(null);
  const [screenshotResult, setScreenshotResult] = useState<ScreenshotResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureTest = async (scenario: 'component' | 'preview' | 'thumbnail') => {
    if (!testElementRef.current) {
      console.error('Test element not found');
      return;
    }

    setIsCapturing(true);
    
    try {
      const options = getOptimalScreenshotOptions(scenario);
      const result = await captureElementScreenshot(testElementRef.current, {
        ...options,
        debug: true, // Enable debug logging for testing
      });
      
      setScreenshotResult(result);
      console.log('Screenshot test result:', result);
      
      if (result.success) {
        console.log(`✅ ${scenario} screenshot captured:`, {
          format: result.format,
          size: `${result.sizeKB}KB`,
          dimensions: result.dimensions,
          processingTime: `${result.processingTime}ms`,
        });
      }
    } catch (error) {
      console.error('Screenshot test failed:', error);
      setScreenshotResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        capturedAt: Date.now(),
      });
    }
    
    setIsCapturing(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Screenshot Capture Test</h2>
      
      {/* Test element to be captured */}
      <div
        ref={testElementRef}
        style={{
          width: '400px',
          height: '300px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '60px',
            height: '60px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            width: '40px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '20%',
          }}
        />
        
        <h3 style={{ margin: '0 0 10px 0', fontSize: '24px', textAlign: 'center' }}>
          Test Component
        </h3>
        <p style={{ margin: '0 0 15px 0', textAlign: 'center', opacity: 0.9 }}>
          This component will be captured as an image
        </p>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
        }}>
          📸 Ready for screenshot
        </div>
      </div>

      {/* Control buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => handleCaptureTest('component')}
          disabled={isCapturing}
          style={{
            background: '#6366f1',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            marginRight: '10px',
            cursor: isCapturing ? 'not-allowed' : 'pointer',
            opacity: isCapturing ? 0.6 : 1,
          }}
        >
          {isCapturing ? 'Capturing...' : 'Capture Component (WebP 85%)'}
        </button>
        
        <button
          onClick={() => handleCaptureTest('preview')}
          disabled={isCapturing}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            marginRight: '10px',
            cursor: isCapturing ? 'not-allowed' : 'pointer',
            opacity: isCapturing ? 0.6 : 1,
          }}
        >
          Capture Preview (WebP 75%)
        </button>
        
        <button
          onClick={() => handleCaptureTest('thumbnail')}
          disabled={isCapturing}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: isCapturing ? 'not-allowed' : 'pointer',
            opacity: isCapturing ? 0.6 : 1,
          }}
        >
          Capture Thumbnail (WebP 65%)
        </button>
      </div>

      {/* Results display */}
      {screenshotResult && (
        <div style={{
          background: screenshotResult.success ? '#f0f9ff' : '#fef2f2',
          border: `1px solid ${screenshotResult.success ? '#0ea5e9' : '#ef4444'}`,
          borderRadius: '8px',
          padding: '16px',
        }}>
          <h3 style={{
            margin: '0 0 10px 0',
            color: screenshotResult.success ? '#0c4a6e' : '#7f1d1d',
          }}>
            {screenshotResult.success ? '✅ Screenshot Captured' : '❌ Capture Failed'}
          </h3>
          
          {screenshotResult.success ? (
            <div>
              <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                <strong>Format:</strong> {screenshotResult.format}<br />
                <strong>Size:</strong> {screenshotResult.sizeKB}KB<br />
                <strong>Dimensions:</strong> {screenshotResult.dimensions?.width}×{screenshotResult.dimensions?.height}<br />
                <strong>Processing Time:</strong> {screenshotResult.processingTime}ms
              </div>
              
              {screenshotResult.dataUrl && (
                <div>
                  <p style={{ margin: '10px 0 5px 0', fontWeight: 'bold' }}>Preview:</p>
                  <img
                    src={screenshotResult.dataUrl}
                    alt="Captured screenshot"
                    style={{
                      maxWidth: '300px',
                      maxHeight: '200px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      objectFit: 'contain',
                    }}
                  />
                  
                  <div style={{ marginTop: '10px' }}>
                    <a
                      href={screenshotResult.dataUrl}
                      download={`screenshot-${Date.now()}.${screenshotResult.format}`}
                      style={{
                        background: '#6366f1',
                        color: 'white',
                        textDecoration: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    >
                      Download Screenshot
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#7f1d1d', fontSize: '14px' }}>
              <strong>Error:</strong> {screenshotResult.error}
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280' }}>
        <p><strong>Note:</strong> This test component validates:</p>
        <ul>
          <li>html2canvas integration and DOM capture</li>
          <li>WebP compression with PNG fallback</li>
          <li>Different quality settings by scenario</li>
          <li>Image resizing and optimization</li>
          <li>Processing time measurement</li>
        </ul>
      </div>
    </div>
  );
};

export default ScreenshotTest;