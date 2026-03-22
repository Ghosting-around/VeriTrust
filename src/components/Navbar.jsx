import React from 'react';

const formatAddress = (addr) => {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
};

export default function Navbar({ wallet, chainId, loading, connectWallet, userRole, resetRole }) {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, background: 'linear-gradient(to right, #22d3ee, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🔐 VeriTrust
        </h1>
        {userRole && (
          <button 
            onClick={resetRole} 
            style={{ 
              background: 'transparent', 
              border: '1px solid rgba(255,255,255,0.2)', 
              color: '#cbd5e1', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            &larr; Switch Role
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {wallet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Sepolia</span>
            </div>
            <code style={{ background: 'transparent', border: 'none', color: '#38bdf8', padding: 0 }}>
              {formatAddress(wallet)}
            </code>
          </div>
        ) : (
          <button 
            onClick={connectWallet} 
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}
