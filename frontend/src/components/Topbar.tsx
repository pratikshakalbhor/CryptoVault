import '../styles/Topbar.css';

interface TopbarProps {
  pageTitle: string;
  walletAddress: string;
  onDisconnect: () => void;
}

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export default function Topbar({ pageTitle, walletAddress, onDisconnect }: TopbarProps) {
  const shortAddress = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : '';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="page-title">{pageTitle}</div>
        <div className="page-breadcrumb">CryptoVault / {pageTitle}</div>
      </div>

      <div className="topbar-right">
        {/* Notification Bell */}
        <button className="topbar-icon-btn">
          <BellIcon />
          <span className="notif-dot" />
        </button>

        {/* Wallet Badge */}
        <div className="wallet-badge">
          <span className="wallet-badge-dot" />
          🦊 {shortAddress}
        </div>

        {/* Avatar + Disconnect */}
        <div className="avatar-wrapper" title="Click to disconnect" onClick={onDisconnect}>
          <div className="avatar">
            {walletAddress ? walletAddress.substring(2, 4).toUpperCase() : 'CV'}
          </div>
          <div className="avatar-tooltip">Disconnect Wallet</div>
        </div>
      </div>
    </div>
  );
}