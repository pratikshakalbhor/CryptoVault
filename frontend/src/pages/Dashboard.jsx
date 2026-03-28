import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../styles/Dashboard.css';
import StatusBadge from '../components/StatusBadge';
import { pageVariants, staggerContainer, cardVariants, tableRow, fadeIn } from '../utils/animations';
import { getAllFiles, getStats } from '../utils/api';

export default function Dashboard({ onNavigate, walletAddress }) {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, tampered: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError('');
    try {
      // Parallel API calls
      const [filesRes, statsRes] = await Promise.all([
        getAllFiles(walletAddress),
        getStats(),
      ]);

      setFiles(filesRes.files || []);
      setStats(statsRes.stats || { total: 0, valid: 0, tampered: 0, revoked: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // ── Data fetch karto ──
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    { label: 'Total Files', value: stats.total, sub: 'Uploaded files', color: 'var(--accent)', cls: 'blue' },
    { label: 'Valid', value: stats.valid, sub: 'Integrity intact', color: 'var(--green)', cls: 'green' },
    { label: 'Tampered', value: stats.tampered, sub: '⚠️ Action needed', color: 'var(--red)', cls: 'red' },
    { label: 'Revoked', value: stats.revoked, sub: 'Revoked files', color: '#a78bfa', cls: 'purple' },
  ];

  // ── Loading State ──
  if (loading) {
    return (
      <div className="page-container">
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card blue">
              <div className="skeleton skeleton-row short" style={{ height: 12, marginBottom: 12 }} />
              <div className="skeleton skeleton-row medium" style={{ height: 32, marginBottom: 8 }} />
              <div className="skeleton skeleton-row short" style={{ height: 10 }} />
            </div>
          ))}
        </div>
        <div className="section-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 13 }}>
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Error Banner */}
      {error && (
        <motion.div variants={fadeIn} initial="initial" animate="animate"
          style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: 13 }}>Backend Connection Error</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{error}</div>
          </div>
          <button className="btn btn-outline sm" onClick={fetchData}>↺ Retry</button>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div className="stats-grid" variants={staggerContainer} initial="initial" animate="animate">
        {statCards.map((s, i) => (
          <motion.div key={i} className={`stat-card ${s.cls}`} variants={cardVariants}
            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,212,255,0.1)' }}>
            <div className="stat-label">{s.label}</div>
            <motion.div className="stat-value" style={{ color: s.color }}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 + 0.2 }}>
              {s.value}
            </motion.div>
            <div className="stat-sub">{s.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="quick-actions" variants={fadeIn} initial="initial" animate="animate">
        {[
          { label: '🔒 Upload & Seal', page: 'upload', primary: true },
          { label: '◎ Verify File', page: 'verify', primary: false },
          { label: '⛓ Blockchain Log', page: 'blockchain', primary: false },
        ].map((btn, i) => (
          <motion.button key={i}
            className={`btn ${btn.primary ? 'btn-primary' : 'btn-outline'}`}
            whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(btn.page)}>
            {btn.label}
          </motion.button>
        ))}
        <motion.button className="btn btn-outline" whileHover={{ y: -2 }} onClick={fetchData}>
          ↺ Refresh
        </motion.button>
      </motion.div>

      {/* Recent Files */}
      <motion.div className="files-section" variants={cardVariants} initial="initial" animate="animate">
        <div className="files-header">
          <span className="section-title">Recent Files</span>
          <motion.button className="btn btn-outline sm" whileHover={{ x: 3 }} onClick={() => onNavigate('files')}>
            View All →
          </motion.button>
        </div>

        {files.length === 0 ? (
          <motion.div variants={fadeIn} initial="initial" animate="animate"
            style={{ textAlign: 'center', padding: '48px 24px' }}>
            <motion.div style={{ fontSize: 40, marginBottom: 12 }}
              animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>📂</motion.div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>No files uploaded yet</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Upload your first file to get started</div>
            <motion.button className="btn btn-primary" whileHover={{ scale: 1.04 }} onClick={() => onNavigate('upload')}>
              🔒 Upload First File
            </motion.button>
          </motion.div>
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
                <motion.tr key={f.fileId} variants={tableRow} initial="initial" animate="animate"
                  transition={{ delay: i * 0.05 }}>
                  <td>
                    <div className="file-row-name">
                      <span className={`file-type-badge badge-${f.filename?.split('.').pop()}`}>
                        {f.filename?.split('.').pop()?.toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{f.filename}</span>
                    </div>
                  </td>
                  <td><span className="mono-text">{formatSize(f.fileSize)}</span></td>
                  <td><span className="hash-text">{f.originalHash?.substring(0, 16)}...</span></td>
                  <td><span className="tx-link">{f.txHash?.substring(0, 14)}... ↗</span></td>
                  <td><span className="mono-text">{new Date(f.uploadedAt).toLocaleString()}</span></td>
                  <td><StatusBadge status={f.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Tamper Alert */}
      {stats.tampered > 0 && (
        <motion.div className="alert-banner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {stats.tampered} Tampered File{stats.tampered > 1 ? 's' : ''} Detected!
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>File integrity compromised. Verify immediately.</div>
          </div>
          <motion.button className="btn btn-danger sm" whileHover={{ scale: 1.04 }} onClick={() => onNavigate('verify')}>
            Investigate →
          </motion.button>
        </motion.div>
      )}

    </motion.div>
  );
}

// ── Helper ──
function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}