import { useState, useRef, useEffect, useCallback } from 'react';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// ── Type config ──
const TYPE_CONFIG = {
  success: {
    color:  '#00c896',
    bg:     'rgba(0,200,150,.08)',
    border: 'rgba(0,200,150,.2)',
    icon:   '✅',
    label:  'Success',
  },
  error: {
    color:  '#ff4444',
    bg:     'rgba(255,68,68,.08)',
    border: 'rgba(255,68,68,.2)',
    icon:   '🚨',
    label:  'Alert',
  },
  warning: {
    color:  '#F59E0B',
    bg:     'rgba(245,158,11,.08)',
    border: 'rgba(245,158,11,.2)',
    icon:   '⚠️',
    label:  'Warning',
  },
  info: {
    color:  '#00d4ff',
    bg:     'rgba(0,212,255,.08)',
    border: 'rgba(0,212,255,.2)',
    icon:   'ℹ️',
    label:  'Info',
  },
};

const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

export default function Topbar({ pageTitle, walletAddress, onDisconnect }) {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState('all');
  const panelRef = useRef(null);
  const btnRef   = useRef(null);

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  // ── Fetch notifications ──
  const fetchNotifs = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/notifications?wallet=${walletAddress}`);
      const data = await res.json();
      if (data.success) {
        setNotifs(data.notifications || []);
        setUnread(data.unread || 0);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // ── Bell click ──
  const handleBellClick = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening && unread > 0 && walletAddress) {
      try {
        await fetch(`${API}/notifications/read?wallet=${walletAddress}`, { method: 'PUT' });
        setUnread(0);
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error('Mark read error:', err);
      }
    }
  };

  // ── Outside click close ──
  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current   && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Format time ──
  const formatTime = (ts) => {
    if (!ts) return '';
    const d    = new Date(ts);
    const now  = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // ── Filter notifications ──
  const filtered = filter === 'all'
    ? notifs
    : filter === 'unread'
      ? notifs.filter(n => !n.read)
      : notifs.filter(n => n.type === filter);

  // ── Count by type ──
  const counts = {
    all:     notifs.length,
    unread:  notifs.filter(n => !n.read).length,
    error:   notifs.filter(n => n.type === 'error').length,
    warning: notifs.filter(n => n.type === 'warning').length,
  };

  return (
    <header className="topbar">

      {/* Left — Page title */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {pageTitle}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          BlockVerify / {pageTitle}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

        {/* Sim badge */}
        <div className="sim-badge">
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-teal)', flexShrink: 0,
            animation: 'pulse 2s infinite',
          }} />
          Sepolia Testnet
        </div>

        {/* ── Bell ── */}
        <div style={{ position: 'relative' }}>
          <button ref={btnRef} onClick={handleBellClick}
            style={{
              position: 'relative', width: 36, height: 36,
              borderRadius: 'var(--r-md)',
              border: `1px solid ${open ? 'var(--accent-cyan)' : 'var(--border)'}`,
              background: open ? 'rgba(0,212,255,.08)' : 'transparent',
              color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>

            {/* ── Unread Badge ── */}
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                background: counts.error > 0 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                color: '#fff',
                minWidth: 18, height: 18, borderRadius: 9,
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
                boxShadow: counts.error > 0
                  ? '0 0 8px rgba(255,68,68,.6)'
                  : '0 0 8px rgba(0,212,255,.4)',
                animation: counts.error > 0 ? 'pulse 1s infinite' : 'none',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* ── Dropdown Panel ── */}
          {open && (
            <div ref={panelRef} style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 340, borderRadius: 'var(--r-lg)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,.5)',
              overflow: 'hidden', zIndex: 9999,
            }}>

              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Notifications
                  </span>
                  {counts.error > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 20,
                      background: 'rgba(255,68,68,.12)',
                      color: 'var(--accent-red)',
                      border: '1px solid rgba(255,68,68,.2)',
                    }}>
                      {counts.error} Alert{counts.error > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button onClick={fetchNotifs}
                  style={{
                    fontSize: 11, color: 'var(--accent-cyan)',
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}>
                  ⟳ Refresh
                </button>
              </div>

              {/* Filter Tabs */}
              <div style={{
                display: 'flex', gap: 2, padding: '8px 10px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-input)',
              }}>
                {[
                  { key: 'all',     label: `All (${counts.all})` },
                  { key: 'unread',  label: `Unread (${counts.unread})` },
                  { key: 'error',   label: `🚨 Alerts (${counts.error})` },
                  { key: 'warning', label: `⚠️ (${counts.warning})` },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setFilter(tab.key)}
                    style={{
                      flex: 1, padding: '4px 6px',
                      borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 10, fontWeight: 600,
                      fontFamily: 'var(--font-main)',
                      background: filter === tab.key
                        ? 'var(--bg-card)' : 'transparent',
                      color: filter === tab.key
                        ? 'var(--text-primary)' : 'var(--text-muted)',
                      transition: 'all .15s',
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{
                    padding: '24px', textAlign: 'center',
                    color: 'var(--text-muted)', fontSize: 12,
                  }}>
                    <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 6 }}>⟳</div>
                    Loading...
                  </div>

                ) : filtered.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>
                      {filter === 'error' ? '🛡️' : filter === 'warning' ? '✅' : '🔔'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {filter === 'error'   ? 'No security alerts!' :
                       filter === 'warning' ? 'No warnings!' :
                       filter === 'unread'  ? 'All caught up!' :
                       'No notifications yet'}
                    </div>
                  </div>

                ) : filtered.map((n, i) => {
                  const cfg = getConfig(n.type);
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: 10,
                      padding: '11px 16px',
                      borderBottom: '1px solid rgba(30,45,62,.4)',
                      background: n.read
                        ? 'transparent'
                        : cfg.bg,
                      borderLeft: n.read
                        ? '3px solid transparent'
                        : `3px solid ${cfg.color}`,
                      transition: 'background .15s',
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13,
                      }}>
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: n.read ? 400 : 600,
                          color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                          lineHeight: 1.5, marginBottom: 3,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {n.message}
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '.08em',
                            color: cfg.color,
                          }}>
                            {cfg.label}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: cfg.color, flexShrink: 0, marginTop: 6,
                          boxShadow: `0 0 6px ${cfg.color}`,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              {notifs.length > 0 && (
                <div style={{
                  padding: '10px 16px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {notifs.length} total · {counts.unread} unread
                  </span>
                  <button
                    onClick={async () => {
                      await fetch(
                        `${API}/notifications/read?wallet=${walletAddress}`,
                        { method: 'PUT' }
                      );
                      setUnread(0);
                      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
                    }}
                    style={{
                      fontSize: 11, color: 'var(--accent-cyan)',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}>
                    Mark all read
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Wallet chip */}
        <div className="wallet-chip">
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-teal)',
          }} />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          {shortAddr}
        </div>

        {/* Avatar */}
        <div onClick={onDisconnect} title="Disconnect"
          style={{ cursor: 'pointer' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#0080ff,#00c8ff)',
            color: '#fff', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {walletAddress ? walletAddress.slice(2, 4).toUpperCase() : 'BV'}
          </div>
        </div>

      </div>
    </header>
  );
}