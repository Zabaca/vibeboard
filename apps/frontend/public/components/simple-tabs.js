import React, { useState } from 'react';

export default function SimpleTabs() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    {
      id: 'home',
      label: '🏠 Home',
      content: 'Welcome to the home page! This is where you\'ll find the latest updates and news.'
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
}