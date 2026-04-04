import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../styles/Dashboard.css';
import StatusBadge from '../components/StatusBadge';
import { pageVariants, cardVariants, tableRow, fadeIn } from '../utils/animations';
import { getAllFiles, getStats } from '../utils/api';
import { getTxUrl } from '../utils/blockchain';

export default function Dashboard({ onNavigate, walletAddress }) {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, tampered: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
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

  useEffect(() => {
    if (walletAddress) fetchData();
  }, [fetchData, walletAddress]);

  // ── Integrity Score calculate karto ──
  const integrityScore = stats.total === 0
    ? 100
    : Math.round((stats.valid / stats.total) * 100);

  const scoreColor = integrityScore === 100 ? 'var(--green)'
    : integrityScore >= 80 ? 'var(--accent)'
      : integrityScore >= 50 ? 'var(--yellow)'
        : 'var(--red)';

  const scoreLabel = integrityScore === 100 ? 'Perfect'
    : integrityScore >= 80 ? 'Good'
      : integrityScore >= 50 ? 'Warning'
        : 'Critical';

  const formatSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

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
          <div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 13 }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Error */}
      {error && (
        <motion.div variants={fadeIn} initial="initial" animate="animate"
          style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: 13 }}>Backend Connection Error</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{error}</div>
          </div>
          <button className="btn btn-outline sm" onClick={fetchData}>↺ Retry</button>
        </motion.div>
      )}

      {/* Stats + Integrity Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 16 }}>

        {/* Stats Cards */}
        {[
          { label: 'Total Files', value: stats.total, sub: 'Uploaded files', color: 'var(--accent)', cls: 'blue' },
          { label: 'Valid', value: stats.valid, sub: 'Integrity intact', color: 'var(--green)', cls: 'green' },
          { label: 'Tampered', value: stats.tampered, sub: 'Action needed', color: 'var(--red)', cls: 'red' },
          { label: 'Revoked', value: stats.revoked, sub: 'Revoked files', color: '#a78bfa', cls: 'purple' },
        ].map((s, i) => (
          <motion.div key={i} className={`stat-card ${s.cls}`} variants={cardVariants}
            initial="initial" animate="animate"
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

        {/* Integrity Score Card */}
        <motion.div className="stat-card green" variants={cardVariants}
          initial="initial" animate="animate"
          whileHover={{ y: -4, boxShadow: `0 12px 32px ${scoreColor}22` }}
          style={{ borderColor: `${scoreColor}44` }}>
          <div className="stat-label">Integrity Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
            {/* Score Circle */}
            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border)" strokeWidth="4" />
                <motion.circle cx="28" cy="28" r="22" fill="none"
                  stroke={scoreColor} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - integrityScore / 100) }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  transform="rotate(-90 28 28)"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: scoreColor }}>
                {integrityScore}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor }}>{scoreLabel}</div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {stats.valid}/{stats.total} files valid
              </div>
            </div>
          </div>
          <div className="stat-sub">File integrity score</div>
        </motion.div>

      </div>

      {/* Quick Actions */}
      <motion.div className="quick-actions" variants={fadeIn} initial="initial" animate="animate">
        {[
          {
            label: <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Upload &amp; Seal</>,
            page: 'upload', primary: true
          },
          {
            label: <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>Verify File</>,
            page: 'verify', primary: false
          },
          {
            label: <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>Blockchain Log</>,
            page: 'blockchain', primary: false
          },
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

      {/* File Sharding Status Widget */}
      <div style={{
        background: 'var(--color-bg)',
        border: '0.5px solid var(--color-border)',
        borderRadius: 12, padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14,
        }}>
          File Sharding Status
        </div>

        <div style={{
          fontSize: 13, color: 'var(--text-muted)', marginBottom: 16,
        }}>
          Tumchya files{' '}
          <span style={{ color: '#378ADD', fontWeight: 500 }}>5 IPFS nodes</span>
          {' '}var distributed aahеt
        </div>

        {/* Node grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8, marginBottom: 16,
        }}>
          {[
            { id: 'Node 1', location: 'Mumbai',    status: 'active', ping: '12ms'  },
            { id: 'Node 2', location: 'Frankfurt', status: 'active', ping: '48ms'  },
            { id: 'Node 3', location: 'New York',  status: 'active', ping: '120ms' },
            { id: 'Node 4', location: 'Singapore', status: 'active', ping: '67ms'  },
            { id: 'Node 5', location: 'London',    status: 'syncing',ping: '55ms'  },
          ].map((node, i) => (
            <div key={i} style={{
              background: node.status === 'active'
                ? 'rgba(99,153,34,0.08)' : 'rgba(55,138,221,0.08)',
              border: `0.5px solid ${node.status === 'active'
                ? 'rgba(99,153,34,0.3)' : 'rgba(55,138,221,0.3)'}`,
              borderRadius: 8, padding: '10px 8px', textAlign: 'center',
            }}>
              {/* Status dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: node.status === 'active' ? '#639922' : '#378ADD',
                margin: '0 auto 6px',
              }}/>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-primary,#fff)', marginBottom: 2 }}>
                {node.id}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted,#888)', marginBottom: 4 }}>
                {node.location}
              </div>
              <div style={{
                fontSize: 9,
                color: node.status === 'active' ? '#639922' : '#378ADD',
              }}>
                {node.ping}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 11, color: 'var(--text-muted,#888)', marginBottom: 6,
          }}>
            <span>Replication progress</span>
            <span style={{ color: '#639922' }}>4/5 nodes synced</span>
          </div>
          <div style={{
            height: 6, background: 'rgba(255,255,255,0.07)',
            borderRadius: 20, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: '80%',
              background: '#639922', borderRadius: 20,
              transition: 'width 0.5s ease',
            }}/>
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
          Powered by IPFS / Pinata decentralized network
        </div>
      </div>

      {/* Recent Files */}
      <motion.div className="files-section" variants={cardVariants} initial="initial" animate="animate">
        <div className="files-header">
          <span className="section-title">Recent Activity</span>
          <motion.button className="btn btn-outline sm" whileHover={{ x: 3 }} onClick={() => onNavigate('files')}>
            View All →
          </motion.button>
        </div>

        {files.length === 0 ? (
          <motion.div variants={fadeIn} initial="initial" animate="animate"
            style={{ textAlign: 'center', padding: '48px 24px' }}>
            <motion.div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}
              animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </motion.div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>No files uploaded yet</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Upload your first file to get started</div>
            <motion.button className="btn btn-primary" whileHover={{ scale: 1.04 }} onClick={() => onNavigate('upload')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Upload First File
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
                  <td>
                    {f.txHash && f.txHash !== 'pending' ? (
                      <a href={getTxUrl(f.txHash)} target="_blank" rel="noreferrer" className="tx-link" style={{ textDecoration: 'none' }}>
                        {f.txHash.substring(0, 14)}... ↗
                      </a>
                    ) : (
                      <span className="mono-text" style={{ opacity: 0.5 }}>Pending...</span>
                    )}
                  </td>
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
          <span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
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