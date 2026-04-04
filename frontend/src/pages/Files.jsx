import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Files.css';
import StatusBadge from '../components/StatusBadge';
import { pageVariants, cardVariants, tableRow, fadeIn } from '../utils/animations';
import { getAllFiles, revokeFile, verifyFile } from '../utils/api';
import { getTxUrl } from '../utils/blockchain';
import ShareModal from '../components/ShareModal';

// ── SVG helpers ───────────────────────────────────────
const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UsersIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SpinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

// ── Visibility Badge ───────────────────────────────────
function VisibilityBadge({ isShared }) {
  return isShared ? (
    <span className="vis-badge vis-shared">
      <UsersIcon /> Shared
    </span>
  ) : (
    <span className="vis-badge vis-private">
      <LockIcon /> Private
    </span>
  );
}

// ── Verify Steps ──────────────────────────────────────
const VERIFY_STEPS = [
  'Reading file bytes...',
  'Generating SHA-256 hash...',
  'Fetching original hash...',
  'Comparing hashes...',
];

// ── Inline Quick Verify Panel ─────────────────────────
function QuickVerifyPanel({ file, onClose }) {
  const inputRef         = useRef(null);
  const [picked, setPicked]     = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep]         = useState(0);
  const [result, setResult]     = useState(null);
  const [err, setErr]           = useState('');

  const handleVerify = async () => {
    if (!picked) return;
    setVerifying(true); setResult(null); setErr('');
    try {
      for (let i = 1; i <= 4; i++) {
        setStep(i);
        await new Promise(r => setTimeout(r, 500));
      }
      const data = await verifyFile(picked, file.fileId);
      setResult(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setVerifying(false); setStep(0);
    }
  };

  const isValid = result?.status === 'valid';

  return (
    <motion.div
      className="qv-panel"
      variants={{ hidden: { opacity: 0, y: -8, scaleY: 0.95 }, show: { opacity: 1, y: 0, scaleY: 1 } }}
      initial="hidden" animate="show" exit="hidden"
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="qv-header">
        <div className="qv-title">
          <ShieldIcon />
          Quick Verify — <span className="qv-filename">{file.filename}</span>
        </div>
        <button className="qv-close" onClick={onClose} title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="qv-body">
        {/* Result banner */}
        {result && (
          <motion.div
            className={`qv-result ${isValid ? 'qv-valid' : 'qv-tamper'}`}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="qv-result-icon">
              {isValid
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              }
            </span>
            <div>
              <div className="qv-result-title">
                {isValid ? 'File Integrity Verified' : 'Tamper Detected!'}
              </div>
              <div className="qv-result-sub">{result.message}</div>
              {result.originalHash && (
                <div className="qv-hashes">
                  <div className="qv-hash-row">
                    <span className="qv-hash-label">Original</span>
                    <span className="qv-hash-val">{result.originalHash?.substring(0, 28)}…</span>
                  </div>
                  <div className="qv-hash-row">
                    <span className="qv-hash-label">Current&nbsp;</span>
                    <span className={`qv-hash-val ${result.isMatch ? 'hash-match' : 'hash-mismatch'}`}>
                      {result.currentHash?.substring(0, 28)}…
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Error */}
        {err && !result && (
          <div className="qv-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {err}
          </div>
        )}

        {/* File picker + Steps + Action */}
        {!result && (
          <>
            {/* File picker */}
            <div className="qv-pick-row">
              <input ref={inputRef} type="file" style={{ display: 'none' }}
                onChange={e => setPicked(e.target.files?.[0] ?? null)} />
              <motion.button
                className={`qv-pick-btn ${picked ? 'qv-pick-selected' : ''}`}
                onClick={() => inputRef.current?.click()}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                {picked
                  ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> {picked.name}</>
                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> Upload same file to verify</>
                }
              </motion.button>

              <motion.button
                className="btn btn-primary sm"
                disabled={!picked || verifying}
                whileHover={picked && !verifying ? { scale: 1.03 } : {}}
                whileTap={{ scale: 0.97 }}
                onClick={handleVerify}>
                {verifying ? <><SpinIcon /> Verifying…</> : <><ShieldIcon /> Verify Now</>}
              </motion.button>
            </div>

            {/* Progress steps */}
            {verifying && (
              <div className="qv-steps">
                {VERIFY_STEPS.map((s, i) => (
                  <div key={i} className={`qv-step ${step > i ? 'done' : step === i + 1 ? 'active' : ''}`}>
                    <span className="qv-step-dot">
                      {step > i + 1
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : step === i + 1
                          ? <SpinIcon />
                          : <span className="qv-step-circle" />
                      }
                    </span>
                    <span className="qv-step-label">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* After result — reset */}
        {result && (
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-outline sm" onClick={() => { setResult(null); setPicked(null); setErr(''); }}>
              Verify Again
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Files page ────────────────────────────────────
export default function Files({ onNavigate, walletAddress }) {
  const [files,       setFiles]       = useState([]);
  const [shareFile,   setShareFile]   = useState(null); // null = modal closed
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(null);  // detail panel fileId
  const [revoking,    setRevoking]    = useState('');
  const [downloading, setDownloading] = useState('');
  const [qvFileId,    setQvFileId]    = useState(null);  // quick-verify panel fileId

  const fetchFiles = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllFiles(walletAddress);
      setFiles(res.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { if (walletAddress) fetchFiles(); }, [fetchFiles, walletAddress]);

  // ── Download ──
  const handleDownload = async (file) => {
    setDownloading(file.fileId);
    try {
      if (file.encryptedUrl && file.encryptedUrl !== '') {
        const link = document.createElement('a');
        link.href = file.encryptedUrl; link.download = file.filename;
        link.target = '_blank'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link);
      } else {
        const blob = new Blob([JSON.stringify({
          fileId: file.fileId, filename: file.filename,
          originalHash: file.originalHash, txHash: file.txHash,
          status: file.status, uploadedAt: file.uploadedAt,
          walletAddress: file.walletAddress,
          note: 'Encrypted file is stored on Cloudinary. Use txHash to verify on Etherscan.',
        }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `${file.filename}_info.json`;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
      }
    } catch (err) { alert('Download failed: ' + err.message); }
    finally { setDownloading(''); }
  };

  // ── Revoke ──
  const handleRevoke = async (fileId) => {
    if (!window.confirm('Revoke this file?')) return;
    setRevoking(fileId);
    try {
      await revokeFile(fileId); await fetchFiles();
      alert('✅ File revoked successfully!');
    } catch (err) { alert('Revoke failed: ' + err.message); }
    finally { setRevoking(''); }
  };

  // ── Toggle quick-verify panel ──
  const toggleQV = (fileId, e) => {
    e.stopPropagation();
    setQvFileId(prev => prev === fileId ? null : fileId);
  };

  const formatSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  const filtered = files.filter(f => {
    const matchFilter = filter === 'all' || f.status === filter;
    const matchSearch = f.filename?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = (s) => s === 'all' ? files.length : files.filter(f => f.status === s).length;

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 13 }}>
            Loading files...
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Controls */}
      <div className="files-controls">
        <div className="search-bar-wrapper">
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input className="search-input" type="text" placeholder="Search files..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs">
          {['all', 'valid', 'tampered', 'pending', 'revoked'].map(f => (
            <button key={f}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'} sm`}
              onClick={() => setFilter(f)}
              style={{ fontSize: 11, textTransform: 'uppercase' }}>
              {f} ({count(f)})
            </button>
          ))}
        </div>
        <motion.button className="btn btn-outline sm" whileHover={{ scale: 1.02 }} onClick={fetchFiles}>↺</motion.button>
        <motion.button className="btn btn-primary" whileHover={{ scale: 1.02 }} onClick={() => onNavigate('upload')}>+ Upload</motion.button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)',
          borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--red)',
          fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red)"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {error}
          </span>
          <button className="btn btn-outline sm" onClick={fetchFiles}>Retry</button>
        </div>
      )}

      {/* Table */}
      <motion.div className="files-section" variants={cardVariants} initial="initial" animate="animate">
        <div className="files-header">
          <span className="section-title">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>No files found</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Upload your first file</div>
            <button className="btn btn-primary" onClick={() => onNavigate('upload')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginRight: 6, verticalAlign: 'middle' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Upload &amp; Seal
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Hash</th>
                <th>Uploaded</th>
                <th>Status</th>
                {/* ── NEW column ── */}
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => {
                const isShared = Array.isArray(f.sharedWith) && f.sharedWith.length > 0;
                const isQVOpen = qvFileId === f.fileId;

                return (
                  <React.Fragment key={f.fileId || i}>
                    <motion.tr
                      variants={tableRow} initial="initial" animate="animate"
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelected(selected === f.fileId ? null : f.fileId)}
                      style={{
                        cursor: 'pointer',
                        background: selected === f.fileId
                          ? 'rgba(0,212,255,0.04)'
                          : isQVOpen
                            ? 'rgba(0,212,255,0.02)'
                            : 'transparent',
                      }}>

                      {/* Name */}
                      <td>
                        <div className="file-row-name">
                          <span className={`file-type-badge badge-${f.filename?.split('.').pop()}`}>
                            {f.filename?.split('.').pop()?.toUpperCase()}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{f.filename}</span>
                        </div>
                      </td>

                      <td><span className="mono-text">{formatSize(f.fileSize)}</span></td>
                      <td><span className="hash-text">{f.originalHash?.substring(0, 14)}…</span></td>
                      <td><span className="mono-text">{new Date(f.uploadedAt).toLocaleDateString()}</span></td>
                      <td><StatusBadge status={f.status} /></td>

                      {/* ── Visibility cell ── */}
                      <td onClick={e => e.stopPropagation()}>
                        <VisibilityBadge isShared={isShared} />
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>

                          {/* Quick Verify */}
                          <motion.button
                            className={`btn sm qv-trigger-btn ${isQVOpen ? 'qv-open' : ''}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={e => toggleQV(f.fileId, e)}
                            title="Quick Verify">
                            <ShieldIcon />
                            {isQVOpen ? 'Close' : 'Verify'}
                          </motion.button>

                          {/* Download */}
                          <motion.button
                            className="btn btn-outline sm"
                            style={{ fontSize: 11, color: 'var(--accent)', borderColor: 'rgba(0,212,255,0.3)' }}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,212,255,0.08)' }}
                            whileTap={{ scale: 0.95 }}
                            disabled={downloading === f.fileId}
                            onClick={() => handleDownload(f)}
                            title="Download">
                            {downloading === f.fileId
                              ? <SpinIcon />
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            }
                          </motion.button>

                          {/* Share */}
                          <button
                            onClick={() => setShareFile(f)}
                            style={{
                              padding:'5px 10px', fontSize:12,
                              borderRadius:'var(--border-radius-md)',
                              border:'0.5px solid var(--color-border-secondary)',
                              background:'var(--color-background-secondary)',
                              color:'var(--color-text-primary)', cursor:'pointer'
                            }}
                          >
                            Share
                          </button>

                          {/* Revoke */}
                          {f.status !== 'revoked' && (
                            <motion.button
                              className="btn btn-danger sm"
                              style={{ fontSize: 11 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={revoking === f.fileId}
                              onClick={() => handleRevoke(f.fileId)}>
                              {revoking === f.fileId
                                ? <SpinIcon />
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                              } Revoke
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>

                    {/* ── Quick Verify Panel — inlined as a full-width row ── */}
                    <AnimatePresence>
                      {isQVOpen && (
                        <tr key={`qv-${f.fileId}`} className="qv-row">
                          <td colSpan={7} style={{ padding: 0, border: 'none' }}>
                            <QuickVerifyPanel file={f} onClose={() => setQvFileId(null)} />
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* File Detail Panel */}
      {selected && (() => {
        const f = files.find(x => x.fileId === selected);
        if (!f) return null;
        return (
          <motion.div className="section-card" variants={fadeIn} initial="initial" animate="animate">
            <div className="section-header">
              <span className="section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  style={{ marginRight: 8, verticalAlign: 'middle' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {f.filename}
              </span>
              <button className="btn btn-outline sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="file-detail-grid">
              {[
                { label: 'File ID',        value: f.fileId },
                { label: 'SHA-256 Hash',   value: f.originalHash },
                { label: 'TX Hash',        value: f.txHash },
                { label: 'File Size',      value: formatSize(f.fileSize) },
                { label: 'Status',         value: f.status?.toUpperCase() },
                { label: 'Visibility',     value: Array.isArray(f.sharedWith) && f.sharedWith.length > 0 ? `Shared (${f.sharedWith.length})` : 'Private' },
                { label: 'Uploaded At',    value: new Date(f.uploadedAt).toLocaleString() },
                { label: 'Wallet Address', value: f.walletAddress },
                { label: 'Encrypted URL', value: f.encryptedUrl?.startsWith('http') ? <a href={f.encryptedUrl} target="_blank" rel="noreferrer" style={{color: 'var(--accent)', textDecoration: 'none'}}>View File ↗</a> : <span style={{color: 'var(--muted)'}}>Encrypted (local)</span> },
              ].map((item, i) => (
                <div key={i} className="file-detail-item">
                  <div className="file-detail-label">{item.label}</div>
                  <div className="file-detail-value" style={{ wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <motion.button className="btn btn-primary sm" whileHover={{ scale: 1.02 }} onClick={() => handleDownload(f)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Info
              </motion.button>
              {f.txHash && f.txHash !== 'pending' && (
                <motion.a href={getTxUrl(f.txHash)} target="_blank" rel="noreferrer"
                  className="btn btn-outline sm" style={{ textDecoration: 'none' }}
                  whileHover={{ scale: 1.02 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>
                  View on Etherscan ↗
                </motion.a>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* Share Modal */}
      {shareFile && (
        <ShareModal
          file={shareFile}
          onClose={() => setShareFile(null)}
          onSuccess={(msg) => {
            setShareFile(null);
            alert(msg); // ya tumcha toast notification vaprto
          }}
        />
      )}

    </motion.div>
  );
}