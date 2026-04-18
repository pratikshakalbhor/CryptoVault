import { useState, useEffect, useCallback } from 'react';
import { getAllFiles } from '../utils/api';

const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

function hashPill(hash) {
  if (!hash) return '—';
  return <span className="hash-p">{hash.slice(0, 8)}...{hash.slice(-6)}</span>;
}

function StatusBadge({ status }) {
  const cls  = status === 'valid' ? 'b-valid' : status === 'tampered' ? 'b-tampered' : 'b-pending';
  const icon = status === 'valid' ? '✅' : status === 'tampered' ? '❌' : '⏳';
  return <span className={`badge ${cls}`}>{icon} {status}</span>;
}

export default function MyFiles({ onNavigate, walletAddress }) {
  const [files,    setFiles]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [query,    setQuery]    = useState('');

  const fetchFiles = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllFiles(walletAddress);
      setFiles(res.files || []);
    } catch (err) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const q = query.toLowerCase();
  const filtered = files.filter(f =>
    (f.filename || f.name || '').toLowerCase().includes(q) ||
    (f.hash || f.fileHash || '').toLowerCase().includes(q) ||
    (f.walletAddress || '').toLowerCase().includes(q)
  );

  return (
    <div className="page-inner">
      <div className="ph">
        <div>
          <h1>My Files</h1>
          <p>{files.length} file{files.length !== 1 ? 's' : ''} stored on blockchain</p>
        </div>
        <button className="ref-btn" onClick={fetchFiles}>⟳ Refresh</button>
      </div>

      {error && <div className="error-box">⚠️ {error}</div>}

      <div className="search-bar">
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input
          placeholder="Search by name, hash, or wallet..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
          >✕</button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center"><div className="spin-ring" />Loading files...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Hash</th>
                <th>Size</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 38, color: 'var(--text-muted)' }}>
                    {query ? 'No files match your search.' : 'No files uploaded yet.'}
                  </td>
                </tr>
              ) : filtered.map(f => {
                const name = f.filename || f.name || 'Unknown';
                const hash = f.hash || f.fileHash || '';
                return (
                  <tr
                    key={f.fileId || f.id}
                    className="tr-click"
                    onClick={() => onNavigate('file-details', f)}
                  >
                    <td>
                      <div className="fname">{name.length > 30 ? name.slice(0, 27) + '...' : name}</div>
                      <div className="ftype">{f.fileType || f.type}</div>
                    </td>
                    <td>{hashPill(hash)}</td>
                    <td style={{ fontSize: 11 }}>{fmtSize(f.fileSize)}</td>
                    <td><StatusBadge status={f.status} /></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {f.uploadedAt
                        ? new Date(f.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td>
                      <span
                        className="link-ico"
                        onClick={e => { e.stopPropagation(); onNavigate('file-details', f); }}
                      >↗</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 9, textAlign: 'right' }}>
          Showing {filtered.length} of {files.length} file{files.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
