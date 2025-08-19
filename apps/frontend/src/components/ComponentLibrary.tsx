import React, { useMemo, useState } from 'react';
import { type ComponentManifestEntry, componentManifest } from '../data/componentManifest.ts';

interface ComponentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (component: ComponentManifestEntry) => void;
}

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  isOpen,
  onClose,
  onSelectComponent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(componentManifest.map((c) => c.category))];
    return cats;
  }, []);

  const filteredComponents = useMemo(() => {
    let filtered = componentManifest;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.tags.some((tag) => tag.toLowerCase().includes(term)),
      );
    }

    return filtered;
  }, [selectedCategory, searchTerm]);

  if (!isOpen) {
    return null;
  }

  const categoryIcons: Record<string, string> = {
    UI: '🎨',
    Data: '📊',
    Forms: '📝',
    Charts: '📈',
    Layout: '🏗️',
    Utility: '🔧',
  };

  const handleSelectComponent = (component: ComponentManifestEntry) => {
    onSelectComponent(component);
    onClose();
  };

  return (
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
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '900px',
          height: '80%',
          maxHeight: '700px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '28px' }}>📚</span>
                Component Library
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                }}
              >
                Choose from pre-built components to add instantly
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Categories */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedCategory === cat ? '#6366f1' : 'white',
                color: selectedCategory === cat ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              {cat !== 'all' && categoryIcons[cat]}
              {cat === 'all' ? 'All' : cat}
              <span
                style={{
                  marginLeft: '4px',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  backgroundColor:
                    selectedCategory === cat
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(99, 102, 241, 0.1)',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {cat === 'all'
                  ? componentManifest.length
                  : componentManifest.filter((c) => c.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Components Grid */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
          }}
        >
          {filteredComponents.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
              }}
            >
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</span>
              <p style={{ fontSize: '16px' }}>No components found</p>
              <p style={{ fontSize: '14px' }}>Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  style={{
                    backgroundColor: hoveredComponent === component.id ? '#f9fafb' : 'white',
                    border: '2px solid',
                    borderColor: hoveredComponent === component.id ? '#6366f1' : '#e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: hoveredComponent === component.id ? 'translateY(-2px)' : 'none',
                    boxShadow:
                      hoveredComponent === component.id
                        ? '0 10px 25px rgba(99, 102, 241, 0.15)'
                        : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={() => setHoveredComponent(component.id)}
                  onMouseLeave={() => setHoveredComponent(null)}
                  onClick={() => handleSelectComponent(component)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                      }}
                    >
                      {component.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '20px',
                      }}
                    >
                      {categoryIcons[component.category]}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0 0 12px',
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.4',
                    }}
                  >
                    {component.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {component.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#6b7280',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {hoveredComponent === component.id && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: '#6366f1',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      <span>+</span>
                      Add to Canvas
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#6b7280',
            }}
          >
            {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''}{' '}
            available
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#9ca3af',
            }}
          >
            💡 Click any component to add it to your canvas
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentLibrary;
