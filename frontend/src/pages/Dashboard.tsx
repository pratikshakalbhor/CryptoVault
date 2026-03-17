interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="dashboard-grid">
      <div className="card stats-card">
        <div className="stats-header">
          <span className="stats-icon">📦</span>
          <div className="stats-info">
            <div className="stats-value">12</div>
            <div className="stats-label">Total Files Sealed</div>
          </div>
        </div>
      </div>

      <div className="card stats-card">
        <div className="stats-header">
          <span className="stats-icon">🔗</span>
          <div className="stats-info">
            <div className="stats-value">4.2 TB</div>
            <div className="stats-label">Storage Secured</div>
          </div>
        </div>
      </div>

      <div className="card full-width action-card">
        <h2>Protect Your Digital Assets</h2>
        <p>Seal your documents on the blockchain to ensure their integrity and origin.</p>
        <button className="btn-primary" onClick={() => onNavigate('upload')}>
          Start Sealing Now
        </button>
      </div>

      <div className="card half-width">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-dot success" />
            <div className="activity-content">
              <div className="activity-title">File Sealed Successfully</div>
              <div className="activity-time">2 mins ago</div>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-dot info" />
            <div className="activity-content">
              <div className="activity-title">Verification Requested</div>
              <div className="activity-time">1 hour ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
