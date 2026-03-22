import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatusMessage from './components/StatusMessage';
import Landing from './pages/Landing';
import InstitutionDashboard from './pages/InstitutionDashboard';
import UserDashboard from './pages/UserDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import { connectWalletService } from './services/contractService';
import './app.css';

function App() {
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [initialVerifierAddress, setInitialVerifierAddress] = useState("");

  const showMessage = (msg, type = "info") => {
    setStatus(msg);
    setStatusType(type);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const addr = params.get("address");
    if (addr) {
      setUserRole("verifier");
      setInitialVerifierAddress(addr);
    }
  }, []);

  const connectWallet = async () => {
    try {
      setLoading(true);
      const { provider: p, contract: c, address: a, chainId: cid } = await connectWalletService();
      setProvider(p);
      setContract(c);
      setWallet(a);
      setChainId(cid);
      showMessage(`Wallet connected: ${a.slice(0,6)}...${a.slice(-4)}`, "success");
    } catch (err) {
      showMessage(`Connection failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!userRole) {
      return <Landing setUserRole={setUserRole} />;
    }
    if (!wallet) {
      return (
        <div style={{ textAlign: 'center', marginTop: '10vh' }}>
          <h2 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Wallet Connection Required</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Please connect your MetaMask wallet using the top navigation bar to securely access the <strong>{userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard</strong>.</p>
        </div>
      );
    }
    switch (userRole) {
      case 'institution':
        return <InstitutionDashboard contract={contract} wallet={wallet} showMessage={showMessage} />;
      case 'user':
        return <UserDashboard contract={contract} wallet={wallet} showMessage={showMessage} />;
      case 'verifier':
        return <VerifierDashboard contract={contract} wallet={wallet} showMessage={showMessage} initialAddress={initialVerifierAddress} />;
      default:
        return <Landing setUserRole={setUserRole} />;
    }
  };

  return (
    <div className="app-wrapper" style={{ padding: 0, flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Navbar 
        wallet={wallet} 
        chainId={chainId} 
        loading={loading} 
        connectWallet={connectWallet} 
        userRole={userRole} 
        resetRole={() => setUserRole(null)} 
      />
      
      <div className="app-container" style={{ marginTop: '2rem', padding: '0 1.5rem', width: '100%', maxWidth: '800px' }}>
        {renderContent()}
      </div>

      <StatusMessage status={status} statusType={statusType} clearStatus={() => setStatus("")} />
      
      <div className="footer-info">
        <p>🔒 Secure | 🔗 Decentralized | ✓ Verified</p>
      </div>
    </div>
  );
}

export default App;
