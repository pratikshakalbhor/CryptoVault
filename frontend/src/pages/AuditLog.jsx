import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getAllFiles } from '../utils/api';
import { pageVariants, cardVariants, fadeIn } from '../utils/animations';

const EVENT_CONFIG = {
  upload: {
    label: 'Upload',
    color: 'var(--accent)',
    bg: 'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.25)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  verify: {
    label: 'Verified',
    color: 'var(--green)',
    bg: 'rgba(0,255,157,0.08)',
    border: 'rgba(0,255,157,0.25)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  tampered: {
    label: 'Tampered',
    color: 'var(--red)',
    bg: 'rgba(255,59,92,0.08)',
    border: 'rgba(255,59,92,0.25)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  revoked: {
    label: 'Revoked',
    color: '#7F77DD',
    bg: 'rgba(127,119,221,0.08)',
    border: 'rgba(127,119,221,0.25)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
  },
  sealed: {
    label: 'Blockchain Sealed',
    color: '#EF9F27',
    bg: 'rgba(239,159,39,0.08)',
    border: 'rgba(239,159,39,0.25)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
};

// File record kadun audit events generate karo
function generateEvents(files) {
  const events = [];
  files.forEach(f => {
    // Upload event
    events.push({
      id: `${f.fileId}-upload`,
      type: 'upload',
      filename: f.filename,
      fileId: f.fileId,
      walletAddress: f.walletAddress,
      txHash: null,
      details: `File encrypted with AES-256 — ${Math.round((f.fileSize || 0) / 1024)} KB`,
      time: f.uploadedAt,
    });

    // Blockchain seal event
    if (f.txHash && f.txHash !== 'pending') {
      events.push({
        id: `${f.fileId}-seal`,
        type: 'sealed',
        filename: f.filename,
        fileId: f.fileId,
        walletAddress: f.walletAddress,
        txHash: f.txHash,
        details: `SHA-256 hash sealed on Ethereum Sepolia`,
        time: f.uploadedAt,
      });
    }

    // Verify event
    if (f.verifiedAt) {
      events.push({
        id: `${f.fileId}-verify`,
        type: f.status === 'tampered' ? 'tampered' : 'verify',
        filename: f.filename,
        fileId: f.fileId,
        walletAddress: f.walletAddress,
        txHash: f.txHash,
        details: f.status === 'tampered'
          ? 'Hash mismatch detected — file has been altered!'
          : 'Hash matched — file integrity confirmed',
        time: f.verifiedAt,
      });
    }

    // Revoke event
    if (f.isRevoked) {
      events.push({
        id: `${f.fileId}-revoke`,
        type: 'revoked',
        filename: f.filename,
        fileId: f.fileId,
        walletAddress: f.walletAddress,
        txHash: null,
        details: 'File access permanently revoked',
        time: f.uploadedAt,
      });
    }
  });

  // Sort by time — newest first
  return events.sort((a, b) => new Date(b.time) - new Date(a.time));
}

const FILTERS = ['all', 'upload', 'sealed', 'verify', 'tampered', 'revoked'];

export default function AuditLog({ walletAddress }) {
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const allEvents = generateEvents(files);
  const filtered = filter === 'all'
    ? allEvents
    : allEvents.filter(e => e.type === filter);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <motion.div className="page-container"
      variants={pageVariants} initial="initial" animate="animate">

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Audit Trail
          </h1>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 20,
            background: 'rgba(0,212,255,0.1)',
            border: '1px solid rgba(0,212,255,0.25)',
            color: 'var(--accent)', fontFamily: 'var(--font-mono)',
          }}>
            {filtered.length} events
          </span>
        </div>

        <motion.button className="btn btn-outline sm"
          whileHover={{ scale: 1.02 }} onClick={fetchFiles}>
          Refresh
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20,
      }}>
        {FILTERS.map(f => {
          const cfg = EVENT_CONFIG[f];
          return (
            <motion.button key={f}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12,
                fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                border: filter === f
                  ? `1px solid ${cfg?.color || 'var(--accent)'}`
                  : '1px solid var(--border)',
                background: filter === f
                  ? (cfg?.bg || 'rgba(0,212,255,0.1)')
                  : 'transparent',
                color: filter === f
                  ? (cfg?.color || 'var(--accent)')
                  : 'var(--muted)',
              }}>
              {f === 'all' ? 'All Events' : EVENT_CONFIG[f]?.label || f}
            </motion.button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(255,59,92,0.08)',
          border: '1px solid rgba(255,59,92,0.25)',
          fontSize: 12, color: 'var(--red)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error}</span>
          <button className="btn btn-outline sm" onClick={fetchFiles}>Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--muted)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            Loading audit trail...
          </div>
        </div>

      ) : filtered.length === 0 ? (
        <motion.div className="section-card" variants={fadeIn}
          initial="initial" animate="animate"
          style={{ textAlign: 'center', padding: '48px 24px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="var(--muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginBottom: 12, opacity: 0.4 }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 6 }}>
            No audit events found
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', opacity: 0.6 }}>
            Events are recorded when files are uploaded, verified, or modified
          </div>
        </motion.div>

      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((event, i) => {
            const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.upload;
            return (
              <motion.div key={event.id}
                className="section-card"
                variants={cardVariants} initial="initial" animate="animate"
                transition={{ delay: i * 0.03 }}
                whileHover={{ borderColor: cfg.border }}
                style={{ padding: '14px 18px' }}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

                  {/* Icon */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cfg.color,
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: 8, flexWrap: 'wrap', marginBottom: 4,
                    }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        color: cfg.color, fontWeight: 500,
                      }}>
                        {cfg.label}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {event.filename}
                      </span>
                    </div>

                    {event.details && (
                      <div style={{
                        fontSize: 12, color: 'var(--muted)', marginBottom: 6,
                      }}>
                        {event.details}
                      </div>
                    )}

                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: 12, flexWrap: 'wrap',
                    }}>
                      {/* Wallet */}
                      <span style={{
                        fontSize: 11, fontFamily: 'var(--font-mono)',
                        color: 'var(--muted)',
                      }}>
                        {event.walletAddress?.slice(0, 10)}...{event.walletAddress?.slice(-6)}
                      </span>

                      {/* File ID */}
                      <span style={{
                        fontSize: 11, fontFamily: 'var(--font-mono)',
                        color: 'var(--muted)', opacity: 0.7,
                      }}>
                        {event.fileId}
                      </span>

                      {/* TX Hash */}
                      {event.txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${event.txHash}`}
                          target="_blank" rel="noreferrer"
                          style={{
                            fontSize: 11, fontFamily: 'var(--font-mono)',
                            color: 'var(--accent)', textDecoration: 'none',
                          }}>
                          {event.txHash.slice(0, 12)}... ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div style={{
                    flexShrink: 0, textAlign: 'right',
                    fontSize: 11, color: 'var(--muted)',
                  }}>
                    <div style={{ marginBottom: 2 }}>
                      {new Date(event.time).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <div style={{ opacity: 0.6 }}>
                      {timeAgo(event.time)}
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </motion.div>
  );
}