import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getAllFiles, getStats } from '../utils/api';
import { pageVariants, cardVariants, fadeIn } from '../utils/animations';

export default function Profile({ walletAddress, onNavigate }) {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, tampered: 0, revoked: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        getAllFiles(walletAddress),
        getStats(),
      ]);
      setFiles(filesRes.files || []);
      setStats(statsRes.stats || { total: 0, valid: 0, tampered: 0, revoked: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) fetchData();
  }, [fetchData, walletAddress]);

  const copyWallet = () => {
    navigator.clipboard?.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = walletAddress
    ? walletAddress.substring(2, 4).toUpperCase()
    : 'CV';

  const integrityScore = stats.total === 0
    ? 100
    : Math.round((stats.valid / stats.total) * 100);

  const scoreColor = integrityScore === 100 ? 'var(--green)'
    : integrityScore >= 80 ? 'var(--accent)'
      : integrityScore >= 50 ? '#EF9F27'
        : 'var(--red)';

  const formatSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  const STAT_CARDS = [
    {
      label: 'Total Files',
      value: stats.total,
      color: 'var(--accent)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Valid',
      value: stats.valid,
      color: 'var(--green)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
    {
      label: 'Tampered',
      value: stats.tampered,
      color: 'var(--red)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: 'Revoked',
      value: stats.revoked,
      color: '#7F77DD',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
    },
  ];

  return (
    <motion.div className="page-container"
      variants={pageVariants} initial="initial" animate="animate">

      {/* ── Profile Card ── */}
      <motion.div className="section-card" variants={cardVariants}
        initial="initial" animate="animate"
        style={{ marginBottom: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(127,119,221,0.2))',
            border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: 'var(--accent)',
            flexShrink: 0,
          }}>
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 18, fontWeight: 700,
              color: 'var(--text)', marginBottom: 4,
            }}>
              Wallet User
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Sepolia Testnet
            </div>
          </div>

          {/* Integrity Score mini */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              position: 'relative', width: 52, height: 52,
              margin: '0 auto 4px',
            }}>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="20" fill="none"
                  stroke="var(--border)" strokeWidth="4" />
                <motion.circle cx="26" cy="26" r="20" fill="none"
                  stroke={scoreColor} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - integrityScore / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  transform="rotate(-90 26 26)"
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: scoreColor,
              }}>
                {integrityScore}%
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>Integrity</div>
          </div>
        </div>

        {/* Wallet Address */}
        <div style={{
          padding: '14px 16px', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 8,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '.05em',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Wallet Address
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={copyWallet}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                border: '1px solid var(--border)',
                background: copied ? 'rgba(0,255,157,0.1)' : 'transparent',
                color: copied ? 'var(--green)' : 'var(--muted)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {copied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </motion.button>
          </div>
          <div style={{
            fontSize: 13, fontFamily: 'var(--font-mono)',
            color: 'var(--text)', wordBreak: 'break-all',
          }}>
            {walletAddress}
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 16,
      }}>
        {STAT_CARDS.map((s, i) => (
          <motion.div key={i}
            className="stat-card"
            variants={cardVariants} initial="initial" animate="animate"
            whileHover={{ y: -4 }}
            style={{ textAlign: 'center' }}>
            <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              {s.icon}
            </div>
            <div style={{
              fontSize: 28, fontWeight: 800,
              color: s.color, fontFamily: 'var(--font-mono)',
              marginBottom: 4,
            }}>
              {loading ? '—' : s.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Recent Files ── */}
      <motion.div className="section-card" variants={fadeIn}
        initial="initial" animate="animate">
        <div className="files-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Recent Files</span>
          <motion.button className="btn btn-outline sm"
            whileHover={{ x: 3 }}
            onClick={() => onNavigate('files')}>
            View All →
          </motion.button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 13 }}>
            Loading...
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              No files sealed yet
            </div>
            <button className="btn btn-primary sm"
              onClick={() => onNavigate('upload')}>
              Upload First File
            </button>
          </div>
        ) : (
          <div>
            {files.slice(0, 5).map((f, i) => (
              <motion.div key={f.fileId || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: 'var(--muted)',
                  }}>
                    {f.filename?.split('.').pop()?.toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {f.filename}
                    </div>
                    <div style={{
                      fontSize: 10, color: 'var(--muted)',
                      fontFamily: 'var(--font-mono)', marginTop: 2,
                    }}>
                      {formatSize(f.fileSize)} · {new Date(f.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 20,
                  fontWeight: 500, flexShrink: 0, marginLeft: 12,
                  background: f.status === 'valid'
                    ? 'rgba(0,255,157,0.08)'
                    : f.status === 'tampered'
                      ? 'rgba(255,59,92,0.08)'
                      : 'rgba(127,119,221,0.08)',
                  border: `1px solid ${f.status === 'valid' ? 'rgba(0,255,157,0.25)'
                      : f.status === 'tampered' ? 'rgba(255,59,92,0.25)'
                        : 'rgba(127,119,221,0.25)'
                    }`,
                  color: f.status === 'valid' ? 'var(--green)'
                    : f.status === 'tampered' ? 'var(--red)'
                      : '#7F77DD',
                }}>
                  {f.status}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
