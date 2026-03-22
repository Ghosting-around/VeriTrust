import React, { useState, useEffect } from 'react';
import { checkIsInstitution, registerInstitutionService, issueCredentialService } from '../services/contractService';
import { saveCredentialMetadata } from '../services/apiService';

export default function InstitutionDashboard({ contract, wallet, showMessage }) {
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const [instAddress, setInstAddress] = useState("");
  const [instName, setInstName] = useState("");

  const [credentialRecipient, setCredentialRecipient] = useState("");
  const [credentialName, setCredentialName] = useState("");

  useEffect(() => {
    if (contract && wallet) {
      checkIsInstitution(contract, wallet).then(setIsRegistered).catch(console.error);
    }
  }, [contract, wallet]);

  const handleRegister = async () => {
    if (!instAddress || !instName) {
      return showMessage("Please fill in institution address and name", "warning");
    }
    try {
      setLoading(true);
      showMessage("Registering institution (Confirm in MetaMask)...", "info");
      await registerInstitutionService(contract, instAddress, instName);
      showMessage(`Institution registered: ${instName}`, "success");
      setInstAddress("");
      setInstName("");
    } catch (err) {
      showMessage(`Registration failed: ${err.reason || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!isRegistered) {
      return showMessage("Access denied: You are not a registered institution", "error");
    }
    if (!credentialRecipient || !credentialName) {
      return showMessage("Please fill in all required fields", "warning");
    }
    
    try {
      setLoading(true);
      showMessage("Issuing credential (Confirm in MetaMask)...", "info");
      
      const { receipt, hash } = await issueCredentialService(contract, credentialRecipient, credentialName);
      
      await saveCredentialMetadata(hash, credentialRecipient, wallet, credentialName);

      showMessage(`Credential issued! (Tx: ${receipt.hash.substring(0, 10)}...)`, "success");
      setCredentialRecipient("");
      setCredentialName("");
    } catch (err) {
      showMessage(`Issuance failed: ${err.reason || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0 }}>🏛 Institution Panel</h2>
        <div style={{ padding: '0.4rem 1rem', borderRadius: '999px', background: isRegistered ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: isRegistered ? '#4ade80' : '#f87171', border: `1px solid ${isRegistered ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          Status: {isRegistered ? '✅ Registered' : '❌ Unregistered'}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.5rem', color: '#e2e8f0' }}>Register Institution</h3>
        <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
          Authorize a new institution to issue credentials. (Requires Admin Privileges)
        </p>
        <div className="form-group">
          <label>Institution Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={instAddress}
            onChange={(e) => setInstAddress(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label>Institution Name</label>
          <input
            type="text"
            placeholder="e.g. University of Blockchain"
            value={instName}
            onChange={(e) => setInstName(e.target.value)}
            className="input-field"
          />
        </div>
        <button onClick={handleRegister} disabled={loading || !instAddress || !instName} className="primary">
          {loading ? "Processing..." : "Register Institution"}
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.5rem', color: '#e2e8f0' }}>Issue New Credential</h3>
        <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
          Create and anchor a verifiable credential hash to a user's wallet address.
        </p>
        <div className="form-group">
          <label>Recipient Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={credentialRecipient}
            onChange={(e) => setCredentialRecipient(e.target.value)}
            className="input-field"
            disabled={!isRegistered}
          />
        </div>
        <div className="form-group">
          <label>Credential Name/ID</label>
          <input
            type="text"
            placeholder="e.g., VeriTrust-Degree-2026"
            value={credentialName}
            onChange={(e) => setCredentialName(e.target.value)}
            className="input-field"
            disabled={!isRegistered}
          />
        </div>
        <button onClick={handleIssue} disabled={loading || !credentialRecipient || !credentialName || !isRegistered} className={isRegistered ? "primary" : "secondary"}>
          {loading ? "Issuing..." : "Issue Credential"}
        </button>
      </div>
    </div>
  );
}
