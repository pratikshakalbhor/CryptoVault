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
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="logo-area">
        <div className="logo-icon">🛡️</div>
        <div>
          <div className="logo-name">BlockVerify</div>
          <div className="logo-sub">Secure File Storage</div>
        </div>
      </div>

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

      <div className="sidebar-foot">
        <div className="net-badge">
          <span className="dot" />
          Sepolia Testnet
        </div>
      </div>
    </aside>
  );
}