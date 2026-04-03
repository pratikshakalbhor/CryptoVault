import '../styles/NotFound.css';

export default function NotFound({ onNavigate }) {
  return (
    <div className="notfound-page">

      <div className="notfound-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </div>

      <div className="notfound-code">404</div>

      <div className="notfound-title">Page Not Found</div>

      <div className="notfound-sub">
        The page you're looking for doesn't exist or has been moved.{'\n'}
        Your blockchain records are still safe!
      </div>

      <div className="notfound-actions">
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('dashboard')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:7,verticalAlign:'middle'}}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Go to Dashboard
        </button>
        <button
          className="btn btn-outline"
          onClick={() => onNavigate('upload')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:7,verticalAlign:'middle'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload File
        </button>
      </div>

    </div>
  );
}
