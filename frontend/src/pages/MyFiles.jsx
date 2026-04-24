import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFiles } from '../utils/api';
import {
  Activity, AlertTriangle, CheckCircle, Copy, ExternalLink,
  FileText, RefreshCw, Search, ShieldCheck, X
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────
const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

const fmtDate = dt =>
  dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function hashPill(hash) {
  if (!hash) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return (
    <span className="hash-p" title={hash}>
      {hash.slice(0, 8)}...{hash.slice(-6)}
    </span>
  );
}

function StatusBadge({ status, isExpired }) {
  if (isExpired) return (
    <span className="badge" style={{ background: 'rgba(252,165,165,0.1)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <AlertTriangle size={11} /> EXPIRED
    </span>
  );
  if (status === 'valid') return (
    <span className="badge" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent-teal)', border: '1px solid rgba(0,200,150,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <CheckCircle size={11} /> VALID
    </span>
  );
  if (status === 'tampered') return (
    <span className="badge" style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <AlertTriangle size={11} /> TAMPERED
    </span>
  );
  return (
    <span className="badge" style={{ background: 'rgba(255,140,66,0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(255,140,66,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Activity size={11} /> NOT_SYNCED
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────
export default function MyFiles({ walletAddress }) {
  const navigate = useNavigate();
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [query,   setQuery]   = useState('');
  const [copiedId, setCopiedId] = useState(null); // tracks which file link was copied

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

  // ── Share: copy public verify URL to clipboard ──
  const handleShare = (e, f) => {
    e.stopPropagation();
    const publicId = f.publicId || f.fileId || f.id;
    const url = `${window.location.origin}/verify-public/${publicId}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(f.fileId || f.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Filter ──
  const q = query.toLowerCase();
  const filtered = files.filter(f =>
    (f.filename || f.name || '').toLowerCase().includes(q) ||
    (f.hash || f.fileHash || '').toLowerCase().includes(q)
  );

  return (
    <div className="page-inner">
      {/* Header */}
      <div className="ph">
        <div>
          <h1>My Files</h1>
          <p>{files.length} file{files.length !== 1 ? 's' : ''} stored on blockchain</p>
        </div>
        <button className="ref-btn" onClick={fetchFiles}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div className="error-box"><AlertTriangle size={16} /> {error}</div>}

      {/* Search */}
      <div className="search-bar">
        <span style={{ color: 'var(--text-muted)' }}><Search size={16} /></span>
        <input
          placeholder="Search by filename or hash..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center"><div className="spin-ring" />Loading files...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Date</th>
                <th>Status</th>
                <th>TX Hash</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    {query ? 'No files match your search.' : 'No files uploaded yet.'}
                  </td>
                </tr>
              ) : filtered.map(f => {
                const fileId   = f.fileId || f.id;
                const name     = f.filename || f.name || 'Unknown';
                const txHash   = f.txHash || '';
                const isExpired = f.isExpired || (f.expiryDate && new Date(f.expiryDate) < new Date());
                const isCopied = copiedId === fileId;

                return (
                  <tr key={fileId} className="tr-click" onClick={() => navigate(`/files/${fileId}`)}>
                    {/* Filename */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={15} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                        <div>
                          <div className="fname">{name.length > 28 ? name.slice(0, 25) + '...' : name}</div>
                          <div className="ftype" style={{ fontSize: 10 }}>{f.fileType || f.type || '—'} · {fmtSize(f.fileSize)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(f.uploadedAt)}
                    </td>

                    {/* Status Badge */}
                    <td><StatusBadge status={f.status} isExpired={isExpired} /></td>

                    {/* TX Hash — clickable Etherscan link */}
                    <td>
                      {txHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${txHash}`}
                          target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-purple)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {txHash.slice(0, 8)}...{txHash.slice(-6)}
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {/* Verify Button */}
                        <button
                          className="btn btn-g"
                          style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={e => { e.stopPropagation(); navigate(`/verify?id=${fileId}`); }}
                          title="Verify this file"
                        >
                          <ShieldCheck size={13} /> Verify
                        </button>

                        {/* Share Button — copies public link */}
                        <button
                          className="btn btn-g"
                          style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, color: isCopied ? 'var(--accent-teal)' : undefined }}
                          onClick={e => handleShare(e, f)}
                          title="Copy public verification link"
                        >
                          <Copy size={13} /> {isCopied ? 'Copied!' : 'Share'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
          Showing {filtered.length} of {files.length} file{files.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
