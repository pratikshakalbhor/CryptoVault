import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Verify from './pages/Verify';
import MyFiles from './pages/MyFiles';
import BlockchainLog from './pages/BlockchainLog';
import FileDetails from './pages/FileDetails';
import Profile from './pages/Profile';
import PublicVerify from './pages/PublicVerify';
import Trash from './pages/Trash';
import RecoveryHub from './pages/RecoveryHub';

// ── Title map (path → label) ───────────────────────────────────────
const TITLES = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload File',
  '/verify': 'Verify File',
  '/my-files': 'My Files',
  '/trash': 'Trash',
  '/blockchain-log': 'Blockchain Log',
  '/profile': 'Profile',
  '/recovery': 'Recovery Hub',
};

function usePageTitle() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/files/')) return 'File Details';
  return TITLES[pathname] || 'Dashboard';
}

// ── Auth-guarded layout (Sidebar + Topbar + Routes) ────────────────
function AppLayout({ walletAddress, onLogout }) {
  const title = usePageTitle();

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      }} />
      <div className="app">
        <Sidebar onLogout={onLogout} />
        <div className="main">
          <Topbar
            walletAddress={walletAddress}
            pageTitle={title}
            onDisconnect={onLogout}
          />
          <div className="page">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard walletAddress={walletAddress} />} />
              <Route path="/upload" element={<Upload walletAddress={walletAddress} />} />
              <Route path="/verify" element={<Verify walletAddress={walletAddress} />} />
              <Route path="/my-files" element={<MyFiles walletAddress={walletAddress} />} />
              <Route path="/trash" element={<Trash walletAddress={walletAddress} />} />
              <Route path="/blockchain-log" element={<BlockchainLog walletAddress={walletAddress} />} />
              <Route path="/files/:id" element={<FileDetails walletAddress={walletAddress} />} />
              <Route path="/profile" element={<Profile walletAddress={walletAddress} onLogout={onLogout} />} />
              <Route path="/recovery" element={<RecoveryHub walletAddress={walletAddress} onNotify={(msg, type) => {}} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Root App ────────────────────────────────────────────────────────
export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Public routes (don't require wallet)
  const isPublicRoute = location.pathname.startsWith('/verify-public/');

  useEffect(() => {
    // Fresh connect mandatory — we don't auto-load from localStorage here anymore
    setLoading(false);

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          handleLogout();
        } else {
          setWalletAddress(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const handleConnected = (address) => {
    setWalletAddress(address);
  };

  const handleLogout = () => {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('wallet');
    localStorage.removeItem('token');
    sessionStorage.clear();
    setWalletAddress(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        background: '#080c10', color: '#00d4ff'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      }} />
      
      {/* Handle Public routes first */}
      {isPublicRoute ? (
        <Routes>
          <Route path="/verify-public/:fileId" element={<PublicVerify />} />
        </Routes>
      ) : !walletAddress ? (
        <Login onConnected={handleConnected} />
      ) : (
        <AppLayout
          walletAddress={walletAddress}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
