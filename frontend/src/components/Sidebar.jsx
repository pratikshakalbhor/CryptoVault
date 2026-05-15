import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  ShieldCheck,
  Folder,
  Activity,
  User,
  LogOut,
  Archive,
  RotateCcw,
} from 'lucide-react';

const NAV = [
  { path: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/upload',         label: 'Upload File',    icon: UploadCloud },
  { path: '/verify',         label: 'Verify File',    icon: ShieldCheck },
  { path: '/my-files',       label: 'My Files',       icon: Folder },
  { path: '/archive',        label: 'Forensic Archive', icon: Archive },
  { path: '/blockchain-log', label: 'Blockchain Log', icon: Activity },
  { path: '/profile',        label: 'Profile',        icon: User },
  { path: '/recovery',       label: 'Recovery Hub',    icon: RotateCcw },
];

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) =>
    pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

  return (
    <aside className="sidebar">
      {/* Logo Area */}
      <div className="logo-area" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="logo-icon" style={{ 
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
          boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ShieldCheck size={20} color="#000" />
        </div>
        <div>
          <div className="logo-name" style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>ChainSeal</div>
          <div className="logo-sub" style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forensic Suite</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav" style={{ padding: '20px 12px', gap: 6, display: 'flex', flexDirection: 'column' }}>
        {NAV.map(n => {
          const Icon = n.icon;
          const active = isActive(n.path);
          return (
            <button
              key={n.path}
              className={`nav-btn${active ? ' active' : ''}`}
              onClick={() => navigate(n.path)}
              style={{
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                background: active ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left'
              }}
            >
              <Icon size={18} className="nav-icon" style={{ 
                marginRight: 12, 
                color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                opacity: active ? 1 : 0.7
              }} />
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Footer / Connection State */}
      <div className="sidebar-foot" style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 8, 
          padding: '8px 12px', background: 'rgba(0, 255, 163, 0.05)', 
          border: '1px solid rgba(0, 255, 163, 0.1)', borderRadius: '8px',
          fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)',
          marginBottom: 16
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-teal)', animation: 'pulse 2s infinite' }}></div>
          Network Secure
        </div>
        
        {onLogout && (
          <button
            className="logout-btn"
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px', borderRadius: '8px',
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
              background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={14} />
            <span>Terminate Session</span>
          </button>
        )}
      </div>
    </aside>
  );
}