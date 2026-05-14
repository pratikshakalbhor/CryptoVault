import { useState, useRef, useEffect } from 'react';
import { Settings, ExternalLink, ShieldCheck, Cpu, LogOut, Copy, Check } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Topbar({ pageTitle, walletAddress, onDisconnect }) {
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const settingsRef = useRef(null);

  // Close settings on outside click
  useEffect(() => {
    const handler = e => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <header className="topbar">
      {/* Left — Page title */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ 
          fontSize: 15, 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          lineHeight: 1.2, 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis' 
        }}>
          {pageTitle}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
          Blockchain Forensic Vault / {pageTitle}
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        
        {/* Network Badge */}
        <div className="sim-badge" style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: 'var(--text-secondary)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-teal)', animation: 'pulse 2s infinite' }} />
          Sepolia Testnet
        </div>

        {/* Notifications */}
        <NotificationDropdown walletAddress={walletAddress} />

        {/* Settings Gear */}
        <div style={{ position: 'relative' }} ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: 36, height: 36, borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: showSettings ? 'rgba(0,212,255,0.08)' : 'transparent',
              color: showSettings ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Settings size={18} />
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 280, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              zIndex: 1000, overflow: 'hidden'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
                ⚙️ Vault Settings
              </div>

              {/* Wallet Section */}
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Connected Wallet
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: 10 }}>
                  {walletAddress}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={copyAddress} style={{ 
                    flex: 1, padding: '6px', borderRadius: 6, border: '1px solid var(--border)', 
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', 
                    fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 
                  }}>
                    {copied ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </button>
                  <a href={`https://sepolia.etherscan.io/address/${walletAddress}`} target="_blank" rel="noreferrer" style={{ 
                    flex: 1, padding: '6px', borderRadius: 6, border: '1px solid var(--border)', 
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', 
                    fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 
                  }}>
                    <ExternalLink size={12} />
                    Explorer
                  </a>
                </div>
              </div>

              {/* Security Section */}
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Security Layers
                </div>
                {[
                  { label: 'AES-256 Encryption', icon: ShieldCheck },
                  { label: 'SHA-256 Hashing', icon: Cpu },
                  { label: 'Blockchain Seal', icon: ExternalLink }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                      <item.icon size={12} />
                      {item.label}
                    </div>
                    <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Active</span>
                  </div>
                ))}
              </div>

              {/* Actions Section */}
              <div style={{ padding: '12px' }}>
                <button
                  onClick={() => { setShowSettings(false); onDisconnect(); }}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8,
                    background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
                    color: '#ff4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,68,68,0.1)'}
                >
                  <LogOut size={14} />
                  Disconnect Wallet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Chip */}
        <div style={{ 
          width: 34, height: 34, borderRadius: '50%', 
          background: 'linear-gradient(135deg, #00d4ff, #0080ff)',
          color: '#000', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px rgba(0,212,255,0.3)'
        }}>
          {walletAddress ? walletAddress.slice(2, 4).toUpperCase() : 'BV'}
        </div>

      </div>
    </header>
  );
}