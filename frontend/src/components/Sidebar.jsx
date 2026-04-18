import { motion } from 'framer-motion';

const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    svg: (
      <svg className="nav-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z" stroke="currentColor" fill="none" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'upload',
    label: 'Upload File',
    svg: (
      <svg className="nav-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 11V3M5 6l3-3 3 3" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'verify',
    label: 'Verify File',
    svg: (
      <svg className="nav-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" stroke="currentColor" fill="none" strokeWidth="1.5"/>
        <path d="M5.5 8l2 2 3-3" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'my-files',
    label: 'My Files',
    svg: (
      <svg className="nav-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="4"  x2="14" y2="4"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="2" y1="8"  x2="14" y2="8"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'blockchain-log',
    label: 'Blockchain Log',
    svg: (
      <svg className="nav-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1l6 3v4a8 8 0 01-6 7A8 8 0 012 8V4l6-3z" stroke="currentColor" fill="none" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts',
    svg: (
      <svg className="nav-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2a4 4 0 0 0-4 4v3l-2 2v1h12v-1l-2-2V6a4 4 0 0 0-4-4z" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    svg: (
      <svg className="nav-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="5" r="3" stroke="currentColor" fill="none" strokeWidth="1.5"/>
        <path d="M3 14c0-3 2.5-5 5-5s5 2 5 5" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const LogoutIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const WalletIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

export default function Sidebar({ activePage, onNavigate, walletAddress, onLogout }) {
  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo-area">
        <div className="logo-icon">🛡️</div>
        <div>
          <div className="logo-name">BlockVerify</div>
          <div className="logo-sub">Secure File Storage</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-btn${activePage === n.id ? ' active' : ''}`}
            onClick={() => onNavigate(n.id)}
          >
            {n.svg}
            {n.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-foot">
        {/* Network badge */}
        <div className="net-badge" style={{ marginBottom: 10 }}>
          <span className="dot" />
          Sepolia Testnet
        </div>

        {/* Wallet info */}
        {walletAddress && (
          <motion.div
            className="wallet-info"
            whileHover={{ borderColor: 'var(--accent-cyan)' }}
          >
            <div className="wallet-info-icon">{WalletIcon}</div>
            <div className="wallet-info-details">
              <div className="wallet-info-label">Connected Wallet</div>
              <div className="wallet-info-address">{shortAddr}</div>
            </div>
          </motion.div>
        )}

        {/* Logout */}
        {onLogout && (
          <motion.button
            className="logout-btn"
            whileHover={{ x: 3, backgroundColor: 'rgba(255,68,68,0.10)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
          >
            <span className="logout-icon">{LogoutIcon}</span>
            <span>Disconnect Wallet</span>
          </motion.button>
        )}
      </div>
    </aside>
  );
}