import React from 'react';

export default function Landing({ setUserRole }) {
  return (
    <div className="landing-page" style={{ position: 'relative', zIndex: 1 }}>
      <div className="landing-intro card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#38bdf8' }}>
          Decentralized Credential Verification
        </h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '1.05rem', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Connect your wallet to securely issue, manage, and verify digital credentials using blockchain technology. Designed using Ethereum smart contracts and modern web technologies.
        </p>

        <div className="stats-container" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div className="stat-box">
            <h3 style={{ fontSize: '2rem', color: '#4ade80', margin: 0 }}>Hash</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Immutable</span>
          </div>
          <div className="stat-box">
            <h3 style={{ fontSize: '2rem', color: '#a78bfa', margin: 0 }}>DApp</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Web3 Stack</span>
          </div>
          <div className="stat-box">
            <h3 style={{ fontSize: '2rem', color: '#38bdf8', margin: 0 }}>Safe</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>User Consent</span>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS BANNER */}
      <div style={{ margin: '2rem 0', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.25rem' }}>⚙️ How It Works</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-around', color: '#94a3b8', fontSize: '0.95rem' }}>
          <div style={{ flex: '1 1 200px' }}>
            <span style={{ display: 'block', fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏛</span>
            <strong>Institutions</strong> issue credentials by storing a cryptographic hash on the blockchain.
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <span style={{ display: 'block', fontSize: '1.5rem', marginBottom: '0.5rem' }}>👤</span>
            <strong>Users</strong> control access by granting or revoking verification permissions.
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <span style={{ display: 'block', fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</span>
            <strong>Verifiers</strong> can validate credentials only with explicit user consent.
          </div>
        </div>
      </div>

      <h3 style={{ margin: '2.5rem 0 1.5rem', textAlign: 'center', color: '#e2e8f0', fontSize: '1.4rem', fontWeight: '600', letterSpacing: '0.5px' }}>
        Select Your Role
      </h3>

      <div className="role-selection" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="card role-card" onClick={() => setUserRole("institution")}>
          <div className="icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛</div>
          <h2>Institution</h2>
          <p>Register and issue verified credentials to users on the blockchain.</p>
        </div>

        <div className="card role-card" onClick={() => setUserRole("user")}>
          <div className="icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
          <h2>User</h2>
          <p>Manage your credentials and control who can access them.</p>
        </div>

        <div className="card role-card" onClick={() => setUserRole("verifier")}>
          <div className="icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2>Verifier</h2>
          <p>Verify the authenticity of user credentials with proper consent.</p>
        </div>
      </div>

      <div className="features-grid" style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)' }}>
          <h4 style={{ color: '#60a5fa', marginBottom: '0.75rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔗 Blockchain Verification</h4>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>All credentials are recorded as keccak256 hashes on the blockchain, making them immutable and verifiable.</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)' }}>
          <h4 style={{ color: '#34d399', marginBottom: '0.75rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔐 User-Controlled Access</h4>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>Users decide who can view their credentials using a consent-based smart contract mechanism.</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)' }}>
          <h4 style={{ color: '#c084fc', marginBottom: '0.75rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏛 Trusted Institutions</h4>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>Only authorized administrators can register institutions, ensuring reliability of issued credentials.</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)' }}>
          <h4 style={{ color: '#facc15', marginBottom: '0.75rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚡ Tamper Detection</h4>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>Credential data is verified using hash matching to instantly detect any off-chain modification.</p>
        </div>
      </div>
    </div>
  );
}
