import { useState } from 'react';
import './index.css';

import Login        from './pages/Login';
import Sidebar      from './components/Sidebar';
import Topbar       from './components/Topbar';
import Dashboard    from './pages/Dashboard';
import Upload       from './pages/Upload';
import Verify       from './pages/Verify';
import MyFiles      from './pages/MyFiles';
import BlockchainLog from './pages/BlockchainLog';
import FileDetails  from './pages/FileDetails';
import Alerts       from './pages/Alerts';
import Profile      from './pages/Profile';

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [activePage, setActivePage]       = useState('dashboard');
  const [selectedFile, setSelectedFile]   = useState(null);

  const handleNavigate = (page, fileData) => {
    setActivePage(page);
    if (fileData) setSelectedFile(fileData);
  };

  const handleLogout = () => {
    setWalletAddress(null);
    setActivePage('dashboard');
  };

  if (!walletAddress) {
    return <Login onConnected={addr => { setWalletAddress(addr); setActivePage('dashboard'); }} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} walletAddress={walletAddress} />;
      case 'upload':
        return <Upload walletAddress={walletAddress} onNavigate={handleNavigate} />;
      case 'verify':
        return <Verify walletAddress={walletAddress} />;
      case 'my-files':
        return <MyFiles onNavigate={handleNavigate} walletAddress={walletAddress} />;
      case 'blockchain-log':
        return <BlockchainLog />;
      case 'file-details':
        return <FileDetails file={selectedFile} onNavigate={handleNavigate} />;
      case 'alerts':
        return <Alerts walletAddress={walletAddress} onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile walletAddress={walletAddress} onLogout={handleLogout} />;
      default:
        return <Dashboard onNavigate={handleNavigate} walletAddress={walletAddress} />;
    }
  };

  return (
    <div className="app">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} walletAddress={walletAddress} onLogout={handleLogout} />
      <div className="main">
        <Topbar walletAddress={walletAddress} />
        <div className="page">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
