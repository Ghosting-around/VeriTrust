import React, { useEffect } from 'react';

export default function StatusMessage({ status, statusType, clearStatus }) {
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        clearStatus();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, clearStatus]);

  if (!status) return null;

  const bgColors = {
    success: 'rgba(16, 185, 129, 0.95)',
    error: 'rgba(239, 68, 68, 0.95)',
    info: 'rgba(59, 130, 246, 0.95)',
    warning: 'rgba(245, 158, 11, 0.95)'
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      background: bgColors[statusType] || bgColors.info,
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 9999,
      animation: 'slideUp 0.3s ease-out forwards',
      maxWidth: '400px'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
      <span style={{ fontSize: '1.2rem' }}>{icons[statusType]}</span>
      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>{status}</p>
      <button 
        onClick={clearStatus}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '1.2rem',
          cursor: 'pointer',
          marginLeft: 'auto',
          opacity: 0.8
        }}
      >
        &times;
      </button>
    </div>
  );
}
