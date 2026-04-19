import { useState, useEffect, useCallback } from 'react';
import { getAllFiles, getStats } from '../utils/api';

const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

function hashPill(hash) {
  if (!hash) return '—';
  return (
    <span className="hash-p">{hash.slice(0, 8)}...{hash.slice(-6)}</span>
  );
}

export default function Dashboard({ onNavigate, walletAddress }) {
  const [files,  setFiles]  = useState([]);
  const [stats,  setStats]  = useState({ total: 0, valid: 0, tampered: 0 });
  const [loading, setLoading] = useState(true);
  const [error,  setError]  = useState('');

  const totalBytes  = files.reduce((a, f) => a + (f.fileSize || 0), 0);
  const storagePct  = Math.min(Math.round((totalBytes / (500 * 1024 * 1024)) * 100), 100);
  const integrityPct = stats.total > 0
    ? Math.round((stats.valid / stats.total) * 100)
    : 0;

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [filesRes, statsRes] = await Promise.all([
        getAllFiles(walletAddress),
        getStats(),
      ]);
      setFiles(filesRes.files || []);
      const s = statsRes.stats || statsRes || {};
      setStats({ total: s.total || 0, valid: s.valid || 0, tampered: s.tampered || 0 });
    } catch (err) {
      setError(err.message || 'Failed to reach backend');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="page-inner">
        <div className="loading-center">
          <div className="spin-ring" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page-inner">
      <div className="ph">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your blockchain file registry</p>
        </div>
        <button className="ref-btn" onClick={fetchData}>⟳ Refresh</button>
      </div>

      {error && (
        <div className="error-box">⚠️ {error} — make sure the Go backend is running on port 5000.</div>
      )}

      {/* ── Stats ── */}
      <div className="stats">
        <div className="stat">
          <div className="stat-ico ico-blue">📄</div>
          <div>
            <div className="stat-val">{stats.total}</div>
            <div className="stat-lbl">Total Files</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-ico ico-green">✅</div>
          <div>
            <div className="stat-val">{stats.valid}</div>
            <div className="stat-lbl">Valid Files</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-ico ico-red">⚠️</div>
          <div>
            <div className="stat-val">{stats.tampered}</div>
            <div className="stat-lbl">Tampered</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-ico ico-purple">📈</div>
          <div>
            <div className="stat-val">{integrityPct}%</div>
            <div className="stat-lbl">Integrity Score</div>
            <div className="stat-sub">File integrity rate</div>
          </div>
        </div>
      </div>

      {/* ── Progress bars ── */}
      <div className="two-col">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>📈 Integrity Score</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-teal)' }}>{integrityPct}%</span>
          </div>
          <div className="progress">
            <div className="progress-fill fill-green" style={{ width: `${integrityPct}%` }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {stats.valid} valid · {stats.tampered} tampered · {stats.total} total
          </p>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>💾 Storage Used</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)' }}>{storagePct}%</span>
          </div>
          <div className="progress">
            <div className="progress-fill fill-cyan" style={{ width: `${storagePct}%` }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {fmtSize(totalBytes)} used of 500 MB
          </p>
        </div>
      </div>

      {/* ── Quick action cards ── */}
      <div className="actions-row">
        <div className="ac" onClick={() => onNavigate('upload')}>
          <div className="ac-l">
            <span className="ac-ico">⬆️</span>
            <div className="ac-t">
              <h3>Upload File</h3>
              <p>Store &amp; hash on blockchain</p>
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
        </div>
        <div className="ac grn" onClick={() => onNavigate('verify')}>
          <div className="ac-l">
            <span className="ac-ico">✅</span>
            <div className="ac-t">
              <h3>Verify File</h3>
              <p>Check file integrity</p>
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
        </div>
      </div>

      {/* ── Recent Files ── */}
      <div className="card">
        <div className="sec-hdr">
          <span className="sec-title">🕐 Recent Files</span>
          <button className="view-all" onClick={() => onNavigate('my-files')}>View all →</button>
        </div>
        {files.length === 0 ? (
          <div className="empty">No files uploaded yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Hash</th>
                <th>Size</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {files.slice(0, 5).map(f => {
                const isExpired = f.isExpired || (f.expiryDate && new Date(f.expiryDate) < new Date());
                return (
                <tr key={f.fileId || f.id} className="tr-click" onClick={() => onNavigate('file-details', f)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: isExpired ? '#fca5a5' : f.status === 'valid' ? 'var(--accent-teal)' : 'var(--accent-red)',
                        flexShrink: 0, display: 'inline-block',
                      }} />
                      <div>
                        <div className="fname">
                          {f.filename || f.name}
                          {isExpired && <span style={{fontSize:9, color:'#fca5a5', border:'1px solid #fca5a5', padding:'1px 4px', borderRadius:4, marginLeft:6}}>EXPIRED</span>}
                        </div>
                        <div className="ftype">{f.fileType || f.type}</div>
                      </div>
                    </div>
                  </td>
                  <td>{hashPill(f.hash || f.fileHash)}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtSize(f.fileSize)}</td>
                  <td><StatusBadge status={f.status} isExpired={isExpired} /></td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, isExpired }) {
  if (isExpired) return <span className="badge b-pending" style={{ color: '#fca5a5', borderColor: '#fca5a5' }}>⚠️ Expired</span>;
  const cls = status === 'valid' ? 'b-valid' : status === 'tampered' ? 'b-tampered' : 'b-pending';
  const icon = status === 'valid' ? '✅' : status === 'tampered' ? '❌' : '⏳';
  return <span className={`badge ${cls}`}>{icon} {status}</span>;
}