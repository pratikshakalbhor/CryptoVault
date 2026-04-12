import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllFiles, getStats } from '../utils/api';

const ALERT_TYPES = {
  danger:  { color: 'var(--red)',    bg: 'rgba(255,59,92,0.08)',   border: 'rgba(255,59,92,0.25)'   },
  warning: { color: '#EF9F27',       bg: 'rgba(239,159,39,0.08)',  border: 'rgba(239,159,39,0.25)'  },
  info:    { color: 'var(--accent)', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.25)'   },
  success: { color: 'var(--green)',  bg: 'rgba(0,255,157,0.08)',   border: 'rgba(0,255,157,0.25)'   },
};

function AlertIcon({ type }) {
  if (type === 'danger') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  if (type === 'warning') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
  if (type === 'success') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

// Alerts generate karo — files + stats madhe
function generateAlerts(files, stats) {
  const alerts = [];

  // Tampered files
  const tamperedFiles = files.filter(f => f.status === 'tampered');
  tamperedFiles.forEach(f => {
    alerts.push({
      id: `tamper-${f.fileId}`,
      type: 'danger',
      title: 'Tamper Detected!',
      msg: `${f.filename} — hash mismatch found. File has been altered!`,
      time: f.verifiedAt || f.uploadedAt,
      action: { label: 'Verify Now', page: 'verify' },
    });
  });

  // Expired files
  const expiredFiles = files.filter(f =>
    f.expiryDate && new Date(f.expiryDate) < new Date()
  );
  expiredFiles.forEach(f => {
    alerts.push({
      id: `expired-${f.fileId}`,
      type: 'warning',
      title: 'File Expired',
      msg: `${f.filename} — expired on ${new Date(f.expiryDate).toLocaleDateString()}`,
      time: f.expiryDate,
      action: null,
    });
  });

  // Expiring soon (next 7 days)
  const expiringSoon = files.filter(f => {
    if (!f.expiryDate) return false;
    const diff = new Date(f.expiryDate) - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  });
  expiringSoon.forEach(f => {
    const days = Math.ceil((new Date(f.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    alerts.push({
      id: `expiring-${f.fileId}`,
      type: 'warning',
      title: 'Expiring Soon',
      msg: `${f.filename} — expires in ${days} day${days > 1 ? 's' : ''}`,
      time: new Date().toISOString(),
      action: null,
    });
  });

  // Storage warning — 10+ files
  if (stats.total >= 10) {
    alerts.push({
      id: 'storage-warning',
      type: 'warning',
      title: 'Storage Usage High',
      msg: `${stats.total} files sealed — consider reviewing old files`,
      time: new Date().toISOString(),
      action: { label: 'View Files', page: 'files' },
    });
  }

  // Revoked files
  if (stats.revoked > 0) {
    alerts.push({
      id: 'revoked-info',
      type: 'info',
      title: 'Revoked Files',
      msg: `${stats.revoked} file${stats.revoked > 1 ? 's' : ''} revoked — access permanently removed`,
      time: new Date().toISOString(),
      action: { label: 'View Files', page: 'files' },
    });
  }

  // All valid
  if (stats.total > 0 && stats.tampered === 0 && expiredFiles.length === 0) {
    alerts.push({
      id: 'all-valid',
      type: 'success',
      title: 'All Files Secure',
      msg: `${stats.valid} file${stats.valid > 1 ? 's' : ''} — blockchain integrity verified`,
      time: new Date().toISOString(),
      action: null,
    });
  }

  // Sort — danger first
  const order = { danger: 0, warning: 1, info: 2, success: 3 };
  return alerts.sort((a, b) => order[a.type] - order[b.type]);
}

export default function AlertsPanel({ walletAddress, onNavigate }) {
  const [alerts, setAlerts]       = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        getAllFiles(walletAddress),
        getStats(),
      ]);
      const generated = generateAlerts(
        filesRes.files || [],
        statsRes.stats || {}
      );
      setAlerts(generated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) fetchAlerts();
  }, [walletAddress]);

  const dismiss = (id) => setDismissed(prev => [...prev, id]);
  const dismissAll = () => setDismissed(alerts.map(a => a.id));
  const clearDismissed = () => setDismissed([]);

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  const filtered = filter === 'all'
    ? visible
    : visible.filter(a => a.type === filter);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const FILTER_TABS = [
    { key: 'all',     label: 'All',     count: visible.length },
    { key: 'danger',  label: 'Critical', count: visible.filter(a => a.type === 'danger').length },
    { key: 'warning', label: 'Warnings', count: visible.filter(a => a.type === 'warning').length },
    { key: 'info',    label: 'Info',     count: visible.filter(a => a.type === 'info').length },
    { key: 'success', label: 'Success',  count: visible.filter(a => a.type === 'success').length },
  ];

  return (
    <div className="page-container">

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Alerts
          </h1>
          {visible.filter(a => a.type === 'danger').length > 0 && (
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(255,59,92,0.1)',
              border: '1px solid rgba(255,59,92,0.3)',
              color: 'var(--red)', fontWeight: 600,
            }}>
              {visible.filter(a => a.type === 'danger').length} Critical
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {dismissed.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={clearDismissed}
              className="btn btn-outline sm">
              Restore All
            </motion.button>
          )}
          {visible.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={dismissAll}
              className="btn btn-outline sm">
              Dismiss All
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={fetchAlerts}
            className="btn btn-outline sm">
            Refresh
          </motion.button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(tab => {
          const cfg = ALERT_TYPES[tab.key] || { color: 'var(--accent)', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)' };
          return (
            <motion.button key={tab.key}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12,
                fontWeight: 500, cursor: 'pointer',
                border: filter === tab.key
                  ? `1px solid ${cfg.color}`
                  : '1px solid var(--border)',
                background: filter === tab.key ? cfg.bg : 'transparent',
                color: filter === tab.key ? cfg.color : 'var(--muted)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 20,
                  background: filter === tab.key ? cfg.color : 'var(--border)',
                  color: filter === tab.key ? '#000' : 'var(--muted)',
                  fontWeight: 700,
                }}>
                  {tab.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            Scanning for alerts...
          </div>
        </div>

      ) : filtered.length === 0 ? (
        <div className="section-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginBottom: 12, opacity: 0.6 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            No alerts!
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            All files secure — no issues detected
          </div>
        </div>

      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {filtered.map((alert, i) => {
              const cfg = ALERT_TYPES[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="section-card"
                  style={{ padding: '14px 18px' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: cfg.color,
                    }}>
                      <AlertIcon type={alert.type} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: 8, marginBottom: 4,
                      }}>
                        <span style={{
                          fontSize: 13, fontWeight: 600, color: cfg.color,
                        }}>
                          {alert.title}
                        </span>
                        <span style={{
                          fontSize: 10, color: 'var(--muted)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {timeAgo(alert.time)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {alert.msg}
                      </div>

                      {/* Action button */}
                      {alert.action && onNavigate && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => onNavigate(alert.action.page)}
                          style={{
                            marginTop: 8, padding: '4px 12px',
                            borderRadius: 6, fontSize: 11, fontWeight: 500,
                            border: `1px solid ${cfg.border}`,
                            background: cfg.bg, color: cfg.color,
                            cursor: 'pointer',
                          }}>
                          {alert.action.label} →
                        </motion.button>
                      )}
                    </div>

                    {/* Dismiss */}
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => dismiss(alert.id)}
                      style={{
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--muted)',
                        padding: 4, flexShrink: 0,
                        display: 'flex', alignItems: 'center',
                      }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Dismissed count */}
      {dismissed.length > 0 && (
        <div style={{
          marginTop: 16, textAlign: 'center',
          fontSize: 12, color: 'var(--muted)',
        }}>
          {dismissed.length} alert{dismissed.length > 1 ? 's' : ''} dismissed ·
          <button onClick={clearDismissed} style={{
            background: 'none', border: 'none',
            color: 'var(--accent)', cursor: 'pointer',
            fontSize: 12, marginLeft: 4,
          }}>
            Restore
          </button>
        </div>
      )}
    </div>
  );
}
