/**
 * Simple Counter Component
 * 
 * A counter with increment, decrement, and reset buttons.
 * - Large display of current count value
 * - Red decrement button (-)
 * - Green increment button (+)
 * - Gray reset button
 * - Uses React hooks for state management
 * 
 * @category Utility
 * @tags counter, increment, decrement, state, buttons
 * @author Stiqr
 * @version 1.0.0
 */

const { useState } = window.React;

export default function SimpleCounter() {
  const [count, setCount] = useState(0);
  
  return window.React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, sans-serif'
    }
  }, [
    window.React.createElement('h2', {
      key: 'counter-display',
      style: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#1f2937',
        margin: '0 0 24px 0'
      }
    }, count),
    
    window.React.createElement('div', {
      key: 'button-group',
      style: {
        display: 'flex',
        gap: '12px'
      }
    }, [
      window.React.createElement('button', {
        key: 'decrement',
        onClick: () => setCount(count - 1),
        onMouseDown: (e) => e.currentTarget.style.transform = 'scale(0.95)',
        onMouseUp: (e) => e.currentTarget.style.transform = 'scale(1)',
        onMouseLeave: (e) => e.currentTarget.style.transform = 'scale(1)',
        style: {
          padding: '10px 20px',
          fontSize: '18px',
          fontWeight: '600',
          color: 'white',
          backgroundColor: '#ef4444',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.1s',
        }
      }, '-'),
      
      window.React.createElement('button', {
        key: 'increment',
        onClick: () => setCount(count + 1),
        onMouseDown: (e) => e.currentTarget.style.transform = 'scale(0.95)',
        onMouseUp: (e) => e.currentTarget.style.transform = 'scale(1)',
        onMouseLeave: (e) => e.currentTarget.style.transform = 'scale(1)',
        style: {
          padding: '10px 20px',
          fontSize: '18px',
          fontWeight: '600',
          color: 'white',
          backgroundColor: '#10b981',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.1s',
        }
      }, '+')
    ]),
    
    window.React.createElement('button', {
      key: 'reset',
      onClick: () => setCount(0),
      style: {
        marginTop: '16px',
        padding: '8px 16px',
        fontSize: '14px',
        color: '#6b7280',
        backgroundColor: '#e5e7eb',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
      }
    }, 'Reset')
  ]);
}