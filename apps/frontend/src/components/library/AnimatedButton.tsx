import { useState } from 'react';

export default function AnimatedButton() {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 600);
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      backgroundColor: '#f3f4f6'
    }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
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
        }}
      >
        {clicked ? '✨ Clicked!' : 'Click Me'}
      </button>
    </div>
  );
}