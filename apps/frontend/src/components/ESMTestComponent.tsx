import React, { useState } from 'react';
import { esmExecutor } from '../utils/esmExecutor.ts';
import { AsyncComponentLoader } from './AsyncComponentLoader.tsx';

/**
 * Test component for ESM loading functionality
 * Tests both direct URL imports and code-based ESM execution
 */

export const ESMTestComponent: React.FC = () => {
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [aiGeneratedCode, setAiGeneratedCode] = useState<string>('');
  const [cdnUrl, setCdnUrl] = useState<string>(
    'https://esm.sh/react-confetti@6.1.0?external=react',
  );

  // ESM code for testing - using standard imports with import maps
  const esmTestCode = `
import React, { useState } from 'react';

export default function TestComponent() {
  const [count, setCount] = useState(0);
  
  return React.createElement('div', {
    style: {
      padding: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      textAlign: 'center'
    }
  },
    React.createElement('h2', null, 'ESM Test Component (Standard Imports)'),
    React.createElement('p', null, 'Count: ' + count),
    React.createElement('button', {
      onClick: () => setCount(count + 1),
      style: {
        padding: '8px 16px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }
    }, 'Increment')
  );
}`;

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  const clearCache = () => {
    esmExecutor.clearCache();
    addTestResult('🗑️ Cache cleared');
  };

  const getCacheStats = () => {
    const stats = esmExecutor.getCacheStats();
    addTestResult(`📊 Cache stats - Size: ${stats.size}, Hits: ${stats.hits}, URLs: ${stats.urls}`);
  };

  const testImportMaps = () => {
    // Test loading a file that uses standard imports with import maps
    const url = `${window.location.origin}/test-components/import-map-test.js`;
    setCurrentTest(url);
    addTestResult('🧪 Testing import maps with standard React imports...');
    addTestResult(`📁 Loading component from: ${url}`);
  };

  const testStandardESM = () => {
    // Test standard ESM component with React imports
    const url = `${window.location.origin}/test-components/standard-esm-component.js`;
    setCurrentTest(url);
    addTestResult(`📦 Testing standard ESM component: ${url}`);
  };

  const testHooksComponent = () => {
    // Test component with multiple hooks
    const url = `${window.location.origin}/test-components/hooks-test-component.js`;
    setCurrentTest(url);
    addTestResult(`🪝 Testing hooks component: ${url}`);
  };

  const testNestedComponent = () => {
    // Test nested components with prop passing
    const url = `${window.location.origin}/test-components/nested-component.js`;
    setCurrentTest(url);
    addTestResult(`🎯 Testing nested components: ${url}`);
  };

  const testNPMPackage = () => {
    // Test importing from NPM via esm.sh
    const url = `${window.location.origin}/test-components/npm-esm-test.js`;
    setCurrentTest(url);
    addTestResult(`📦 Testing NPM package import via esm.sh: ${url}`);
  };

  const testSimpleNPM = () => {
    // Test simple NPM utility library
    const url = `${window.location.origin}/test-components/simple-npm-test.js`;
    setCurrentTest(url);
    addTestResult(`🎯 Testing simple NPM utility (clsx): ${url}`);
  };

  const testShimDirectly = () => {
    // Test loading our test component that uses the shims
    const url = `${window.location.origin}/test-components/simple-test.js`;
    setCurrentTest(url);
    addTestResult(`🔍 Testing shim module directly: ${url}`);
  };

  const testAIGeneratedESM = async () => {
    // Example of AI-generated JSX component (matches what Cerebras would generate)
    const aiCode = `
import React, { useState, useEffect } from 'react';

const AIGeneratedCounter = () => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    setMessage(\`Button clicked \${count} times\`);
  }, [count]);
  
  return (
    <div style={{
      padding: '30px',
      backgroundColor: '#f3f4f6',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>
        AI Generated ESM Component
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>{message}</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Increment
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default AIGeneratedCounter;`;

    addTestResult('🤖 Testing AI-generated ESM component with standard React imports');
    addTestResult(
      '📦 Processing JSX through ComponentPipeline (same as Generate Component flow)...',
    );

    try {
      // Import ComponentPipeline
      const { ComponentPipeline } = await import('../services/ComponentPipeline.ts');
      const pipeline = new ComponentPipeline();

      // Process through the same pipeline as Generate Component
      const pipelineResult = await pipeline.processAIComponent(
        aiCode,
        'AI Generated Counter Component Test',
        0, // generationTime
        {
          debug: true,
          useCache: false, // Don't cache test components
          validateOutput: true,
        },
      );

      if (pipelineResult.success && pipelineResult.component) {
        addTestResult('✅ JSX transpilation successful!');
        addTestResult(`   Processing time: ${(pipelineResult.processingTime || 0).toFixed(2)}ms`);
        addTestResult(`   Original code: ${aiCode.length} chars`);
        addTestResult(
          `   Transpiled code: ${pipelineResult.component.compiledCode?.length || 0} chars`,
        );

        // Set the transpiled code for display
        setAiGeneratedCode(pipelineResult.component.compiledCode || aiCode);
        setCurrentTest('ai-generated');

        addTestResult('🎯 Component ready for execution via esmExecutor');
      } else {
        addTestResult(`❌ Pipeline processing failed: ${pipelineResult.error}`);
        if (pipelineResult.warnings?.length) {
          pipelineResult.warnings.forEach((warning) => addTestResult(`   ⚠️  Warning: ${warning}`));
        }
      }
    } catch (error) {
      addTestResult(
        `❌ ComponentPipeline error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const testReactIcons = () => {
    // Test the React Icons demo component
    setCurrentTest('/components/react-icons-demo.js');
    addTestResult('🎨 Testing React Icons component from esm.sh CDN...');
    addTestResult('  This loads real React icon components dynamically');
  };

  const testLucideIcons = () => {
    // Test Lucide React icons from NPM
    setCurrentTest('/components/lucide-icons-demo.js');
    addTestResult('🎨 Testing Lucide React icons from NPM package...');
    addTestResult('  Loading lucide-react@0.294.0 from esm.sh CDN');
    addTestResult('  Using ?external=react to avoid React bundling');
    addTestResult('  1000+ icons available from published package');
  };

  const testReactFeather = () => {
    // Test React Feather icons from NPM
    setCurrentTest('/components/react-feather-demo.js');
    addTestResult('🪶 Testing React Feather icons from NPM package...');
    addTestResult('  Loading react-feather@2.0.10 from esm.sh CDN');
    addTestResult('  287+ icons from popular published package');
    addTestResult('  Using ?external=react for React 19 compatibility');
  };

  const testLucideProduction = () => {
    // Test production-style top-level import
    setCurrentTest('/components/lucide-icons-production.js');
    addTestResult('🚀 Testing production-style top-level import...');
    addTestResult('  Import at module level, not in useEffect');
    addTestResult('  Icons available immediately - no loading state');
    addTestResult('  Better for real production applications');
  };

  const testConfettiButton = () => {
    // Test confetti button that loads canvas-confetti from CDN
    setCurrentTest('/components/confetti-button.js');
    addTestResult('🎊 Testing Confetti Button from NPM package...');
    addTestResult('  Loading canvas-confetti@1.9.2 from jsdelivr CDN');
    addTestResult('  Popular npm package for celebration effects');
  };

  // New CDN URL testing functions
  const testDirectCDNUrl = () => {
    if (!cdnUrl.trim()) {
      addTestResult('❌ Please enter a CDN URL to test');
      return;
    }

    setCurrentTest(cdnUrl);
    addTestResult(`🚀 Testing direct CDN import: ${cdnUrl}`);
    addTestResult('  Using direct ES module import (no blob URLs)');
    addTestResult('  Import maps work normally for React resolution');

    if (cdnUrl.includes('?external=react')) {
      addTestResult('  ✅ Using ?external=react for React 19 compatibility');
    } else {
      addTestResult('  ⚠️  Consider adding ?external=react for better compatibility');
    }
  };

  const testPresetCDN = (url: string, name: string, description: string) => {
    setCdnUrl(url);
    setCurrentTest(url);
    addTestResult(`🎯 Testing ${name}: ${url}`);
    addTestResult(`  ${description}`);
    addTestResult('  Using optimized direct CDN import method');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>ESM Component Testing</h1>

      {/* Control Panel */}
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h3>Test Controls</h3>

        {/* Import Map Tests Section */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '10px 0', color: '#2E7D32' }}>🗺️ Import Map Tests</h4>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 10px 0' }}>
            <strong>Flow:</strong> AsyncComponentLoader → Static File URLs → Import Map Resolution →
            React Component
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={testShimDirectly}
              style={{ ...buttonStyle, backgroundColor: '#00BCD4' }}
            >
              Test Shim Module
            </button>
            <button type="button" onClick={testImportMaps} style={{ ...buttonStyle, backgroundColor: '#4CAF50' }}>
              Test Import Maps
            </button>
            <button
              onClick={testStandardESM}
              style={{ ...buttonStyle, backgroundColor: '#8BC34A' }}
            >
              Standard ESM
            </button>
            <button
              onClick={testHooksComponent}
              style={{ ...buttonStyle, backgroundColor: '#03A9F4' }}
            >
              Hooks Test
            </button>
            <button
              onClick={testNestedComponent}
              style={{ ...buttonStyle, backgroundColor: '#9C27B0' }}
            >
              Nested Components
            </button>
            <button type="button" onClick={testNPMPackage} style={{ ...buttonStyle, backgroundColor: '#FF6B6B' }}>
              NPM Package (esm.sh)
            </button>
            <button type="button" onClick={testSimpleNPM} style={{ ...buttonStyle, backgroundColor: '#00ACC1' }}>
              Simple NPM (clsx)
            </button>
          </div>
        </div>

        {/* AI-Generated ESM Section */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '10px 0', color: '#7B1FA2' }}>🤖 AI-Generated ESM Components</h4>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 10px 0' }}>
            <strong>Flow:</strong> Raw JSX → ComponentPipeline → JSX Transpilation → esmExecutor →
            React Component
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={testAIGeneratedESM}
              style={{ ...buttonStyle, backgroundColor: '#8E24AA' }}
            >
              Test AI ESM Component
            </button>
          </div>
        </div>

        {/* Direct CDN URL Testing Section (NEW) */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '10px 0', color: '#D32F2F' }}>🔗 Direct CDN URL Testing</h4>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 10px 0' }}>
            <strong>Flow:</strong> Direct import() → CDN URL → No blob URLs → Native ES Module →
            React Component
          </p>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              value={cdnUrl}
              onChange={(e) => setCdnUrl(e.target.value)}
              placeholder="Enter CDN URL (e.g., https://esm.sh/package@version?external=react)"
              style={{
                flex: '1',
                minWidth: '300px',
                padding: '8px 12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={testDirectCDNUrl}
              style={{ ...buttonStyle, backgroundColor: '#D32F2F', fontWeight: 'bold' }}
            >
              🚀 Test CDN URL
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() =>
                testPresetCDN(
                  'https://esm.sh/react-confetti@6.1.0?external=react',
                  'React Confetti',
                  'Celebration confetti animations',
                )
              }
              style={{ ...buttonStyle, backgroundColor: '#FF6B35', fontSize: '12px' }}
            >
              🎊 Confetti
            </button>
            <button
              onClick={() =>
                testPresetCDN(
                  'https://esm.sh/react-qr-code@2.0.12?external=react',
                  'QR Code',
                  'Generate QR codes from text',
                )
              }
              style={{ ...buttonStyle, backgroundColor: '#4ECDC4', fontSize: '12px' }}
            >
              📱 QR Code
            </button>
            <button
              onClick={() =>
                testPresetCDN(
                  'https://esm.sh/react-color@2.19.3/lib/Chrome?external=react',
                  'Color Picker',
                  'Chrome-style color picker',
                )
              }
              style={{ ...buttonStyle, backgroundColor: '#45B7D1', fontSize: '12px' }}
            >
              🎨 Color Picker
            </button>
            <button
              onClick={() =>
                testPresetCDN(
                  'https://esm.sh/react-markdown@9.0.1?external=react',
                  'Markdown',
                  'Render markdown to React',
                )
              }
              style={{ ...buttonStyle, backgroundColor: '#96CEB4', fontSize: '12px' }}
            >
              📝 Markdown
            </button>
          </div>
        </div>

        {/* React Component Libraries Section */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '10px 0', color: '#1565C0' }}>
            ⚛️ React Component Libraries from CDN
          </h4>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 10px 0' }}>
            <strong>Flow:</strong> AsyncComponentLoader → CDN URLs (esm.sh/jsdelivr) → Published NPM
            Packages → React Components
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={testReactIcons}
              style={{ ...buttonStyle, backgroundColor: '#2196F3', fontWeight: 'bold' }}
            >
              🎨 React Icons (NPM)
            </button>
            <button
              onClick={testLucideIcons}
              style={{ ...buttonStyle, backgroundColor: '#10B981', fontWeight: 'bold' }}
            >
              🎨 Lucide Icons (NPM)
            </button>
            <button
              onClick={testReactFeather}
              style={{ ...buttonStyle, backgroundColor: '#6366F1', fontWeight: 'bold' }}
            >
              🪶 React Feather (NPM)
            </button>
            <button
              onClick={testLucideProduction}
              style={{ ...buttonStyle, backgroundColor: '#EC4899', fontWeight: 'bold' }}
            >
              🚀 Lucide (Production Style)
            </button>
            <button
              onClick={testConfettiButton}
              style={{ ...buttonStyle, backgroundColor: '#FFD700', fontWeight: 'bold' }}
            >
              🎊 Confetti Button (NPM)
            </button>
          </div>
        </div>

        {/* Cache Management */}
        <div>
          <h4 style={{ margin: '10px 0', color: '#FF6F00' }}>🗄️ Cache Management</h4>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 10px 0' }}>
            <strong>Flow:</strong> esmExecutor Cache → Clear/Stats → Module URL Management →
            Performance Metrics
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={clearCache} style={{ ...buttonStyle, backgroundColor: '#ff9800' }}>
              Clear Cache
            </button>
            <button type="button" onClick={getCacheStats} style={{ ...buttonStyle, backgroundColor: '#2196F3' }}>
              Get Cache Stats
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        <h3>Test Results</h3>
        {testResults.length === 0 ? (
          <p style={{ color: '#999' }}>No tests run yet</p>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {testResults.map((result, i) => (
              <div key={i} style={{ marginBottom: '5px' }}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Component Display Area */}
      <div
        style={{
          border: '2px dashed #ddd',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '300px',
          backgroundColor: 'white',
        }}
      >
        <h3>Component Display</h3>

        {(currentTest.includes('/components/animated-button') ||
          currentTest.includes('/components/simple-counter') ||
          currentTest.includes('/test-components/')) && (
          <AsyncComponentLoader
            moduleUrl={currentTest}
            debug={true}
            cache={true}
            onLoad={(result) => {
              addTestResult('✅ Component loaded successfully!');
              if (result.metadata) {
                addTestResult(`   Load time: ${result.metadata.loadTime.toFixed(2)}ms`);
              }
            }}
            onError={(error) => {
              addTestResult(`❌ Component load error: ${error.message}`);
            }}
          />
        )}

        {currentTest === 'code' && (
          <AsyncComponentLoader
            code={esmTestCode}
            debug={true}
            cache={true}
            onLoad={(result) => {
              addTestResult('✅ ESM code executed successfully!');
              if (result.metadata) {
                addTestResult(`   Load time: ${result.metadata.loadTime.toFixed(2)}ms`);
                addTestResult(`   Module size: ${result.metadata.moduleSize} bytes`);
              }
            }}
            onError={(error) => {
              addTestResult(`❌ ESM execution error: ${error.message}`);
            }}
          />
        )}

        {currentTest === 'dynamic' && (
          <AsyncComponentLoader
            code={esmTestCode}
            debug={true}
            cache={true}
            fallback={<div>Loading dynamic component...</div>}
          />
        )}

        {currentTest === 'ai-generated' && aiGeneratedCode && (
          <AsyncComponentLoader
            code={aiGeneratedCode}
            debug={true}
            cache={false}
            onLoad={(result) => {
              addTestResult('✅ AI-generated ESM component loaded successfully!');
              if (result.metadata) {
                addTestResult(`   Load time: ${result.metadata.loadTime.toFixed(2)}ms`);
                addTestResult(`   Module size: ${result.metadata.moduleSize} bytes`);
              }
            }}
            onError={(error) => {
              addTestResult(`❌ AI-generated ESM error: ${error.message}`);
            }}
          />
        )}

        {/* Direct CDN URL Tests */}
        {currentTest &&
          (currentTest.startsWith('https://esm.sh/') ||
            currentTest.startsWith('https://cdn.jsdelivr.net/') ||
            currentTest.startsWith('https://unpkg.com/')) && (
            <AsyncComponentLoader
              moduleUrl={currentTest}
              debug={true}
              cache={true}
              onLoad={(result) => {
                addTestResult('✅ Direct CDN import successful!');
                addTestResult(`   URL: ${currentTest}`);
                addTestResult(
                  `   Load method: ${result.metadata?.loadTime === 0 ? 'Direct import (no blob)' : 'Fetch + blob method'}`,
                );
                if (result.metadata && result.metadata.loadTime > 0) {
                  addTestResult(`   Load time: ${result.metadata.loadTime.toFixed(2)}ms`);
                }
              }}
              onError={(error) => {
                addTestResult(`❌ Direct CDN import failed: ${error.message}`);
                addTestResult(`   URL: ${currentTest}`);
                addTestResult('   Try checking the CDN URL or adding ?external=react flag');
              }}
            />
          )}

        {/* React Component Library Tests */}
        {currentTest === '/components/react-icons-demo.js' && (
          <AsyncComponentLoader
            moduleUrl="/components/react-icons-demo.js"
            debug={true}
            cache={true}
            onLoad={(result) => {
              addTestResult('✅ React Icons demo component loaded successfully!');
              addTestResult('   This component dynamically imports react-icons from esm.sh');
              if (result.metadata) {
                addTestResult(`   Load time: ${result.metadata.loadTime?.toFixed(2) || 0}ms`);
              }
            }}
            onError={(error) => {
              addTestResult(`❌ React Icons demo error: ${error.message}`);
            }}
          />
        )}

        {currentTest === '/components/lucide-icons-demo.js' && (
          <AsyncComponentLoader
            moduleUrl="/components/lucide-icons-demo.js"
            debug={true}
            cache={true}
            onLoad={(result) => {
              addTestResult('✅ Lucide React icons loaded successfully!');
              addTestResult('   Published NPM package via esm.sh CDN');
              addTestResult('   Using external React to avoid conflicts');
              if (result.metadata) {
                addTestResult(`   Load time: ${result.metadata.loadTime?.toFixed(2) || 0}ms`);
              }
            }}
            onError={(error) => {
              addTestResult(`❌ Lucide icons error: ${error.message}`);
            }}
          />
        )}

        {currentTest === '/components/react-feather-demo.js' && (
          <AsyncComponentLoader
            moduleUrl="/components/react-feather-demo.js"
            debug={true}
            cache={true}
            onLoad={(result) => {
              addTestResult('✅ React Feather icons loaded successfully!');
              addTestResult('   Popular NPM package (287+ icons)');
              addTestResult('   Loaded from esm.sh with external React');
              if (result.metadata) {
                addTestResult(`   Load time: ${result.metadata.loadTime?.toFixed(2) || 0}ms`);
              }
            }}
            onError={(error) => {
              addTestResult(`❌ React Feather error: ${error.message}`);
            }}
          />
        )}

        {currentTest === '/components/lucide-icons-production.js' && (
          <AsyncComponentLoader
            moduleUrl="/components/lucide-icons-production.js"
            debug={true}
            cache={true}
            onLoad={(result) => {
              addTestResult('✅ Production-style component loaded!');
              addTestResult('   Top-level import - no useEffect');
              addTestResult('   Icons immediately available');
              addTestResult(`   This is how you'd use it in production`);
              if (result.metadata) {
                addTestResult(
                  `   Module parse time: ${result.metadata.loadTime?.toFixed(2) || 0}ms`,
                );
              }
            }}
            onError={(error) => {
              addTestResult(`❌ Production style error: ${error.message}`);
            }}
          />
        )}

        {currentTest === '/components/confetti-button.js' && (
          <AsyncComponentLoader
            moduleUrl="/components/confetti-button.js"
            debug={true}
            cache={true}
            onLoad={(result) => {
              addTestResult('✅ Confetti Button component loaded successfully!');
              addTestResult('   canvas-confetti library loaded from jsdelivr CDN');
              addTestResult('   Click the button to trigger confetti animation!');
              if (result.metadata) {
                addTestResult(`   Load time: ${result.metadata.loadTime?.toFixed(2) || 0}ms`);
              }
            }}
            onError={(error) => {
              addTestResult(`❌ Confetti button error: ${error.message}`);
            }}
          />
        )}

        {!currentTest && (
          <p style={{ color: '#999', textAlign: 'center' }}>
            Click a test button to load a component
          </p>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
        }}
      >
        <h3>Testing Instructions</h3>
        <h4>🔗 Direct CDN URL Testing (NEW!)</h4>
        <ol>
          <li>
            <strong>Custom URL Input:</strong> Enter any CDN URL to test direct ES module imports
          </li>
          <li>
            <strong>Preset Components:</strong> Quick test buttons for popular React components
          </li>
          <li>
            <strong>Direct Import Method:</strong> Uses native browser import() - no blob URLs!
          </li>
          <li>
            <strong>Import Maps Support:</strong> React resolution works normally (no shims needed)
          </li>
          <li>
            <strong>Performance:</strong> Faster loading, better compatibility, cleaner execution
          </li>
        </ol>
        <h4>⚛️ React Component Libraries from NPM (via CDN)</h4>
        <ol>
          <li>
            <strong>React Icons:</strong> Dynamically loads multiple icon packs from react-icons NPM
            package
          </li>
          <li>
            <strong>Lucide Icons:</strong> Popular icon library (1000+ icons) loaded from NPM via
            esm.sh
          </li>
          <li>
            <strong>React Feather:</strong> Lightweight icon library (287 icons) with external React
            flag
          </li>
          <li>
            <strong>Lucide Production:</strong> Top-level import demonstration for production usage
          </li>
          <li>
            <strong>Confetti Button:</strong> Loads canvas-confetti NPM package for celebration
            effects
          </li>
        </ol>
        <h4>🗺️ Import Map Tests</h4>
        <ol>
          <li>
            <strong>Check Support:</strong> Verify browser support for import maps and React
            availability
          </li>
          <li>
            <strong>Test Shim Module:</strong> Load a component that uses standard imports
          </li>
          <li>
            <strong>Standard ESM:</strong> Execute code with standard React imports
          </li>
        </ol>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Open the browser console to see detailed debug output
        </p>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
};
