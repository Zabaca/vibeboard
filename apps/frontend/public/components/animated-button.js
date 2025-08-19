/**
 * Animated Button Component
 * 
 * A button with hover animations and click effects.
 * - Hover: Slightly scales up with color change
 * - Click: Temporarily scales down with feedback text
 * - Uses React hooks for state management
 * 
 * @category UI
 * @tags button, animation, interactive, click-effects
 * @author Stiqr
 * @version 1.0.0
 */

const { useState } = window.React;

export default function AnimatedButton() {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 600);
  };
  
  return window.React.createElement('div', {
    style: { 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      backgroundColor: '#f3f4f6'
    }
  }, 
    window.React.createElement('button', {
      onClick: handleClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      style: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
        color: 'white',
        backgroundColor: hovered ? '#4f46e5' : '#6366f1',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transform: clicked ? 'scale(0.95)' : hovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s ease',
        boxShadow: hovered 
          ? '0 10px 25px rgba(99, 102, 241, 0.3)' 
          : '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    }, clicked ? '✨ Clicked!' : 'Click Me')
  );
}