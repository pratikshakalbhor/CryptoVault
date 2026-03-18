import { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

interface FileRecord {
  _id: string;
  name: string;
  type: string;
  size: string;
  hash: string;
  txHash: string;
  timestamp: string;
  status: 'valid' | 'tampered' | 'pending';
  encrypted: boolean;
}

interface DashboardProps { onNavigate: (page: string) => void; }

export default function Dashboard({ onNavigate }: DashboardProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [files, setFiles] = useState<FileRecord[]>([]); // MongoDB se aayega
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const totalFiles = files.length;
  const validFiles = files.filter(f => f.status === 'valid').length;
  const tamperedFiles = files.filter(f => f.status === 'tampered').length;

  const stats = [
    { label: 'Total Files', value: totalFiles.toString(), sub: 'Uploaded files', color: 'var(--accent)', cls: 'blue' },
    { label: 'Valid', value: validFiles.toString(), sub: 'Integrity intact', color: 'var(--green)', cls: 'green' },
    { label: 'Tampered', value: tamperedFiles.toString(), sub: '⚠️ Action needed', color: 'var(--red)', cls: 'red' },
    { label: 'Blockchain TXs', value: totalFiles.toString(), sub: 'On Sepolia', color: '#a78bfa', cls: 'purple' },
  ];

  return (
    <div className="page-container">

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.cls}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => onNavigate('upload')}>🔒 Upload & Seal</button>
        <button className="btn btn-outline" onClick={() => onNavigate('verify')}>◎ Verify File</button>
        <button className="btn btn-outline" onClick={() => onNavigate('blockchain')}>⛓ Blockchain Log</button>
      </div>

      {/* Recent Files */}
      <div className="files-section">
        <div className="files-header">
          <span className="section-title">Recent Files</span>
          <button className="btn btn-outline sm" onClick={() => onNavigate('files')}>View All →</button>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No files uploaded yet</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Upload your first file to get started</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('upload')}>
              🔒 Upload & Seal First File
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th><th>Size</th><th>SHA-256 Hash</th>
                <th>TX Hash</th><th>Uploaded</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {files.slice(0, 5).map((f, i) => (
                <tr key={f._id}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ background: hoveredRow === i ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                >
                  <td>
                    <div className="file-row-name">
                      <span className={`file-type-badge badge-${f.type}`}>{f.type.toUpperCase()}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</span>
                      {f.encrypted && <span>🔐</span>}
                    </div>
                  </td>
                  <td><span className="mono-text">{f.size}</span></td>
                  <td><span className="hash-text">{f.hash.substring(0, 16)}...</span></td>
                  <td><span className="tx-link">{f.txHash.substring(0, 14)}... ↗</span></td>
                  <td><span className="mono-text">{f.timestamp}</span></td>
                  <td><StatusBadge status={f.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tamper Alert — only show if tampered files exist */}
      {tamperedFiles > 0 && (
        <div className="alert-banner">
          <span>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {tamperedFiles} Tampered File{tamperedFiles > 1 ? 's' : ''} Detected!
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              File integrity compromised. Verify immediately.
            </div>
          </div>
          <button className="btn btn-danger sm" onClick={() => onNavigate('verify')}>Investigate →</button>
        </div>
      )}

    </div>
  );
}