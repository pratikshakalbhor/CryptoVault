import NotificationDropdown from './NotificationDropdown';

export default function Topbar({ walletAddress, title, theme, toggleTheme }) {
  const short = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  return (
    <header className="navbar">
      {/* Page Title */}
      <div style={{ marginRight: 'auto', fontWeight: 600, fontSize: '15px' }}>
        {title}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '5px 11px', cursor: 'pointer',
          fontSize: '14px', color: 'var(--text-primary)', marginRight: '16px'
        }}
        title="Toggle Theme"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Notification Bell (useNavigate works now — inside BrowserRouter) */}
      <NotificationDropdown walletAddress={walletAddress} />

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 12px' }} />

      {/* Wallet Chip */}
      <div className="wallet-chip">
        <span style={{ color: 'var(--accent-teal)', fontSize: 9 }}>●</span>
        {short}
      </div>
    </header>
  );
}