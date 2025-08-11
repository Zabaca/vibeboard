/**
 * Test artifacts - AI-generated component code for testing
 * These are real AI responses that can be used for testing without hitting the API
 */

export const noteTakingAppESM = `import React, { useState, useEffect, useRef } from 'react';

const NoteTakingApp = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState(['Personal', 'Work', 'Ideas']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'Personal' });
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    const savedCategories = localStorage.getItem('categories');
    
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const handleAddNote = () => {
    if (newNote.title.trim() === '' || newNote.content.trim() === '') return;
    
    if (editingNoteId !== null) {
      setNotes(notes.map(note => 
        note.id === editingNoteId 
          ? { ...note, ...newNote }
          : note
      ));
      setEditingNoteId(null);
    } else {
      const note = {
        id: Date.now(),
        ...newNote,
        createdAt: new Date().toLocaleDateString()
      };
      setNotes([note, ...notes]);
    }
    
    setNewNote({ title: '', content: '', category: 'Personal' });
  };

  const handleEditNote = (note) => {
    setNewNote({
      title: note.title,
      content: note.content,
      category: note.category
    });
    setEditingNoteId(note.id);
    titleRef.current?.focus();
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setNewNote({ title: '', content: '', category: 'Personal' });
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() !== '' && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
      setIsAddingCategory(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden'
  };

  const headerStyle = {
    padding: '20px',
    backgroundColor: '#4361ee',
    color: 'white',
    textAlign: 'center'
  };

  const titleStyle = {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  };

  const searchBarStyle = {
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e9ecef'
  };

  const searchInputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ced4da',
    fontSize: '16px',
    boxSizing: 'border-box'
  };

  const mainContentStyle = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  };

  const sidebarStyle = {
    width: '200px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e9ecef',
    display: 'flex',
    flexDirection: 'column'
  };

  const categoryListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    flex: 1
  };

  const categoryItemStyle = {
    padding: '12px 16px',
    margin: '8px 0',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: selectedCategory === 'All' ? '#4361ee' : 'transparent',
    color: selectedCategory === 'All' ? 'white' : '#495057'
  };

  const categoryButtonStyle = {
    padding: '12px 16px',
    margin: '8px 0',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: selectedCategory === category ? '#4361ee' : '#f8f9fa',
    color: selectedCategory === category ? 'white' : '#495057',
    border: 'none',
    fontSize: '14px',
    fontWeight: selectedCategory === category ? '600' : '400'
  };

  const addCategoryButtonStyle = {
    marginTop: '16px',
    padding: '10px 16px',
    backgroundColor: '#3a0ca3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  };

  const addCategoryInputStyle = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    fontSize: '14px',
    margin: '8px 0'
  };

  const noteFormStyle = {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e9ecef'
  };

  const formInputStyle = {
    width: '100%',
    padding: '12px 16px',
    margin: '8px 0',
    borderRadius: '8px',
    border: '1px solid #ced4da',
    fontSize: '16px',
    boxSizing: 'border-box'
  };

  const formSelectStyle = {
    width: '100%',
    padding: '12px 16px',
    margin: '8px 0',
    borderRadius: '8px',
    border: '1px solid #ced4da',
    fontSize: '16px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box'
  };

  const formTextareaStyle = {
    width: '100%',
    padding: '12px 16px',
    margin: '8px 0',
    borderRadius: '8px',
    border: '1px solid #ced4da',
    fontSize: '16px',
    minHeight: '100px',
    resize: 'vertical',
    boxSizing: 'border-box'
  };

  const addButtonStyle = {
    padding: '12px 20px',
    backgroundColor: '#4cc9f0',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px'
  };

  const notesContainerStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8f9fa'
  };

  const noteCardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e9ecef',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  const noteTitleStyle = {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#212529'
  };

  const noteCategoryStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#4361ee',
    color: 'white',
    marginBottom: '12px'
  };

  const noteContentStyle = {
    margin: '0 0 16px 0',
    color: '#495057',
    lineHeight: '1.5'
  };

  const noteDateStyle = {
    fontSize: '12px',
    color: '#868e96',
    marginBottom: '16px'
  };

  const noteActionsStyle = {
    display: 'flex',
    gap: '10px'
  };

  const editButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    color: '#4361ee',
    border: '1px solid #4361ee',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  };

  const deleteButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    color: '#e63946',
    border: '1px solid #e63946',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Note Taking App</h1>
      </div>
      
      <div style={searchBarStyle}>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
        />
      </div>
      
      <div style={mainContentStyle}>
        <div style={sidebarStyle}>
          <ul style={categoryListStyle}>
            <li 
              style={categoryItemStyle}
              onClick={() => setSelectedCategory('All')}
            >
              All Notes
            </li>
            {categories.map((category, index) => (
              <li 
                key={index}
                style={{
                  ...categoryButtonStyle,
                  backgroundColor: selectedCategory === category ? '#4361ee' : '#f8f9fa',
                  color: selectedCategory === category ? 'white' : '#495057'
                }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </li>
            ))}
          </ul>
          
          {isAddingCategory ? (
            <div>
              <input
                type="text"
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={addCategoryInputStyle}
              />
              <button 
                onClick={handleAddCategory}
                style={addButtonStyle}
              >
                Add
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingCategory(true)}
              style={addCategoryButtonStyle}
            >
              + Add Category
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={noteFormStyle}>
            <input
              ref={titleRef}
              type="text"
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) => setNewNote({...newNote, title: e.target.value})}
              style={formInputStyle}
            />
            <select
              value={newNote.category}
              onChange={(e) => setNewNote({...newNote, category: e.target.value})}
              style={formSelectStyle}
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
            <textarea
              placeholder="Note content"
              value={newNote.content}
              onChange={(e) => setNewNote({...newNote, content: e.target.value})}
              style={formTextareaStyle}
            />
            <button 
              onClick={handleAddNote}
              style={addButtonStyle}
            >
              {editingNoteId !== null ? 'Update Note' : 'Add Note'}
            </button>
          </div>
          
          <div style={notesContainerStyle}>
            {filteredNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#868e96' }}>
                <p>No notes found</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div key={note.id} style={noteCardStyle}>
                  <h3 style={noteTitleStyle}>{note.title}</h3>
                  <span style={noteCategoryStyle}>{note.category}</span>
                  <p style={noteContentStyle}>{note.content}</p>
                  <div style={noteDateStyle}>{note.createdAt}</div>
                  <div style={noteActionsStyle}>
                    <button 
                      onClick={() => handleEditNote(note)}
                      style={editButtonStyle}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      style={deleteButtonStyle}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteTakingApp;`;

