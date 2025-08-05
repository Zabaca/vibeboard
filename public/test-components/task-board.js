// Task Board Component for URL import testing
import React, { useState } from 'react';

export default function TaskBoard() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Test import maps', status: 'done' },
    { id: 2, text: 'Load external components', status: 'in-progress' },
    { id: 3, text: 'Build awesome features', status: 'todo' }
  ]);
  const [newTask, setNewTask] = useState('');
  
  const statusConfig = {
    'todo': { color: '#94a3b8', emoji: '📋', label: 'To Do' },
    'in-progress': { color: '#60a5fa', emoji: '⚡', label: 'In Progress' },
    'done': { color: '#34d399', emoji: '✅', label: 'Done' }
  };
  
  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTask,
        status: 'todo'
      }]);
      setNewTask('');
    }
  };
  
  const cycleStatus = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const statuses = ['todo', 'in-progress', 'done'];
        const currentIndex = statuses.indexOf(task.status);
        const nextStatus = statuses[(currentIndex + 1) % 3];
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };
  
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  return React.createElement('div', {
    style: {
      padding: '25px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: '15px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minWidth: '400px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }
  },
    React.createElement('h2', {
      style: { 
        margin: '0 0 20px 0',
        fontSize: '24px',
        color: '#1e293b',
        fontWeight: '600'
      }
    }, '📌 Task Board'),
    
    // Input section
    React.createElement('div', {
      style: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }
    },
      React.createElement('input', {
        type: 'text',
        value: newTask,
        onChange: (e) => setNewTask(e.target.value),
        onKeyPress: (e) => e.key === 'Enter' && addTask(),
        placeholder: 'Add a new task...',
        style: {
          flex: 1,
          padding: '10px',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none'
        }
      }),
      React.createElement('button', {
        onClick: addTask,
        style: {
          padding: '10px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      }, '+')
    ),
    
    // Tasks list
    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }
    },
      ...tasks.map(task => {
        const config = statusConfig[task.status];
        return React.createElement('div', {
          key: task.id,
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            background: 'white',
            borderRadius: '8px',
            borderLeft: `4px solid ${config.color}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }
        },
          React.createElement('button', {
            onClick: () => cycleStatus(task.id),
            style: {
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0'
            }
          }, config.emoji),
          
          React.createElement('span', {
            style: {
              flex: 1,
              fontSize: '14px',
              color: '#475569',
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              opacity: task.status === 'done' ? 0.6 : 1
            }
          }, task.text),
          
          React.createElement('span', {
            style: {
              fontSize: '12px',
              color: config.color,
              fontWeight: '600',
              padding: '2px 8px',
              background: `${config.color}20`,
              borderRadius: '4px'
            }
          }, config.label),
          
          React.createElement('button', {
            onClick: () => deleteTask(task.id),
            style: {
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0'
            }
          }, '×')
        );
      })
    ),
    
    tasks.length === 0 && React.createElement('div', {
      style: {
        textAlign: 'center',
        padding: '20px',
        color: '#94a3b8',
        fontSize: '14px'
      }
    }, 'No tasks yet. Add one above! 🎯')
  );
}