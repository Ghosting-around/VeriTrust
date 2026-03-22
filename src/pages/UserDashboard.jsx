import React, { useState, useEffect } from 'react';
import { 
  grantConsentService, 
  revokeConsentService, 
  getCredentialsCountService, 
  verifySingleCredentialService,
  checkIsInstitution 
} from '../services/contractService';
import { fetchCredentialMetadata } from '../services/apiService';
import CredentialCard from '../components/CredentialCard';

export default function UserDashboard({ contract, wallet, showMessage }) {
  const [loading, setLoading] = useState(false);
  const [targetVerifierAddress, setTargetVerifierAddress] = useState("");
  const [myCredentials, setMyCredentials] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (contract && wallet) {
      loadMyCredentials();
    }
  }, [contract, wallet]);

  const loadMyCredentials = async () => {
    setFetching(true);
    try {
      const countNum = await getCredentialsCountService(contract, wallet);
      if (countNum === 0) {
        setMyCredentials([]);
        return;
      }
      const creds = [];
      for (let i = 0; i < countNum; i++) {
        const data = await verifySingleCredentialService(contract, wallet, i);
        const hash = data[0];
        const instName = data[1];
        const issuer = data[2];
        const valid = data[3];

        let trustStatus = "valid";
        if (!valid) {
          trustStatus = "revoked";
        } else {
          const instRegistered = await checkIsInstitution(contract, issuer);
          if (!instRegistered) trustStatus = "untrusted";
        }

        let displayName = "Unknown";
        let hashVerified = false;
        const metadata = await fetchCredentialMetadata(hash);

        if (metadata && metadata.credential_name) {
          // Simplification for frontend UI structure update
          displayName = metadata.credential_name;
          hashVerified = true;
        }

        creds.push({ index: i, hash, institution: instName, issuer, valid, trustStatus, name: displayName, hashVerified });
      }
      setMyCredentials(creds);
    } catch (err) {
      console.error("Failed to load own credentials", err);
    } finally {
      setFetching(false);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}?address=${wallet}`;
    navigator.clipboard.writeText(url);
    showMessage("Link copied to clipboard!", "success");
  };

  const handleConsent = async (action) => {
    if (!targetVerifierAddress) return showMessage("Please specify a verifier address", "warning");
    try {
      setLoading(true);
      showMessage(`${action === 'grant' ? 'Granting' : 'Revoking'} consent...`, "info");
      
      if (action === 'grant') {
        await grantConsentService(contract, targetVerifierAddress);
      } else {
        await revokeConsentService(contract, targetVerifierAddress);
      }
      
      showMessage(`Consent ${action === 'grant' ? 'granted' : 'revoked'} successfully!`, "success");
      setTargetVerifierAddress("");
    } catch (err) {
      showMessage(`Action failed: ${err.reason || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h2 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '2rem' }}>👤 User Privacy Hub</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#e2e8f0' }}>Consent Management</h3>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
            Authorize a third-party verifier to securely access your credentials.
          </p>
          <div className="form-group">
            <label>Verifier Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={targetVerifierAddress}
              onChange={(e) => setTargetVerifierAddress(e.target.value)}
              className="input-field"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => handleConsent('grant')} disabled={loading || !targetVerifierAddress} className="primary" style={{ flex: 1 }}>
              {loading ? "Processing..." : "Grant"}
            </button>
            <button onClick={() => handleConsent('revoke')} disabled={loading || !targetVerifierAddress} className="secondary" style={{ flex: 1, borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }}>
              {loading ? "Processing..." : "Revoke"}
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#e2e8f0' }}>Share Your Profile</h3>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
            Generate a unique link to provide quick verification access to approved parties.
          </p>
          <div style={{ padding: '1rem', background: 'white', borderRadius: '12px', marginBottom: '1.5rem', display: 'inline-block' }}>
            {/* Mock QR Code */}
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}?address=${wallet}`} alt="QR Code" width="120" height="120" style={{ display: 'block' }}/>
          </div>
          <button onClick={copyShareLink} className="secondary" style={{ width: '80%' }}>
            🔗 Copy Share Link
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          My Verified Credentials
          {fetching && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>(Syncing...)</span>}
        </h3>
        
        {myCredentials.length > 0 ? (
          <div className="credentials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {myCredentials.map((cred, idx) => (
              <CredentialCard key={idx} cred={cred} />
            ))}
          </div>
        ) : (
          <div className="no-creds" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)' }}>
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No credentials found for your address.</p>
          </div>
        )}
      </div>
    </div>
  );
}