export const simpleCounterESM = `import React, { useState } from 'react';

const SimpleCounter = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Simple Counter</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default SimpleCounter;`;

export const noJSXESM = `import React, { useState } from 'react';

const NoJSXComponent = () => {
  const [count, setCount] = useState(0);
  
  return React.createElement('div', 
    { style: { padding: '20px', textAlign: 'center' } },
    React.createElement('h2', null, 'No JSX Component'),
    React.createElement('p', null, 'Count: ' + count),
    React.createElement('button', 
      { onClick: () => setCount(count + 1) },
      'Increment'
    )
  );
};

export default NoJSXComponent;`;

export const legacyFormat = `const LegacyComponent = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Legacy Component</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

const Component = LegacyComponent;`;

export const malformedESM = `import React from 'react';

// Missing export default
const BadComponent = () => {
  return <div>This component has no export</div>;
};`;

export const timerWithMissingImports = `import React, { useState, useEffect, useRef } from 'react';

const Timer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setTime(0);
    setIsRunning(false);
  }, []);

  const formatTime = useMemo(() => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    
    return \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}:\${milliseconds.toString().padStart(2, '0')}\`;
  }, [time]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '300px',
    margin: '0 auto'
  };

  const timeStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '20px 0',
    fontFamily: 'monospace'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '15px',
    marginTop: '20px'
  };

  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
  };

  const startButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#27ae60',
    color: 'white'
  };

  const pauseButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f39c12',
    color: 'white'
  };

  const resetButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e74c3c',
    color: 'white'
  };

  const buttonHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ 
        color: '#34495e', 
        marginBottom: '10px',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        Timer
      </h1>
      <div style={timeStyle}>
        {formatTime}
      </div>
      <div style={buttonContainerStyle}>
        <button 
          style={isRunning ? { ...startButtonStyle, opacity: 0.7, cursor: 'not-allowed' } : startButtonStyle}
          onClick={handleStart}
          disabled={isRunning}
        >
          Start
        </button>
        <button 
          style={!isRunning ? { ...pauseButtonStyle, opacity: 0.7, cursor: 'not-allowed' } : pauseButtonStyle}
          onClick={handlePause}
          disabled={!isRunning}
        >
          Pause
        </button>
        <button 
          style={resetButtonStyle}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;`;

// Metadata about AI generation for testing
export const aiGenerationMetadata = {
  noteTakingApp: {
    prompt: 'Create a note taking app with categories',
    generationTime: 1515.18,
    tokens: {
      prompt: 279,
      completion: 3157,
      total: 3436,
    },
    model: 'qwen-3-coder-480b',
  },
};
