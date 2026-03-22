import React, { useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ethers } from "ethers";
import { 
  getCredentialsCountService, 
  verifySingleCredentialService,
  checkConsentService,
  checkIsInstitution 
} from '../services/contractService';
import { fetchCredentialMetadata } from '../services/apiService';
import CredentialCard from '../components/CredentialCard';

export default function VerifierDashboard({ contract, wallet, showMessage, initialAddress }) {
  const [loading, setLoading] = useState(false);
  const [verifyAddress, setVerifyAddress] = useState(initialAddress || "");
  const [allCredentials, setAllCredentials] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialAddress && contract && wallet) {
      handleVerify(initialAddress);
    }
  }, [initialAddress, contract, wallet]);

  const handleVerify = async (addressToVerify = verifyAddress) => {
    if (!addressToVerify) return showMessage("Please enter an address to verify.", "warning");
    
    try {
      setLoading(true);
      setHasSearched(true);
      setAllCredentials([]);

      if (addressToVerify.toLowerCase() === wallet.toLowerCase()) {
        showMessage("You are verifying your own credentials.", "info");
      } else {
        const consent = await checkConsentService(contract, addressToVerify, wallet);
        if (!consent) {
          setLoading(false);
          return showMessage("Access Denied: The user has not granted you consent.", "error");
        }
      }

      showMessage(`Fetching credentials for ${addressToVerify.substring(0, 6)}...`, "info");
      const countNum = await getCredentialsCountService(contract, addressToVerify);

      if (countNum === 0) {
        showMessage("No credentials found for this address.", "info");
        setLoading(false);
        return;
      }

      const creds = [];
      for (let i = 0; i < countNum; i++) {
        const data = await verifySingleCredentialService(contract, addressToVerify, i);
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
          const recomputedHash = ethers.keccak256(ethers.toUtf8Bytes(metadata.credential_name));
          if (recomputedHash === hash) {
            displayName = metadata.credential_name;
            hashVerified = true;
          } else {
            displayName = "⚠ Tampered Data";
          }
        }

        creds.push({ index: i, hash, institution: instName, issuer, valid, trustStatus, name: displayName, hashVerified });
      }

      setAllCredentials(creds);
      showMessage(`Successfully loaded ${creds.length} credential(s).`, "success");
    } catch (err) {
      showMessage(`Verification failed: ${err.reason || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    showMessage("Scanning image...", "info");

    try {
      const reader = new BrowserMultiFormatReader();
      const imageUrl = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(imageUrl);
      const scannedText = result.getText();

      if (ethers.isAddress(scannedText)) {
        setVerifyAddress(scannedText);
        showMessage("Address scanned! Ready to verify.", "success");
      } else {
        showMessage("No valid Ethereum address found in image.", "error");
      }
      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      showMessage("Failed to scan image. Ensure it's a clear QR code.", "error");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const filteredCredentials = allCredentials.filter(cred => 
    cred.institution.toLowerCase().includes(filterText.toLowerCase()) || 
    cred.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="dashboard">
      <h2 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '2rem' }}>🔍 Validation Portal</h2>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#e2e8f0' }}>Target Wallet Address</h3>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="Enter 0x address"
              value={verifyAddress}
              onChange={(e) => setVerifyAddress(e.target.value)}
              className="input-field"
              style={{ marginBottom: '1rem' }}
            />
            <button onClick={() => handleVerify()} disabled={loading || !verifyAddress} className="primary" style={{ marginTop: 0 }}>
              {loading ? "Searching..." : "Verify Credentials"}
            </button>
          </div>
          
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>Or Scan QR</span>
            <label htmlFor="qr-upload" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100px', height: '100px', background: 'rgba(15,23,42,0.6)', 
              border: '1px dashed #38bdf8', borderRadius: '12px', cursor: 'pointer',
              color: '#38bdf8', transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1
            }}>
              <span style={{ fontSize: '2rem' }}>📷</span>
            </label>
            <input
              id="qr-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={loading}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {hasSearched && (
        <div style={{ padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ color: '#e2e8f0', margin: 0 }}>Search Results <span style={{ color: '#64748b', fontSize: '1rem' }}>({allCredentials.length})</span></h3>
            
            {allCredentials.length > 0 && (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Filter by institution..." 
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="input-field"
                  style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', width: '250px', background: 'rgba(15,23,42,0.8)' }}
                />
              </div>
            )}
          </div>

          {allCredentials.length > 0 ? (
            filteredCredentials.length > 0 ? (
              <div className="credentials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredCredentials.map((cred, idx) => (
                  <CredentialCard key={idx} cred={cred} />
                ))}
              </div>
            ) : (
              <div className="no-creds" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)' }}>
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>No credentials match your filter.</p>
              </div>
            )
          ) : !loading && (
            <div className="no-creds" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)' }}>
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>No credentials found for this address.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
