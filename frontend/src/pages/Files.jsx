import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../styles/Files.css';
import StatusBadge from '../components/StatusBadge';
import { pageVariants, cardVariants, tableRow, fadeIn } from '../utils/animations';
import { getAllFiles, revokeFile } from '../utils/api';
import { revokeFileOnBlockchain, getTxUrl } from '../utils/blockchain';

export default function Files({ onNavigate, walletAddress }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [revoking, setRevoking] = useState('');
  const [downloading, setDownloading] = useState('');

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

  useEffect(() => {
    if (walletAddress) fetchFiles();
  }, [fetchFiles, walletAddress]);

  // ── Download File ──
  const handleDownload = async (file) => {
    setDownloading(file.fileId);
    try {
      // Cloudinary URL madhe file aahe — direct download
      if (file.encryptedUrl && file.encryptedUrl !== '') {
        const link = document.createElement('a');
        link.href = file.encryptedUrl;
        link.download = file.filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // File info download karto JSON madhe
        const fileInfo = {
          fileId: file.fileId,
          filename: file.filename,
          originalHash: file.originalHash,
          txHash: file.txHash,
          status: file.status,
          uploadedAt: file.uploadedAt,
          walletAddress: file.walletAddress,
          note: 'Encrypted file is stored on Cloudinary. Use txHash to verify on Etherscan.',
        };
        const blob = new Blob([JSON.stringify(fileInfo, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.filename}_info.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Download failed: ' + err.message);
    } finally {
      setDownloading('');
    }
  };

  // ── Revoke File ──
  const handleRevoke = async (fileId) => {
    if (!window.confirm('Are you sure you want to revoke this file? This cannot be undone.')) return;
    setRevoking(fileId);
    try {
      // Revoke on blockchain first if the file was sealed to maintain ledger integrity
      const file = files.find(f => f.fileId === fileId);
      if (file && file.txHash && file.txHash !== 'pending') {
        try {
          await revokeFileOnBlockchain(fileId);
        } catch (bcErr) {
          console.warn("Blockchain revocation failed, proceeding with database revocation:", bcErr);
        }
      }
      await revokeFile(fileId);
      await fetchFiles();
    } catch (err) {
      alert('Revoke failed: ' + err.message);
    } finally {
      setRevoking('');
    }
  };

  const filtered = files.filter(f => {
    const matchFilter = filter === 'all' || f.status === filter;
    const matchSearch = f.filename?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = (s) => s === 'all' ? files.length : files.filter(f => f.status === s).length;

  const formatSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom: 12 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 13 }}>Loading files...</div>
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
        <div style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
            <div style={{ display:'flex', justifyContent:'center', marginBottom: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>No files found</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Upload your first file</div>
            <button className="btn btn-primary" onClick={() => onNavigate('upload')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Upload &amp; Seal
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th><th>Size</th><th>Hash</th>
                <th>Uploaded</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <motion.tr key={f.fileId} variants={tableRow} initial="initial" animate="animate"
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(selected === f.fileId ? null : f.fileId)}
                  style={{ cursor: 'pointer', background: selected === f.fileId ? 'rgba(0,212,255,0.04)' : 'transparent' }}>
                  <td>
                    <div className="file-row-name">
                      <span className={`file-type-badge badge-${f.filename?.split('.').pop()}`}>
                        {f.filename?.split('.').pop()?.toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{f.filename}</span>
                    </div>
                  </td>
                  <td><span className="mono-text">{formatSize(f.fileSize)}</span></td>
                  <td><span className="hash-text">{f.originalHash?.substring(0, 14)}...</span></td>
                  <td><span className="mono-text">{new Date(f.uploadedAt).toLocaleDateString()}</span></td>
                  <td><StatusBadge status={f.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>

                      {/* Download Button */}
                      <motion.button
                        className="btn btn-outline sm"
                        style={{ fontSize: 11, color: 'var(--accent)', borderColor: 'rgba(0,212,255,0.3)' }}
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,212,255,0.08)' }}
                        whileTap={{ scale: 0.95 }}
                        disabled={downloading === f.fileId}
                        onClick={() => handleDownload(f)}
                        title="Download file info">
                        {downloading === f.fileId
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        } Download
                      </motion.button>

                      {/* Verify Button */}
                      <motion.button
                        className="btn btn-outline sm"
                        style={{ fontSize: 11 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('verify')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                        Verify
                      </motion.button>

                      {/* Revoke Button */}
                      {f.status !== 'revoked' && (
                        <motion.button
                          className="btn btn-danger sm"
                          style={{ fontSize: 11 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={revoking === f.fileId}
                          onClick={() => handleRevoke(f.fileId)}>
                          {revoking === f.fileId
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          } Revoke
                        </motion.button>
                      )}

                    </div>
                  </td>
                </motion.tr>
              ))}
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {f.filename}
              </span>
              <button className="btn btn-outline sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="file-detail-grid">
              {[
                { label: 'File ID', value: f.fileId },
                { label: 'SHA-256 Hash', value: f.originalHash },
                { label: 'TX Hash', value: f.txHash },
                { label: 'File Size', value: formatSize(f.fileSize) },
                { label: 'Status', value: f.status?.toUpperCase() },
                { label: 'Uploaded At', value: new Date(f.uploadedAt).toLocaleString() },
                { label: 'Wallet Address', value: f.walletAddress },
                { label: 'Encrypted URL', value: f.encryptedUrl || '—' },
              ].map((item, i) => (
                <div key={i} className="file-detail-item">
                  <div className="file-detail-label">{item.label}</div>
                  <div className="file-detail-value" style={{ wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {/* Quick Actions in Detail */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <motion.button className="btn btn-primary sm"
                whileHover={{ scale: 1.02 }} onClick={() => handleDownload(f)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Info
              </motion.button>
              <motion.button className="btn btn-outline sm"
                whileHover={{ scale: 1.02 }} onClick={() => onNavigate('verify')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                Verify Integrity
              </motion.button>
              {f.txHash && f.txHash !== 'pending' && (
                <motion.a
                  href={getTxUrl(f.txHash)}
                  target="_blank" rel="noreferrer"
                  className="btn btn-outline sm"
                  style={{ textDecoration: 'none' }}
                  whileHover={{ scale: 1.02 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>
                  View on Etherscan ↗
                </motion.a>
              )}
            </div>
          </motion.div>
        );
      })()}

    </motion.div>
  );
}