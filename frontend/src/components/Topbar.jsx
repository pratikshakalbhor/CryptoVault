import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';
import { Sun, Moon } from 'lucide-react';

export default function Topbar({ walletAddress, title }) {
  const { theme, toggleTheme } = useTheme();
  const short = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  return (
    <header className="navbar">
      {/* Page Title */}
      <div className="topbar-title">
        {title}
      </div>

      <div className="topbar-actions">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notification Bell */}
        <NotificationDropdown walletAddress={walletAddress} />

        {/* Divider */}
        <div className="topbar-divider" />

        {/* Wallet Chip */}
        <div className="wallet-chip">
          <span className="wallet-status-dot">●</span>
          <span className="wallet-addr-text">{short}</span>
        </div>
      </div>
    </header>
  );
}