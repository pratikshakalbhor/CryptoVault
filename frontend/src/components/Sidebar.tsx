import '../styles/Sidebar.css';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard',  icon: '⬡', label: 'Dashboard' },
  { id: 'upload',     icon: '↑', label: 'Upload & Seal' },
  { id: 'verify',     icon: '◎', label: 'Verify File' },
  { id: 'files',      icon: '▤', label: 'My Files' },
  { id: 'blockchain', icon: '⛓', label: 'Blockchain Log' },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
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
        <div className="nav-section">Main</div>
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      {/* Chain Status */}
      <div className="chain-status">
        <span className="chain-dot" />
        <span className="chain-text">Connected</span>
        <div className="chain-network">Sepolia Testnet</div>
      </div>
    </aside>
  );
}