import { useState } from 'react';
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

// ── Title map (path → label) ───────────────────────────────────────
const TITLES = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload File',
  '/verify': 'Verify File',
  '/my-files': 'My Files',
  '/trash': 'Trash',
  '/blockchain-log': 'Blockchain Log',
  '/profile': 'Profile',
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
              {/* catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Protected Route Wrapper ─────────────────────────────────────────
function RequireAuth({ children, walletAddress }) {
  const location = useLocation();
  if (!walletAddress) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

// ── Root App ────────────────────────────────────────────────────────
export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('wallet');
    setWalletAddress(null);
  };



  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      }} />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/verify-public/:fileId" element={<PublicVerify />} />
        
        <Route 
          path="/login" 
          element={
            walletAddress ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onConnected={addr => {
                localStorage.setItem('wallet', addr);
                setWalletAddress(addr);
              }} />
            )
          } 
        />
        
        <Route 
          path="/*" 
          element={
            <RequireAuth walletAddress={walletAddress}>
              <AppLayout walletAddress={walletAddress} onLogout={handleLogout} />
            </RequireAuth>
          } 
        />
      </Routes>
    </>
  );
}
