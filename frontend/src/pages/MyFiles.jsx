














import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFiles } from '../utils/api';
import {
  Activity, AlertTriangle, CheckCircle, ExternalLink,
  FileText, RefreshCw, Search, ShieldCheck, X, Share2, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ShareModal from '../components/ShareModal';

// ── Helpers ──────────────────────────────────────────────────────────
const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

const fmtDate = dt =>
  dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';


function StatusBadge({ status, isExpired }) {
  const s = (status || '').toLowerCase();
  if (isExpired) return (
    <span className="badge" style={{ background: 'rgba(252,165,165,0.1)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <AlertTriangle size={11} /> EXPIRED
    </span>
  );
  if (s === 'valid') return (
    <span className="badge" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent-teal)', border: '1px solid rgba(0,200,150,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <CheckCircle size={11} /> VALID
    </span>
  );
  if (s === 'tampered') return (
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
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [shareFile, setShareFile] = useState(null); // file being shared in modal
  const [processing, setProcessing] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllFiles(walletAddress);
      setFiles(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleTrashFile = async (fileId) => {
    if (!window.confirm("Move this file to trash?")) return;
    setProcessing(fileId);
    try {
      // We need to import trashFile from api.js first
      const { trashFile } = await import('../utils/api');
      await trashFile(fileId);
      toast.success("File moved to trash");
      await fetchFiles(); // Requirement #1: Remove stale UI data
    } catch (err) {
      alert(err.message || "Failed to move to trash");
    } finally {
      setProcessing(null);
    }
  };

  // ── Filter ──
  const q = query.trim().toLowerCase();
  const filtered = files.filter(f =>
    (f.fileName || f.name || '').toLowerCase().includes(q)
  );

  return (
    <div className="page-inner">
      {/* Header */}
      <div className="ph">
        <div>
          <h1>My Files</h1>
          <p>{files.length} file{files.length !== 1 ? 's' : ''} stored on blockchain</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ref-btn" onClick={() => navigate('/trash')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <Trash2 size={16} /> View Trash
          </button>
          <button className="ref-btn" onClick={fetchFiles}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
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
                const name = f.fileName || f.name || 'Unknown';
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
                      {txHash && txHash.length === 66 ? ( // Requirement #3: Validate txHash
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
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{txHash ? 'Invalid/Pending' : '—'}</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {/* Verify Button */}
                        <button
                          className="btn btn-g"
                          style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={e => { 
                            e.stopPropagation(); 
                            console.log("Navigating with fileId:", f.fileId);
                            navigate(`/verify?id=${f.fileId}`); 
                          }}
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

                        {/* Trash Button */}
                        <button
                          className="btn btn-g"
                          style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-red)' }}
                          onClick={e => { e.stopPropagation(); handleTrashFile(fileId); }}
                          disabled={processing === fileId}
                          title="Move to Trash"
                        >
                          {processing === fileId ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} />}
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
