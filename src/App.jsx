import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { BrowserMultiFormatReader } from "@zxing/browser";
import "./app.css";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function admin() view returns (address)",
  "function institutions(address) view returns (string,bool)",
  "function registerInstitution(address,string)",
  "function issueCredential(address,bytes32)",
  "function grantConsent(address)",
  "function getCredentialCount(address) view returns (uint256)",
  "function verifyCredential(address,uint256) view returns (bytes32,string,address,bool)"
];

function App() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // 'success', 'error', 'info'
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState(null);

  // Institution Registration
  const [instAddress, setInstAddress] = useState("");
  const [instName, setInstName] = useState("");

  // Issue Credential
  const [credentialRecipient, setCredentialRecipient] = useState("");
  const [credentialName, setCredentialName] = useState("");

  // Verification
  const [verifyAddress, setVerifyAddress] = useState("");
  const [allCredentials, setAllCredentials] = useState([]);

  // Consent
  const [targetVerifierAddress, setTargetVerifierAddress] = useState("");

  // Role State
  const [userRole, setUserRole] = useState(null); // 'institution', 'user', 'verifier'

  // Load params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const addr = params.get("address");
    if (addr && ethers.isAddress(addr)) {
      setUserRole("verifier");
      setVerifyAddress(addr);
      // We can't fetch immediately without wallet connection usually, 
      // but if we had a public provider we could. 
      // For now, we'll just set the address and let them connect.
    }
  }, []);

  const copyShareLink = () => {
    if (!wallet) return;
    const url = `${window.location.origin}?address=${wallet}`;
    navigator.clipboard.writeText(url);
    setStatus("Link copied to clipboard!");
    setStatusType("success");
    setTimeout(() => setStatus(""), 3000);
  };

  const resetRole = () => {
    setUserRole(null);
    setVerifyAddress("");
    setStatus("");
  };

  // -----------------------
  // CONNECT WALLET
  // -----------------------
  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) {
        setStatus("MetaMask not installed. Please install MetaMask.");
        setStatusType("error");
        setLoading(false);
        return;
      }

      // Request to switch to Sepolia network
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }], // Sepolia
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          setStatus("Sepolia network not found. Please add it to MetaMask.");
          setStatusType("error");
          setLoading(false);
          return;
        }
        throw switchError;
      }

      const prov = new ethers.BrowserProvider(window.ethereum);
      const net = await prov.getNetwork();
      setChainId(net.chainId);

      const signer = await prov.getSigner();
      const addr = await signer.getAddress();

      const ctr = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      setWallet(addr);
      setProvider(prov);
      setContract(ctr);
      setStatus(`Wallet connected successfully! (${addr.substring(0, 6)}...${addr.substring(38)})`);
      setStatusType("success");
    } catch (err) {
      console.error(err);
      setStatus(`Connection failed: ${err.message}`);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // REGISTER INSTITUTION (ADMIN ONLY)
  // -----------------------
  const registerInstitution = async () => {
    try {
      if (!contract) return;
      if (!instAddress || !instName) {
        setStatus("Please fill in institution address and name");
        setStatusType("error");
        return;
      }
      if (!ethers.isAddress(instAddress)) {
        setStatus("Invalid institution address");
        setStatusType("error");
        return;
      }

      setLoading(true);
      setStatus("Registering institution...");
      setStatusType("info");

      const tx = await contract.registerInstitution(instAddress, instName);
      await tx.wait();

      setStatus(`Institution registered: ${instName}`);
      setStatusType("success");
      setInstAddress("");
      setInstName("");
    } catch (err) {
      console.error(err);
      setStatus(`Registration failed: ${err.reason || err.message}`);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // ISSUE CREDENTIAL (INSTITUTION ONLY)
  // -----------------------
  const issueCredential = async () => {
    try {
      if (!contract) {
        setStatus("Please connect wallet first");
        setStatusType("error");
        return;
      }

      const inst = await contract.institutions(wallet);
      if (!inst[1]) {
        setStatus("Access denied: Not a registered institution");
        setStatusType("error");
        return;
      }

      if (!credentialRecipient || !credentialName) {
        setStatus("Please fill in all required fields");
        setStatusType("error");
        return;
      }

      // Validate address format
      if (!ethers.isAddress(credentialRecipient)) {
        setStatus("Invalid recipient address format");
        setStatusType("error");
        return;
      }

      setLoading(true);
      const hash = ethers.keccak256(ethers.toUtf8Bytes(credentialName));

      setStatus("Issuing credential...");
      setStatusType("info");
      const tx = await contract.issueCredential(credentialRecipient, hash);
      const receipt = await tx.wait();

      // Save metadata to backend
      try {
        await fetch('http://localhost:3001/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hash: hash,
            recipient: credentialRecipient,
            institution: wallet, // The signer is the institution
            name: credentialName,
            data: { issuedAt: new Date().toISOString() } // simplified data for now
          })
        });
      } catch (apiErr) {
        console.error("Backend save failed", apiErr);
        // We don't fail the UI flow because on-chain succeeded
      }

      setStatus(`Credential issued successfully! (Tx: ${receipt.hash.substring(0, 10)}...)`);
      setStatusType("success");
      setCredentialRecipient("");
      setCredentialName("");
    } catch (err) {
      console.error(err);
      setStatus(`Issuance failed: ${err.reason || err.message}`);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // GRANT CONSENT
  // -----------------------
  const grantConsent = async () => {
    try {
      if (!contract) {
        setStatus("Please connect wallet first");
        setStatusType("error");
        return;
      }

      if (!ethers.isAddress(targetVerifierAddress)) {
        setStatus("Invalid verifier address format");
        setStatusType("error");
        return;
      }

      setLoading(true);
      setStatus("Granting consent...");
      setStatusType("info");
      const tx = await contract.grantConsent(targetVerifierAddress);
      const receipt = await tx.wait();

      setStatus(`Consent granted successfully! (Tx: ${receipt.hash.substring(0, 10)}...)`);
      setStatusType("success");
      setTargetVerifierAddress("");
    } catch (err) {
      console.error(err);
      setStatus(`Consent failed: ${err.reason || err.message}`);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // VERIFY CREDENTIALS
  // -----------------------
  const fetchUserCredentials = async () => {
    try {
      if (!contract) {
        setStatus("Please connect wallet first");
        setStatusType("error");
        return;
      }

      const targetAddr = verifyAddress || wallet;
      if (!ethers.isAddress(targetAddr)) {
        setStatus("Invalid address to verify");
        setStatusType("error");
        return;
      }

      setLoading(true);
      setStatus(`Fetching credentials for ${targetAddr.substring(0, 6)}...`);
      setStatusType("info");
      setAllCredentials([]);

      const count = await contract.getCredentialCount(targetAddr);
      const countNum = Number(count);

      if (countNum === 0) {
        setStatus("No credentials found for this address");
        setStatusType("info");
        setLoading(false);
        return;
      }

      const creds = [];
      for (let i = 0; i < countNum; i++) {
        try {
          const data = await contract.verifyCredential(targetAddr, i);
          const hash = data[0];

          // Fetch metadata from backend
          let metadata = {};
          try {
            const res = await fetch(`http://localhost:3001/api/credentials/${hash}`);
            if (res.ok) {
              const row = await res.json();
              metadata = row;
            }
          } catch (apiErr) {
            console.warn("Failed to fetch metadata", apiErr);
          }

          creds.push({
            index: i,
            hash: hash,
            institution: data[1],
            issuer: data[2],
            valid: data[3],
            name: metadata.credential_name || "Unknown",
            dbData: metadata.data
          });
        } catch (e) {
          console.error(`Failed to fetch cred ${i}`, e);
        }
      }

      setAllCredentials(creds);
      setStatus(`Found ${creds.length} credential(s)`);
      setStatusType("success");
    } catch (err) {
      console.error(err);
      setStatus(`Verification failed: ${err.reason || err.message}`);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // IMAGE UPLOAD (BARCODE/QR)
  // -----------------------
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus("Scanning image...");
    setStatusType("info");

    try {
      const reader = new BrowserMultiFormatReader();
      // Read the file as an Object URL to pass it to the decoder
      const imageUrl = URL.createObjectURL(file);

      const result = await reader.decodeFromImageUrl(imageUrl);
      const scannedText = result.getText();

      if (ethers.isAddress(scannedText)) {
        setVerifyAddress(scannedText);
        setStatus("Address scanned successfully! You can now verify credentials.");
        setStatusType("success");
      } else {
        setStatus("The scanned code does not contain a valid Ethereum address.");
        setStatusType("error");
      }

      // Revoke the object URL to free memory
      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      console.error("Scanning Error:", err);
      // zxing throws an error specifically if no barcode is found
      if (err.name === 'NotFoundException' || err.message.includes("No MultiFormat Readers")) {
        setStatus("No barcode or QR code found in the image.");
      } else {
        setStatus("Failed to scan image. Ensure it's a clear barcode/QR code.");
      }
      setStatusType("error");
    } finally {
      setLoading(false);
      // Reset the file input so the same file could be selected again
      e.target.value = null;
    }
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        {/* ========== HEADER ========== */}
        <div className="header">
          <h1>🔐 VeriTrust</h1>
          <p className="tagline">Decentralized Credential Verification</p>
        </div>

        {/* ========== WALLET CONNECTION ========== */}
        <div className="card wallet-card">
          <h2>Wallet Connection</h2>
          <div className="wallet-info">
            {wallet ? (
              <>
                <div className="status-badge success">✓ Connected</div>
                <p className="wallet-address">
                  <span className="label">Address:</span>
                  <code>{wallet}</code>
                </p>
                <p className="wallet-details">
                  <span className="label">Chain ID:</span> {chainId || "Loading..."}
                </p>
              </>
            ) : (
              <>
                <div className="status-badge disconnected">⚠ Not Connected</div>
                <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                  Connect your MetaMask wallet to Sepolia network to get started.
                </p>
              </>
            )}
          </div>
          <button
            onClick={connectWallet}
            disabled={loading}
            className={wallet ? "secondary" : "primary"}
          >
            {loading ? "Connecting..." : wallet ? "Reconnect Wallet" : "Connect MetaMask Wallet"}
          </button>
        </div>

        {/* ========== ROLE SELECTION (LANDING) ========== */}
        {!userRole && (
          <div className="role-selection">
            <div className="card role-card" onClick={() => setUserRole("institution")}>
              <h2>🏛 Institution</h2>
              <p>Register as an institution and issue credentials.</p>
            </div>

            <div className="card role-card" onClick={() => setUserRole("user")}>
              <h2>👤 User</h2>
              <p>View your credentials and generate shareable links.</p>
            </div>

            <div className="card role-card" onClick={() => setUserRole("verifier")}>
              <h2>🔍 Verifier</h2>
              <p>Verify credentials for a specific wallet address.</p>
            </div>
          </div>
        )}

        {/* ========== BACK BUTTON ========== */}
        {userRole && (
          <button onClick={resetRole} className="back-button">
            &larr; Back to Role Selection
          </button>
        )}

        {/* ========== INSTITUTION VIEW ========== */}
        {userRole === "institution" && wallet && (
          <>
            <div className="card">
              <h2>Register Institution</h2>
              <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1rem" }}>
                Authorize a new institution to issue credentials. (Admin Only)
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
              <button
                onClick={registerInstitution}
                disabled={loading || !instAddress || !instName}
                className="primary"
              >
                Register Institution
              </button>
            </div>

            <div className="card">
              <h2>Issue New Credential</h2>
              <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1rem" }}>
                Create and issue a credential to a user.
              </p>

              <div className="form-group">
                <label htmlFor="recipient">Recipient Address</label>
                <input
                  id="recipient"
                  type="text"
                  placeholder="0x..."
                  value={credentialRecipient}
                  onChange={(e) => setCredentialRecipient(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label htmlFor="credName">Credential Name/ID</label>
                <input
                  id="credName"
                  type="text"
                  placeholder="e.g., VeriTrust-Degree-2026"
                  value={credentialName}
                  onChange={(e) => setCredentialName(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                onClick={issueCredential}
                disabled={loading || !credentialRecipient || !credentialName}
                className="primary"
              >
                {loading ? "Issuing..." : "Issue Credential"}
              </button>
            </div>
          </>
        )}

        {/* ========== USER VIEW ========== */}
        {userRole === "user" && wallet && (
          <>
            <div className="card">
              <h2>Privacy & Consent</h2>
              <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1rem" }}>
                Grant consent for a specific verifier to view your credentials.
              </p>

              <div className="form-group">
                <label>Verifier Address</label>
                <input
                  type="text"
                  placeholder="Enter verifier wallet address"
                  value={targetVerifierAddress}
                  onChange={(e) => setTargetVerifierAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                onClick={grantConsent}
                disabled={loading || !targetVerifierAddress}
                className="primary"
              >
                {loading ? "Granting..." : "Grant Consent"}
              </button>
            </div>

            <div className="card">
              <h2>Share Verification Link</h2>
              <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1rem" }}>
                Generate a link to share your verified credentials with others.
              </p>
              <button onClick={copyShareLink} className="secondary">
                🔗 Copy Share Link
              </button>
            </div>
          </>
        )}

        {/* ========== VERIFIER VIEW ========== */}
        {userRole === "verifier" && wallet && (
          <div className="card">
            <h2>Verify Credentials</h2>
            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1rem" }}>
              Check credentials for any user (requires consent).
            </p>

            <div className="form-group">
              <label>Wallet Address</label>
              <input
                type="text"
                placeholder="Enter wallet address"
                value={verifyAddress}
                onChange={(e) => setVerifyAddress(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
              <label htmlFor="qr-upload" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Or Upload QR Code/Barcode Image
              </label>
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
                className="input-field"
                style={{ padding: '0.5rem', background: '#1e293b' }}
              />
            </div>

            <button
              onClick={fetchUserCredentials}
              disabled={loading}
              className="primary"
            >
              {loading ? "Verifying..." : "Verify Credentials"}
            </button>

            {/* RESULTS */}
            {allCredentials.length > 0 && (
              <div className="credentials-grid">
                {allCredentials.map((cred, idx) => (
                  <div key={idx} className="credential-card">
                    <div className="credential-detail">
                      <span className="label">Institution:</span>
                      <p>{cred.institution || "Unknown"}</p>
                    </div>
                    <div className="credential-detail">
                      <span className="label">Issuer Address:</span>
                      <code className="code-block">{cred.issuer}</code>
                    </div>
                    <div className="credential-detail">
                      <span className="label">Credential Hash:</span>
                      <code className="code-block">{cred.hash}</code>
                    </div>
                    <div className="credential-detail">
                      <span className="label">Credential Name:</span>
                      <p style={{ fontWeight: "bold", color: "#e2e8f0" }}>{cred.name}</p>
                    </div>
                    <div className="credential-detail">
                      <span className="label">Status:</span>
                      <div className={`status-badge ${cred.valid ? "success" : "error"}`}>
                        {cred.valid ? "✓ Valid" : "✗ Invalid"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allCredentials.length === 0 && !loading && statusType === 'success' && (
              <div className="no-creds">No credentials found for this address.</div>
            )}
          </div>
        )}

        {/* ========== STATUS MESSAGE ========== */}
        {status && (
          <div className={`status ${statusType}`}>
            <p>{status}</p>
          </div>
        )}

        {/* ========== FOOTER INFO ========== */}
        <div className="footer-info">
          <p>🔒 Secure | 🔗 Decentralized | ✓ Verified</p>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>
            Contract: {CONTRACT_ADDRESS ? `${CONTRACT_ADDRESS.substring(0, 10)}...` : "Not configured"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
