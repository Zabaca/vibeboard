import type { UnifiedComponentNode } from '../types/component.types.ts';

export interface PrebuiltComponent extends Partial<UnifiedComponentNode> {
  id: string;
  name: string;
  description: string;
  category: 'UI' | 'Data' | 'Forms' | 'Charts' | 'Layout' | 'Utility';
  tags: string[];
  code: string; // Legacy field, will be mapped to originalCode
  thumbnail?: string;
  author?: string;
  version?: string;
}

export const prebuiltComponents: PrebuiltComponent[] = [
  // UI Components
  {
    id: 'button-animated',
    name: 'Animated Button',
    description: 'A button with hover animations and click effects',
    category: 'UI',
    tags: ['button', 'animation', 'interactive'],
    code: `import React, { useState } from 'react';

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
}`,
  },
  {
    id: 'card-profile',
    name: 'Profile Card',
    description: 'A user profile card with avatar and stats',
    category: 'UI',
    tags: ['card', 'profile', 'user'],
    code: `import React, { useState } from 'react';

export default function ProfileCard() {
  const [following, setFollowing] = useState(false);
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
        width: '280px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          color: 'white'
        }}>
          👤
        </div>
        <h3 style={{ margin: '0 0 4px', color: '#111827' }}>Sarah Johnson</h3>
        <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px' }}>
          @sarahj • Product Designer
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>152</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Posts</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>2.1k</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Followers</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>428</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Following</div>
          </div>
        </div>
        <button
          onClick={() => setFollowing(!following)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: following ? 'white' : '#6366f1',
            color: following ? '#6366f1' : 'white',
            border: following ? '2px solid #6366f1' : 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  );
}`,
  },

  // Data Components
  {
    id: 'counter-simple',
    name: 'Simple Counter',
    description: 'A counter with increment and decrement buttons',
    category: 'Data',
    tags: ['counter', 'state', 'interactive'],
    code: `import React, { useState } from 'react';

export default function SimpleCounter() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>Counter</h2>
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#3b82f6',
        margin: '20px 0',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        minWidth: '120px',
        textAlign: 'center'
      }}>
        {count}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setCount(count - 1)}
          style={{
            padding: '12px 20px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          -
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            padding: '12px 20px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'timer-countdown',
    name: 'Countdown Timer',
    description: 'A countdown timer with start, pause, and reset functionality',
    category: 'Data',
    tags: ['timer', 'countdown', 'time'],
    code: `import React, { useState, useEffect } from 'react';

export default function CountdownTimer() {
  const [seconds, setSeconds] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(60);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(initialTime);
    setIsActive(false);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const secs = time % 60;
    return \`\${minutes.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#1f2937',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#f3f4f6', marginBottom: '20px' }}>Countdown Timer</h2>
      <div style={{
        fontSize: '64px',
        fontWeight: 'bold',
        color: seconds <= 10 ? '#ef4444' : '#10b981',
        margin: '20px 0',
        padding: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        minWidth: '200px',
        textAlign: 'center'
      }}>
        {formatTime(seconds)}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={toggle}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: isActive ? '#f59e0b' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Reset
        </button>
      </div>
      <input
        type="range"
        min="10"
        max="300"
        value={initialTime}
        onChange={(e) => {
          const newTime = parseInt(e.target.value);
          setInitialTime(newTime);
          if (!isActive) setSeconds(newTime);
        }}
        style={{
          width: '200px',
          accentColor: '#10b981'
        }}
      />
      <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.7 }}>
        Set timer: {formatTime(initialTime)}
      </p>
    </div>
  );
}`,
  },

  // Forms Components
  {
    id: 'form-contact',
    name: 'Contact Form',
    description: 'A contact form with validation and submission feedback',
    category: 'Forms',
    tags: ['form', 'contact', 'validation'],
    code: `import React, { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        backgroundColor: '#f0fdf4'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ color: '#16a34a', marginBottom: '8px' }}>Message Sent!</h3>
          <p style={{ color: '#6b7280' }}>Thank you for contacting us.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ marginBottom: '24px', color: '#1e293b', textAlign: 'center' }}>
          Contact Us
        </h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
            Message
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              resize: 'vertical',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          Send Message
        </button>
      </form>
    </div>
  );
}`,
  },

  // Charts Components
  {
    id: 'chart-bar',
    name: 'Bar Chart',
    description: 'An animated bar chart with sample data',
    category: 'Charts',
    tags: ['chart', 'bar', 'data', 'visualization'],
    code: `import React, { useState, useEffect } from 'react';

export default function BarChart() {
  const [animated, setAnimated] = useState(false);
  
  const data = [
    { label: 'Jan', value: 65, color: '#3b82f6' },
    { label: 'Feb', value: 45, color: '#10b981' },
    { label: 'Mar', value: 85, color: '#f59e0b' },
    { label: 'Apr', value: 75, color: '#ef4444' },
    { label: 'May', value: 95, color: '#8b5cf6' },
    { label: 'Jun', value: 55, color: '#06b6d4' }
  ];

  useEffect(() => {
    setTimeout(() => setAnimated(true), 300);
  }, []);

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>Monthly Sales</h2>
      
      <div style={{
        display: 'flex',
        alignItems: 'end',
        gap: '12px',
        height: '200px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {data.map((item, index) => (
          <div key={item.label} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151'
            }}>
              {item.value}%
            </div>
            <div
              style={{
                width: '40px',
                height: animated ? \`\${(item.value / maxValue) * 150}px\` : '0px',
                backgroundColor: item.color,
                borderRadius: '4px 4px 0 0',
                transition: \`height 0.8s ease \${index * 0.1}s\`,
                display: 'flex',
                alignItems: 'end',
                justifyContent: 'center'
              }}
            />
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280'
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={() => {
          setAnimated(false);
          setTimeout(() => setAnimated(true), 100);
        }}
        style={{
          marginTop: '20px',
          padding: '8px 16px',
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        Animate Again
      </button>
    </div>
  );
}`,
  },

  // Layout Components
  {
    id: 'tabs-simple',
    name: 'Simple Tabs',
    description: 'A tabbed interface with multiple content panels',
    category: 'Layout',
    tags: ['tabs', 'navigation', 'layout'],
    code: `import React, { useState } from 'react';

export default function SimpleTabs() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    {
      id: 'home',
      label: '🏠 Home',
      content: 'Welcome to the home page! This is where you\\'ll find the latest updates and news.'
    },
    {
      id: 'about',
      label: '👥 About',
      content: 'Learn more about our company, mission, and the team behind our products.'
    },
    {
      id: 'services',
      label: '⚙️ Services',
      content: 'Explore our range of services including web development, design, and consulting.'
    },
    {
      id: 'contact',
      label: '📞 Contact',
      content: 'Get in touch with us through email, phone, or visit our office location.'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: 'white'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#6366f1' : '#6b7280',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '3px solid #6366f1' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        padding: '32px',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <h2 style={{
            color: '#1e293b',
            marginBottom: '16px',
            fontSize: '24px'
          }}>
            {tabs.find(tab => tab.id === activeTab)?.label}
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            {tabs.find(tab => tab.id === activeTab)?.content}
          </p>
        </div>
      </div>
    </div>
  );
}`,
  },

  // Utility Components
  {
    id: 'clock-digital',
    name: 'Digital Clock',
    description: 'A real-time digital clock with date display',
    category: 'Utility',
    tags: ['clock', 'time', 'date', 'realtime'],
    code: `import React, { useState, useEffect } from 'react';

export default function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#00ff88',
          marginBottom: '16px',
          textShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
          letterSpacing: '2px'
        }}>
          {formatTime(time)}
        </div>
        
        <div style={{
          fontSize: '18px',
          color: '#94a3b8',
          marginBottom: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          {formatDate(time)}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '20px',
          marginTop: '20px',
          fontSize: '14px',
          color: '#64748b'
        }}>
          <div>
            <div style={{ color: '#00ff88' }}>UTC</div>
            <div>{time.toUTCString().slice(-12, -4)}</div>
          </div>
          <div>
            <div style={{ color: '#00ff88' }}>UNIX</div>
            <div>{Math.floor(time.getTime() / 1000)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'todo-list',
    name: 'Todo List',
    description: 'A simple todo list with add, toggle, and delete functionality',
    category: 'Utility',
    tags: ['todo', 'list', 'tasks', 'productivity'],
    code: `import React, { useState } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Build amazing UI', done: false },
    { id: 2, text: 'Learn React hooks', done: true },
    { id: 3, text: 'Create ESM components', done: false }
  ]);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: newTodo.trim(),
        done: false
      }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const completedCount = todos.filter(todo => todo.done).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f1f5f9',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Todo List</h2>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task..."
            style={{
              flex: 1,
              padding: '12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
          <button
            onClick={addTodo}
            style={{
              padding: '12px 20px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add
          </button>
        </div>
        <p style={{
          margin: '12px 0 0 0',
          fontSize: '14px',
          color: '#64748b'
        }}>
          {completedCount} of {todos.length} tasks completed
        </p>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {todos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#64748b'
          }}>
            No tasks yet. Add one above!
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '8px',
                marginBottom: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                style={{
                  transform: 'scale(1.2)',
                  accentColor: '#6366f1'
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: '16px',
                  color: todo.done ? '#94a3b8' : '#1e293b',
                  textDecoration: todo.done ? 'line-through' : 'none'
                }}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}`,
  },
  {
    id: 'csv-duckdb-notebook',
    name: 'CSV Data Notebook',
    description: 'Interactive SQL notebook for CSV data analysis with DuckDB',
    category: 'Data',
    tags: ['csv', 'data', 'sql', 'notebook', 'analysis', 'duckdb', 'query'],
    code: `import React, { useState, useEffect, useRef, useCallback } from 'react';

const NotebookDataAnalyzer = () => {
  const [db, setDb] = useState(null);
  const [cells, setCells] = useState([{
    id: 1,
    query: 'SELECT * FROM uploaded_data LIMIT 10',
    results: [],
    loading: false,
    error: null,
    executed: false,
    hasChanges: false,
    tableName: null
  }]);
  const [availableTables, setAvailableTables] = useState(['uploaded_data']);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const fileInputRef = useRef(null);
  const [nextCellId, setNextCellId] = useState(2);
  
  useEffect(() => {
    const initDuckDB = async () => {
      try {
        setGlobalLoading(true);
        const duckdb = await import('https://esm.sh/@duckdb/duckdb-wasm');
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        const worker = await duckdb.createWorker(bundle.mainWorker);
        const database = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
        await database.instantiate(bundle.mainModule);
        setDb(database);
        setGlobalError(null);
      } catch (err) {
        setGlobalError('Failed to initialize database: ' + err.message);
        console.error(err);
      } finally {
        setGlobalLoading(false);
      }
    };
    initDuckDB();
    return () => {
      if (db) {
        db.terminate();
      }
    };
  }, []);
  
  const loadCSVData = useCallback(async file => {
    if (!db) return;
    try {
      setGlobalLoading(true);
      setGlobalError(null);
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await db.registerFileBuffer(file.name, uint8Array);
      const conn = await db.connect();
      try {
        await conn.query(\`
          CREATE OR REPLACE TABLE uploaded_data AS 
          SELECT * FROM read_csv_auto('\${file.name}')
        \`);
      } catch (autoError) {
        console.log('read_csv_auto failed, trying read_csv...', autoError.message);
        await conn.query(\`
          CREATE OR REPLACE TABLE uploaded_data AS 
          SELECT * FROM read_csv('\${file.name}', 
            header=true, 
            auto_detect=true,
            ignore_errors=true
          )
        \`);
      }
      await conn.close();
      setDataLoaded(true);
      setAvailableTables(['uploaded_data']);
    } catch (err) {
      setGlobalError('Failed to load CSV data: ' + err.message);
      console.error(err);
    } finally {
      setGlobalLoading(false);
    }
  }, [db]);
  
  const executeCell = useCallback(async cellId => {
    if (!db || !dataLoaded) return;
    const cell = cells.find(c => c.id === cellId);
    if (!cell || !cell.query.trim()) return;
    setCells(prev => prev.map(c => c.id === cellId ? {
      ...c,
      loading: true,
      error: null
    } : c));
    let conn = null;
    try {
      conn = await db.connect();
      const autoTableName = \`cell_\${cellId}_result\`;
      const isManualCreate = cell.query.trim().toLowerCase().match(/^\\s*(create\\s+(table|view))/);
      const queryWithoutComments = cell.query.replace(/--.*$/gm, '').trim().toLowerCase();
      const isSelectQuery = queryWithoutComments.startsWith('select');
      let finalQuery = cell.query;
      let resultTableName = null;
      let previewData = [];
      if (!isManualCreate && isSelectQuery) {
        finalQuery = \`CREATE OR REPLACE TABLE \${autoTableName} AS\\n\${cell.query}\`;
        resultTableName = autoTableName;
        await conn.query(finalQuery);
        const previewResult = await conn.query(\`SELECT * FROM \${autoTableName} LIMIT 100\`);
        previewData = previewResult.toArray().map(row => ({
          ...row
        }));
      } else if (isManualCreate) {
        await conn.query(finalQuery);
        const match = cell.query.match(/create\\s+(?:or\\s+replace\\s+)?(?:table|view)\\s+(\\w+)/i);
        if (match) {
          resultTableName = match[1];
          try {
            const previewResult = await conn.query(\`SELECT * FROM \${resultTableName} LIMIT 100\`);
            previewData = previewResult.toArray().map(row => ({
              ...row
            }));
          } catch (previewError) {
            console.log('Could not preview table:', previewError);
            previewData = [];
          }
        }
      } else {
        const result = await conn.query(finalQuery);
        previewData = result.toArray().map(row => ({
          ...row
        }));
      }
      if (resultTableName && !availableTables.includes(resultTableName)) {
        setAvailableTables(prev => [...prev, resultTableName]);
      }
      setCells(prev => prev.map(c => c.id === cellId ? {
        ...c,
        loading: false,
        results: previewData,
        executed: true,
        error: null,
        hasChanges: false,
        tableName: resultTableName
      } : c));
    } catch (err) {
      console.error('Cell execution error:', err);
      setCells(prev => prev.map(c => c.id === cellId ? {
        ...c,
        loading: false,
        error: err.message,
        results: [],
        executed: true,
        hasChanges: false,
        tableName: null
      } : c));
    } finally {
      if (conn) {
        try {
          await conn.close();
        } catch (closeError) {
          console.warn('Error closing connection:', closeError);
        }
      }
    }
  }, [db, cells, dataLoaded, availableTables]);
  
  const updateCellQuery = (cellId, query) => {
    setCells(prev => prev.map(c => c.id === cellId ? {
      ...c,
      query,
      hasChanges: true
    } : c));
  };
  
  const addCell = () => {
    const lastCellWithTable = [...cells].reverse().find(cell => cell.executed && cell.tableName);
    let defaultQuery = '-- New query\\nSELECT * FROM uploaded_data';
    if (lastCellWithTable && lastCellWithTable.tableName) {
      defaultQuery = \`-- Query building on previous results\\nSELECT * FROM \${lastCellWithTable.tableName} LIMIT 10\`;
    }
    const newCell = {
      id: nextCellId,
      query: defaultQuery,
      results: [],
      loading: false,
      error: null,
      executed: false,
      hasChanges: false,
      tableName: null
    };
    setCells(prev => [...prev, newCell]);
    setNextCellId(prev => prev + 1);
  };
  
  const deleteCell = cellId => {
    if (cells.length > 1) {
      setCells(prev => prev.filter(c => c.id !== cellId));
    }
  };
  
  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    loadCSVData(file);
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };
  
  const handleKeyDown = (cellId, e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeCell(cellId);
    }
  };
  
  const renderCellResults = (cell) => {
    if (cell.loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: '#666'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e0e0e0',
            borderTop: '2px solid #4285f4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '12px'
          }} />
          Executing...
        </div>
      );
    }
    
    if (cell.error) {
      return (
        <div style={{
          padding: '16px',
          color: '#c0392b',
          backgroundColor: '#fdf2f2',
          borderRadius: '6px',
          border: '1px solid #e74c3c',
          fontSize: '14px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          Error: {cell.error}
        </div>
      );
    }
    
    if (!cell.executed || cell.results.length === 0) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#999',
          fontStyle: 'italic'
        }}>
          Press Ctrl+Enter to execute this cell
        </div>
      );
    }
    
    if (cell.results.length === 0) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          Query executed successfully. No rows returned.
        </div>
      );
    }
    
    return (
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#666',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{cell.results.length} rows returned</span>
          {cell.tableName && (
            <span style={{
              backgroundColor: '#27ae60',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              Saved as: {cell.tableName}
            </span>
          )}
        </div>
        <div style={{
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff'
          }}>
            <thead>
              <tr>
                {Object.keys(cell.results[0]).map(key => (
                  <th key={key} style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #dee2e6',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '13px',
                    position: 'sticky',
                    top: 0
                  }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cell.results.slice(0, 1000).map((row, index) => (
                <tr key={index} style={{
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                }}>
                  {Object.values(row).map((value, cellIndex) => (
                    <td key={cellIndex} style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #e9ecef',
                      color: '#34495e',
                      fontSize: '13px'
                    }}>
                      {value !== null ? String(value) : 'NULL'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      width: '100%',
      height: '100%'
    }}>
      <style>{\`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .query-cell {
          transition: all 0.2s ease;
        }
        .query-cell:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
      \`}</style>
      
      <div style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e9ecef',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 4px 0',
              color: '#2c3e50',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Data Analysis Notebook
            </h1>
            <p style={{
              margin: 0,
              color: '#7f8c8d',
              fontSize: '14px'
            }}>
              Upload CSV data and build queries that work with previous results
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={triggerFileUpload}
              disabled={globalLoading || !db}
              style={{
                padding: '8px 16px',
                backgroundColor: globalLoading || !db ? '#bdc3c7' : '#8e44ad',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: globalLoading || !db ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              📁 Upload CSV
            </button>
            <button
              onClick={addCell}
              disabled={!dataLoaded}
              style={{
                padding: '8px 16px',
                backgroundColor: !dataLoaded ? '#bdc3c7' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !dataLoaded ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              + Add Cell
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      <div style={{
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {globalError && (
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            backgroundColor: '#fdf2f2',
            color: '#c0392b',
            borderRadius: '8px',
            border: '1px solid #e74c3c'
          }}>
            {globalError}
          </div>
        )}
        
        {!dataLoaded && !globalError && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '2px dashed #dee2e6',
            width: '100%'
          }}>
            <h3 style={{
              color: '#7f8c8d',
              marginBottom: '12px'
            }}>
              No data loaded yet
            </h3>
            <p style={{
              color: '#95a5a6',
              marginBottom: '20px'
            }}>
              Upload a CSV file to start analyzing your data
            </p>
            <button
              onClick={triggerFileUpload}
              disabled={globalLoading || !db}
              style={{
                padding: '12px 24px',
                backgroundColor: '#8e44ad',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              📁 Upload CSV File
            </button>
          </div>
        )}
        
        {dataLoaded && cells.map((cell, index) => (
          <div
            key={cell.id}
            className="query-cell"
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e9ecef',
              overflow: 'hidden',
              width: '100%'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e9ecef'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  [{index + 1}]
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#666'
                }}>
                  SQL Query
                </span>
                {cell.tableName && (
                  <span style={{
                    backgroundColor: '#27ae60',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    → {cell.tableName}
                  </span>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => executeCell(cell.id)}
                  disabled={cell.loading || !cell.query.trim()}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: cell.loading || !cell.query.trim() ? '#bdc3c7' : '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: cell.loading || !cell.query.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  ▶ Run
                </button>
                {cells.length > 1 && (
                  <button
                    onClick={() => deleteCell(cell.id)}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              width: '100%'
            }}>
              <textarea
                value={cell.query}
                onChange={e => updateCellQuery(cell.id, e.target.value)}
                onKeyDown={e => handleKeyDown(cell.id, e)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '16px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  resize: 'vertical',
                  backgroundColor: '#fafafa',
                  color: '#2c3e50',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your SQL query..."
              />
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#95a5a6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px' }}>
                    💡 Available tables: {availableTables.map((table, idx) => (
                      <span key={table}>
                        <code style={{
                          backgroundColor: table.startsWith('cell_') ? '#e8f5e8' : '#ecf0f1',
                          padding: '1px 4px',
                          borderRadius: '2px',
                          fontSize: '11px',
                          fontWeight: table.startsWith('cell_') ? '600' : 'normal'
                        }}>
                          {table}
                        </code>
                        {idx < availableTables.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#bdc3c7'
                  }}>
                    SELECT queries auto-create tables as cell_{index + 1}_result
                  </div>
                </div>
                <span>
                  <kbd style={{
                    padding: '2px 6px',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '3px'
                  }}>
                    Ctrl+Enter
                  </kbd> to run
                </span>
              </div>
            </div>
            
            <div style={{
              padding: '0 20px 20px',
              width: '100%'
            }}>
              {renderCellResults(cell)}
            </div>
          </div>
        ))}
        
        {dataLoaded && cells.some(cell => cell.executed && cell.tableName) && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            width: '100%'
          }}>
            <button
              onClick={addCell}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: '2px dashed transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s',
                width: '100%'
              }}
              onMouseEnter={e => {
                e.target.style.backgroundColor = '#2980b9';
                e.target.style.borderColor = '#3498db';
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = '#3498db';
                e.target.style.borderColor = 'transparent';
              }}
            >
              + Add New Query Cell
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotebookDataAnalyzer;`
  },
];
