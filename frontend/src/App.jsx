import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './styles/global.css';

import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Verify from './pages/Verify';
import Files from './pages/Files';
import BlockchainLog from './pages/BlockchainLog';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PublicVerify from './pages/PublicVerify';
import AuditLog from './pages/AuditLog';
import { notifVariants } from './utils/animations';
import { NotificationProvider } from './context/NotificationContext';

const NAV_LABELS = {
  dashboard: 'Dashboard',
  upload: 'Upload & Seal',
  verify: 'Verify File',
  files: 'My Files',
  blockchain: 'Blockchain Log',
  profile: 'My Profile',
  audit: 'Audit Trail',
};

const VALID_PAGES = ['dashboard', 'upload', 'verify', 'files', 'blockchain', 'profile', 'audit'];

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  const handleNavigate = (page) => {
    setActivePage(VALID_PAGES.includes(page) ? page : '404');
  };

  const handleConnected = (address) => {
    setWalletAddress(address);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setWalletAddress(null);
    setActivePage('dashboard');
  };

  // Jar URL madhe /verify-public aahe tar seedha page dakhav
  if (window.location.pathname === '/verify-public') {
    return (
      <NotificationProvider>
        <PublicVerify />
      </NotificationProvider>
    );
  }

  // ── Not logged in ──
  if (!walletAddress) {
    return (
      <NotificationProvider>
        <div className="grid-bg" />
        <Login onConnected={handleConnected} />
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <div className="grid-bg" />
      <div className="noise" />

      <div className="app">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          walletAddress={walletAddress}
        />

        <main className="main">
          <Topbar
            pageTitle={NAV_LABELS[activePage] || 'Not Found'}
            walletAddress={walletAddress}
            onDisconnect={handleLogout}
          />

          {/* Page transition */}
          <div className="content">
            <AnimatePresence mode="wait">
              <motion.div key={activePage} style={{ height: '100%' }}>
                {activePage === 'dashboard' &&
                  <Dashboard onNavigate={handleNavigate} walletAddress={walletAddress} />}
                {activePage === 'upload' &&
                  <Upload walletAddress={walletAddress} />}
                {activePage === 'verify' &&
                  <Verify walletAddress={walletAddress} />}
                {activePage === 'files' &&
                  <Files onNavigate={handleNavigate} walletAddress={walletAddress} />}
                {activePage === 'blockchain' && <BlockchainLog />}
                {activePage === 'audit' && <AuditLog walletAddress={walletAddress} />}
                {activePage === 'profile' && <Profile walletAddress={walletAddress} onNavigate={handleNavigate} />}
                {activePage === '404' && <NotFound onNavigate={handleNavigate} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
}
