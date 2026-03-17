import { useState } from 'react';
import './styles/global.css';
import Sidebar from './components/Sidebar';
import Topbar  from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Verify from './pages/Verify';
import Files from './pages/Files';
import BlockchainLog from './pages/BlockchainLog';

const NAV_LABELS: Record<string, string> = {
  dashboard:  'Dashboard',
  upload:     'Upload & Seal',
  verify:     'Verify File',
  files:      'My Files',
  blockchain: 'Blockchain Log',
};

export default function App() {
  const [activePage, setActivePage]     = useState('dashboard');
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);

  const showNotif = (msg: string, type: string) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <>
      <div className="grid-bg" />
      <div className="noise"   />
      <div className="app">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="main">
          <Topbar pageTitle={NAV_LABELS[activePage]} />
          <div className="content">
            {activePage === 'dashboard'  && <Dashboard     onNavigate={setActivePage} />}
            {activePage === 'upload'     && <Upload        onNotify={showNotif} />}
            {activePage === 'verify'     && <Verify        onNotify={showNotif} />}
            {activePage === 'files'      && <Files         onNavigate={setActivePage} />}
            {activePage === 'blockchain' && <BlockchainLog />}
          </div>
        </main>
      </div>
      {notification && (
        <div className={`notification ${notification.type}`}>{notification.msg}</div>
      )}
    </>
  );
}