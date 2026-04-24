import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UploadCloud,
  ShieldCheck,
  Folder,
  Activity,
  User,
  LogOut,
} from 'lucide-react';

const NAV = [
  { path: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/upload',         label: 'Upload File',    icon: UploadCloud },
  { path: '/verify',         label: 'Verify File',    icon: ShieldCheck },
  { path: '/my-files',       label: 'My Files',       icon: Folder },
  { path: '/blockchain-log', label: 'Blockchain Log', icon: Activity },
  { path: '/profile',        label: 'Profile',        icon: User },
];

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) =>
    pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo-area">
        <div className="logo-icon"><ShieldCheck size={24} /></div>
        <div>
          <div className="logo-name">BlockVerify</div>
          <div className="logo-sub">Secure File Storage</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav">
        {NAV.map(n => {
          const Icon = n.icon;
          return (
            <button
              key={n.path}
              className={`nav-btn${isActive(n.path) ? ' active' : ''}`}
              onClick={() => navigate(n.path)}
            >
              <Icon size={18} className="nav-icon" style={{ marginRight: 10 }} />
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-foot">
        <div className="net-badge" style={{ marginBottom: 10 }}>
          <span className="dot" />
          Sepolia Testnet
        </div>
        {onLogout && (
          <motion.button
            className="logout-btn"
            whileHover={{ x: 3, backgroundColor: 'rgba(255,68,68,0.10)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
          >
            <span className="logout-icon"><LogOut size={14} /></span>
            <span>Disconnect Wallet</span>
          </motion.button>
        )}
      </div>
    </aside>
  );
}