import '../styles/Profile.css';

export default function Profile({ walletAddress, onNavigate }) {
  return (
    <div className="page-container">
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">My Profile</span>
          <span className="section-badge">Verified Member</span>
        </div>

        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--surface-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', border: '1px solid var(--border)'
            }}>
              {walletAddress
                ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              }
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>Welcome</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '14px' }}>
                {walletAddress || 'Wallet not connected'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
              Go to Dashboard
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('files')}>
              View My Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
