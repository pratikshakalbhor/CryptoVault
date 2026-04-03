import { motion } from 'framer-motion';
import '../styles/Sidebar.css';
import { slideLeft, staggerContainer, cardVariants } from '../utils/animations';

const Icons = {
  dashboard:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  upload:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  verify:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  files:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  blockchain: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>,
  profile:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: Icons.dashboard  },
  { id: 'upload',     label: 'Upload & Seal',  icon: Icons.upload     },
  { id: 'verify',     label: 'Verify File',    icon: Icons.verify     },
  { id: 'files',      label: 'My Files',       icon: Icons.files      },
  { id: 'blockchain', label: 'Blockchain Log', icon: Icons.blockchain },
];

const ACCOUNT_NAV = [
  { id: 'profile', label: 'My Profile', icon: Icons.profile },
];

export default function Sidebar({ activePage, onNavigate, onLogout, walletAddress }) {
  const shortAddr = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : '';

  return (
    <motion.aside className="sidebar" variants={slideLeft} initial="initial" animate="animate">

      {/* Logo */}
      <motion.div className="logo" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
        <motion.div className="logo-icon" whileHover={{ rotate:[0,-8,8,0], scale:1.05 }} transition={{ duration:0.4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </motion.div>
        <div>
          <div className="logo-text">CryptoVault</div>
          <div className="logo-sub">Integrity Verified</div>
        </div>
      </motion.div>

      {/* Main Nav */}
      <nav className="nav">
        <div className="nav-section">Main Menu</div>
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {NAV_ITEMS.map((item) => (
            <motion.div
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              variants={cardVariants}
              whileHover={{ x: 4, backgroundColor: activePage === item.id ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.04)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(item.id)}
            >
              <motion.span className="nav-icon"
                animate={activePage === item.id ? { color: 'var(--accent)' } : { color: 'var(--muted)' }}>
                {item.icon}
              </motion.span>
              <span>{item.label}</span>
              {activePage === item.id && (
                <motion.span className="nav-active-dot" layoutId="activeDot" initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:400, damping:20 }} />
              )}
            </motion.div>
          ))}
        </motion.div>

        <div className="nav-section" style={{ marginTop:8 }}>Account</div>
        {ACCOUNT_NAV.map(item => (
          <motion.div
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            whileHover={{ x:4 }} whileTap={{ scale:0.98 }}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {activePage === item.id && (
              <motion.span className="nav-active-dot" layoutId="activeDot" />
            )}
          </motion.div>
        ))}
      </nav>

      {/* Bottom */}
      <motion.div className="sidebar-bottom" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}>

        {/* Chain Status */}
        <div className="chain-status">
          <div className="chain-status-row">
            <motion.span className="chain-dot" animate={{ scale:[1,1.3,1], opacity:[1,0.5,1] }} transition={{ duration:2, repeat:Infinity }} />
            <span className="chain-text">Sepolia Testnet</span>
          </div>
          <div className="chain-network">Network Connected</div>
        </div>

        {/* Wallet Info */}
        <motion.div className="wallet-info" whileHover={{ borderColor:'var(--accent)' }}>
          <div className="wallet-info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <div className="wallet-info-details">
            <div className="wallet-info-label">Connected Wallet</div>
            <div className="wallet-info-address">{shortAddr}</div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button className="logout-btn"
          whileHover={{ x:3, backgroundColor:'rgba(255,59,92,0.12)' }}
          whileTap={{ scale:0.97 }}
          onClick={onLogout}>
          <span className="logout-icon">{Icons.logout}</span>
          <span>Disconnect Wallet</span>
        </motion.button>

      </motion.div>
    </motion.aside>
  );
}
