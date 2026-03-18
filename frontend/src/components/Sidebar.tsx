import '../styles/Sidebar.css';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  walletAddress: string;
}

const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  verify: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  files: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  blockchain: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/>
      <rect x="16" y="7" width="6" height="6" rx="1"/>
      <line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: Icons.dashboard  },
  { id: 'upload',     label: 'Upload & Seal',  icon: Icons.upload     },
  { id: 'verify',     label: 'Verify File',    icon: Icons.verify     },
  { id: 'files',      label: 'My Files',       icon: Icons.files      },
  { id: 'blockchain', label: 'Blockchain Log', icon: Icons.blockchain },
];

export default function Sidebar({ activePage, onNavigate, onLogout, walletAddress }: SidebarProps) {
  const shortAddr = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : '';

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">🔐</div>
        <div className="logo-text">CryptoVault</div>
        <div className="logo-sub">Integrity Verified</div>
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-section">Main Menu</div>
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {activePage === item.id && <span className="nav-active-dot" />}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">

        {/* Chain Status */}
        <div className="chain-status">
          <div className="chain-status-row">
            <span className="chain-dot" />
            <span className="chain-text">Sepolia Testnet</span>
          </div>
          <div className="chain-network">Network Connected</div>
        </div>

        {/* Wallet Info */}
        <div className="wallet-info">
          <div className="wallet-info-icon">🦊</div>
          <div className="wallet-info-details">
            <div className="wallet-info-label">Connected Wallet</div>
            <div className="wallet-info-address">{shortAddr}</div>
          </div>
        </div>

        {/* Logout */}
        <button className="logout-btn" onClick={onLogout}>
          <span className="logout-icon">{Icons.logout}</span>
          <span>Disconnect Wallet</span>
        </button>

      </div>
    </aside>
  );
}