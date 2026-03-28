import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../styles/Files.css';
import StatusBadge from '../components/StatusBadge';
import { pageVariants, cardVariants, tableRow, fadeIn } from '../utils/animations';
import { getAllFiles, revokeFile } from '../utils/api';

export default function Files({ onNavigate, walletAddress }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [revoking, setRevoking] = useState('');

  const fetchFiles = useCallback(async () => {
    if (!walletAddress) return;
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
    fetchFiles();
  }, [fetchFiles]);

  const handleRevoke = async (fileId) => {
    if (!window.confirm('Are you sure you want to revoke this file?')) return;
    setRevoking(fileId);
    try {
      await revokeFile(fileId);
      await fetchFiles(); // Refresh
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
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
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
          <span className="search-icon">🔍</span>
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
        <div style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
          ⚠️ {error} <button className="btn btn-outline sm" onClick={fetchFiles} style={{ marginLeft: 12 }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <motion.div className="files-section" variants={cardVariants} initial="initial" animate="animate">
        <div className="files-header">
          <span className="section-title">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>No files found</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Upload your first file</div>
            <button className="btn btn-primary" onClick={() => onNavigate('upload')}>🔒 Upload & Seal</button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th><th>Size</th><th>SHA-256 Hash</th>
                <th>Uploaded</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <motion.tr key={f.fileId}
                  variants={tableRow} initial="initial" animate="animate"
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
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline sm"
                        onClick={e => { e.stopPropagation(); onNavigate('verify'); }}>
                        Verify
                      </button>
                      {f.status !== 'revoked' && (
                        <button className="btn btn-danger sm"
                          disabled={revoking === f.fileId}
                          onClick={e => { e.stopPropagation(); handleRevoke(f.fileId); }}>
                          {revoking === f.fileId ? '...' : 'Revoke'}
                        </button>
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
              <span className="section-title">📄 {f.filename}</span>
              <button className="btn btn-outline sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="file-detail-grid">
              {[
                { label: 'File ID', value: f.fileId },
                { label: 'SHA-256 Hash', value: f.originalHash },
                { label: 'TX Hash', value: f.txHash },
                { label: 'File Size', value: formatSize(f.fileSize) },
                { label: 'Status', value: f.status.toUpperCase() },
                { label: 'Uploaded At', value: new Date(f.uploadedAt).toLocaleString() },
                { label: 'Wallet Address', value: f.walletAddress },
                { label: 'Encrypted URL', value: f.encryptedUrl || '—' },
              ].map((item, i) => (
                <div key={i} className="file-detail-item">
                  <div className="file-detail-label">{item.label}</div>
                  <div className="file-detail-value">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

    </motion.div>
  );
}