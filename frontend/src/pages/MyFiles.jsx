import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFiles } from '../utils/api';
import {
  Activity, AlertTriangle, CheckCircle, Copy, ExternalLink,
  FileText, RefreshCw, Search, ShieldCheck, X, QrCode, Share2
} from 'lucide-react';
import QRCode from 'react-qr-code';

// ── Helpers ──────────────────────────────────────────────────────────
const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

const fmtDate = dt =>
  dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';


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

// ── Share Modal with QR Code ──────────────────────────────────────────
function ShareModal({ file, onClose }) {
  const [copied, setCopied] = useState(false);
  const fileId = file.publicId || file.fileId || file.id;
  const publicUrl = `${window.location.origin}/verify-public/${fileId}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: 'var(--bg-card, #0f172a)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: '32px 28px',
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,0.06)', border: 'none',
            borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'inline-flex', alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, #2DD4BF22, #6366f122)',
            border: '1px solid rgba(45,212,191,0.3)',
            borderRadius: 10, padding: '8px 10px',
            display: 'inline-flex', alignItems: 'center',
          }}>
            <QrCode size={20} style={{ color: '#2DD4BF' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Share File</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {(file.filename || file.name || 'File').length > 32
                ? (file.filename || file.name || 'File').slice(0, 29) + '...'
                : (file.filename || file.name || 'File')}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 20,
          background: '#fff', borderRadius: 14, padding: 16,
        }}>
          <QRCode
            value={publicUrl}
            size={180}
            style={{ borderRadius: 4 }}
            level="H"
          />
        </div>

        {/* Description */}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 14 }}>
          Scan the QR code or copy the link below to share this file's public verification page.
        </p>

        {/* URL + Copy */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <span style={{
            flex: 1, fontSize: 10, fontFamily: 'monospace',
            color: 'var(--text-secondary)', wordBreak: 'break-all',
          }}>
            {publicUrl}
          </span>
          <button
            onClick={handleCopy}
            style={{
              flexShrink: 0,
              background: copied ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${copied ? 'rgba(45,212,191,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8, padding: '6px 10px',
              cursor: 'pointer', color: copied ? '#2DD4BF' : 'var(--text-muted)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
            }}
          >
            <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────
export default function MyFiles({ walletAddress }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [shareFile, setShareFile] = useState(null); // file being shared in modal

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

  // ── Filter ──
  const q = query.trim().toLowerCase();
  const filtered = files.filter(f =>
    (f.filename || f.name || '').toLowerCase().includes(q)
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

      {/* ── Search Bar ── */}
      <div className="search-bar" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12, padding: '10px 16px',
        marginBottom: 14, transition: 'border-color 0.2s',
      }}>
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          placeholder="Search files by name..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 13, color: 'var(--text-primary)',
            fontFamily: 'var(--font-main)',
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex' }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center"><div className="spin-ring" />Loading files...</div>
        ) : filtered.length === 0 ? (
          /* ── Empty / No-results state ── */
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 16,
            }}>
              <Search size={24} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {q ? 'No records matching your search' : 'No files uploaded yet.'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {q
                ? `We couldn't find any files matching "${query}". Try a different name.`
                : 'Upload your first file to get started.'}
            </div>
          </div>
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
              {filtered.map(f => {
                const fileId = f.fileId || f.id;
                const name = f.filename || f.name || 'Unknown';
                const txHash = f.txHash || '';
                const isExpired = f.isExpired || (f.expiryDate && new Date(f.expiryDate) < new Date());

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

                        {/* Share Button — opens QR modal */}
                        <button
                          className="btn btn-g"
                          style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={e => { e.stopPropagation(); setShareFile(f); }}
                          title="Share public verification link"
                        >
                          <Share2 size={13} /> Share
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

      {/* Share Modal */}
      {shareFile && (
        <ShareModal file={shareFile} onClose={() => setShareFile(null)} />
      )}
    </div>
  );
}
