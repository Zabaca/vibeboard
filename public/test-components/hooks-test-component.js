// Hooks Test Component
// Tests various React hooks with standard ESM imports

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useCallback,
  useReducer,
  useContext,
  createContext
} from 'react';

// Create a context for testing
const TestContext = createContext({ theme: 'light' });

// Reducer for testing useReducer
const counterReducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
};

const HooksTestComponent = () => {
  // useState
  const [stateValue, setStateValue] = useState('Initial State');
  
  // useReducer
  const [reducerState, dispatch] = useReducer(counterReducer, { count: 0 });
  
  // useRef
  const renderCount = useRef(0);
  const inputRef = useRef(null);
  
  // useContext
  const contextValue = useContext(TestContext);
  
  // State for hook test results
  const [hookTests, setHookTests] = useState({});
  
  // useMemo - expensive calculation
  const expensiveValue = useMemo(() => {
    console.log('Computing expensive value...');
    return reducerState.count * 100;
  }, [reducerState.count]);
  
  // useCallback - memoized function
  const memoizedCallback = useCallback(() => {
    console.log('Memoized callback called with count:', reducerState.count);
    return reducerState.count;
  }, [reducerState.count]);
  
  // useEffect - side effects
  useEffect(() => {
    renderCount.current += 1;
    
    // Test all hooks
    const tests = {
      useState: typeof useState === 'function',
      useEffect: typeof useEffect === 'function',
      useRef: typeof useRef === 'function',
      useMemo: typeof useMemo === 'function',
      useCallback: typeof useCallback === 'function',
      useReducer: typeof useReducer === 'function',
      useContext: typeof useContext === 'function',
      createContext: typeof createContext === 'function',
      reactVersion: React.version,
      isSingleton: React === window.React
    };
    
    setHookTests(tests);
    
    // Cleanup function
    return () => {
      console.log('Component cleanup');
    };
  }, []);
  
  const handleInputFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.style.backgroundColor = '#fffbf0';
    }
  };
  
  const handleStateChange = (e) => {
    setStateValue(e.target.value);
  };

  return React.createElement('div', {
    style: {
      padding: '20px',
      border: '2px solid #2196F3',
      borderRadius: '8px',
      backgroundColor: '#f0f7ff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    React.createElement('h2', {
      key: 'title',
      style: { color: '#1565C0', marginTop: 0 }
    }, '🪝 React Hooks Test Component'),
    
    // Hook availability status
    React.createElement('div', {
      key: 'status',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '5px',
        fontSize: '13px'
      }
    }, Object.entries(hookTests).map(([key, value]) => 
      React.createElement('div', {
        key,
        style: { padding: '3px' }
      }, `${key}: ${value === true ? '✅' : value === false ? '❌' : value}`)
    )),
    
    // useState test
    React.createElement('div', {
      key: 'usestate',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '10px'
      }
    }, [
      React.createElement('h4', { key: 'h4', style: { margin: '0 0 10px 0' } }, 
        'useState Test'),
      React.createElement('input', {
        key: 'input',
        type: 'text',
        value: stateValue,
        onChange: handleStateChange,
        style: {
          width: '100%',
          padding: '5px',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }
      }),
      React.createElement('p', { key: 'p', style: { margin: '5px 0', fontSize: '14px' } }, 
        `Current value: "${stateValue}"`)
    ]),
    
    // useReducer test
    React.createElement('div', {
      key: 'usereducer',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '10px'
      }
    }, [
      React.createElement('h4', { key: 'h4', style: { margin: '0 0 10px 0' } }, 
        'useReducer Test'),
      React.createElement('div', {
        key: 'count',
        style: { fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' }
      }, reducerState.count),
      React.createElement('div', {
        key: 'buttons',
        style: { display: 'flex', gap: '5px', justifyContent: 'center' }
      }, [
        React.createElement('button', {
          key: 'dec',
          onClick: () => dispatch({ type: 'DECREMENT' }),
          style: {
            padding: '5px 10px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, '−'),
        React.createElement('button', {
          key: 'reset',
          onClick: () => dispatch({ type: 'RESET' }),
          style: {
            padding: '5px 10px',
            backgroundColor: '#9E9E9E',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Reset'),
        React.createElement('button', {
          key: 'inc',
          onClick: () => dispatch({ type: 'INCREMENT' }),
          style: {
            padding: '5px 10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, '+')
      ])
    ]),
    
    // useRef test
    React.createElement('div', {
      key: 'useref',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '10px'
      }
    }, [
      React.createElement('h4', { key: 'h4', style: { margin: '0 0 10px 0' } }, 
        'useRef Test'),
      React.createElement('input', {
        key: 'input',
        ref: inputRef,
        type: 'text',
        placeholder: 'Click button to focus me',
        style: {
          width: '100%',
          padding: '5px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          marginBottom: '5px'
        }
      }),
      React.createElement('button', {
        key: 'button',
        onClick: handleInputFocus,
        style: {
          padding: '5px 10px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Focus Input'),
      React.createElement('p', { key: 'p', style: { margin: '5px 0', fontSize: '14px' } }, 
        `Render count: ${renderCount.current}`)
    ]),
    
    // useMemo & useCallback test
    React.createElement('div', {
      key: 'usememo',
      style: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px'
      }
    }, [
      React.createElement('h4', { key: 'h4', style: { margin: '0 0 10px 0' } }, 
        'useMemo & useCallback Test'),
      React.createElement('p', { key: 'p1', style: { margin: '5px 0', fontSize: '14px' } }, 
        `Memoized value (count × 100): ${expensiveValue}`),
      React.createElement('button', {
        key: 'button',
        onClick: () => console.log('Callback result:', memoizedCallback()),
        style: {
          padding: '5px 10px',
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Call Memoized Function (check console)'),
      React.createElement('p', { key: 'p2', style: { margin: '5px 0', fontSize: '14px' } }, 
        `Context value: ${contextValue.theme}`)
    ])
  ]);
};

export default HooksTestComponent;