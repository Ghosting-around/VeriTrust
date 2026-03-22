import React from 'react';
import { formatHash } from '../services/contractService';

export default function CredentialCard({ cred }) {
  const isGreen = cred.trustStatus === "valid";
  const isRed = cred.trustStatus === "revoked";
  const isYellow = cred.trustStatus === "untrusted";

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.7)',
      border: `1px solid ${isGreen ? 'rgba(34, 197, 94, 0.3)' : isRed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
      borderRadius: '16px',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.8rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        background: isGreen ? 'rgba(34, 197, 94, 0.15)' : isRed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
        color: isGreen ? '#4ade80' : isRed ? '#f87171' : '#facc15',
        border: `1px solid ${isGreen ? 'rgba(34, 197, 94, 0.3)' : isRed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
      }}>
        {isGreen && "✅ Valid"}
        {isRed && "❌ Revoked"}
        {isYellow && "⚠️ Untrusted"}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          color: cred.hashVerified ? '#f8fafc' : '#ef4444', 
          margin: 0, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          {cred.name}
          {cred.hashVerified && <span style={{ fontSize: '0.8rem', color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Verified Name</span>}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Institution</span>
          <span style={{ color: '#e2e8f0' }}>{cred.institution}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Issuer Address</span>
          <code style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{formatHash(cred.issuer)}</code>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Credential Hash</span>
          <code style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{formatHash(cred.hash)}</code>
        </div>
      </div>
    </div>
  );
}
