// AI-generated color picker with hex transparency issues
const ColorPicker = () => {
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [opacity, setOpacity] = useState(80);

  const colors = [
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#64748b',
  ];

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: `0 10px 25px ${selectedColor}40`,
      }}
    >
      <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Color Picker</h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {colors.map((color) => (
          <button
            type="button"
            key={color}
            onClick={() => setSelectedColor(color)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: color,
              border: selectedColor === color ? '2px solid #1f2937' : 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: `0 2px 4px ${color}30`,
            }}
          />
        ))}
      </div>

      <div
        style={{
          padding: '12px',
          backgroundColor: `${selectedColor}${opacity.toString(16).padStart(2, '0')}`,
          borderRadius: '6px',
          marginBottom: '16px',
        }}
      >
        <div style={{ color: '#ffffff', textAlign: 'center' }}>Preview</div>
      </div>

      <div>
        <label htmlFor="opacity-slider" style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Opacity: `${opacity}%`
        </label>
        <input
          id="opacity-slider"
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        {selectedColor}
        {opacity.toString(16).padStart(2, '0')}
      </div>
    </div>
  );
};

const _Component = ColorPicker;
