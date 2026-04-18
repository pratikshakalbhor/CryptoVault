import { useState } from 'react';
import './index.css';

import Sidebar      from './components/Sidebar';
import Topbar       from './components/Topbar';
import Dashboard    from './pages/Dashboard';
import Upload       from './pages/Upload';
import Verify       from './pages/Verify';
import MyFiles      from './pages/MyFiles';
import BlockchainLog from './pages/BlockchainLog';
import FileDetails  from './pages/FileDetails';

const WALLET = '0xf34a8b2c9e1d7f4a0b3c6e9d2f5a8c1e4b7d0f3';

export default function App() {
  const [activePage, setActivePage]     = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleNavigate = (page, fileData) => {
    setActivePage(page);
    if (fileData) setSelectedFile(fileData);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} walletAddress={WALLET} />;
      case 'upload':
        return <Upload walletAddress={WALLET} onNavigate={handleNavigate} />;
      case 'verify':
        return <Verify walletAddress={WALLET} />;
      case 'my-files':
        return <MyFiles onNavigate={handleNavigate} walletAddress={WALLET} />;
      case 'blockchain-log':
        return <BlockchainLog />;
      case 'file-details':
        return <FileDetails file={selectedFile} onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} walletAddress={WALLET} />;
    }
  };

  return (
    <div className="app">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="main">
        <Topbar walletAddress={WALLET} />
        <div className="page">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
