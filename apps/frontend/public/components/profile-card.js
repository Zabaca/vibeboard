import React, { useState } from 'react';

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
}