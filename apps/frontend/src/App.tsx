import { useState } from 'react';
import ReactFlowCanvas from './components/ReactFlowCanvas';
import { ESMTestComponent } from './components/ESMTestComponent';
import './App.css';

function App() {
  const [testMode, setTestMode] = useState(false);
  const isDevelopment = import.meta.env.DEV;
  
  return (
    <div className="app" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      {/* Toggle button - only show in development */}
      {isDevelopment && (
        <button
          onClick={() => setTestMode(!testMode)}
          style={{
            position: 'fixed',
            top: '10px',
            right: '150px',
            zIndex: 1000,
            padding: '8px 16px',
            backgroundColor: testMode ? '#ff5722' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {testMode ? '🎨 Canvas Mode' : '🧪 Test ESM'}
        </button>
      )}
      
      {/* Content - in production, always show ReactFlowCanvas */}
      {isDevelopment && testMode ? <ESMTestComponent /> : <ReactFlowCanvas />}
    </div>
  );
}

export default App;
