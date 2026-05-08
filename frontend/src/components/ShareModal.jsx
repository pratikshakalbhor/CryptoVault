import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Share2, Mail, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

const fmtDate = dt =>
  dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'valid') return (
    <span style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent-teal, #00c896)', border: '1px solid rgba(0,200,150,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <CheckCircle size={10} /> VALID
    </span>
  );
  if (s === 'tampered') return (
    <span style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--accent-red, #ff4444)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <AlertTriangle size={10} /> TAMPERED
    </span>
  );
  return (
    <span style={{ background: 'rgba(255,140,66,0.1)', color: 'var(--accent-orange, #ff8c42)', border: '1px solid rgba(255,140,66,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Activity size={10} /> {s.toUpperCase() || 'UNKNOWN'}
    </span>
  );
}

export default function ShareModal({ file, onClose }) {
  const [copied, setCopied] = useState(false);
  const fileId = file.fileId || file.id || file.publicId;
  const verifyUrl = `${window.location.origin}/verify-public/${fileId}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = () => {
    const msg = `Verify this file's authenticity:\n${verifyUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=File Verification&body=${encodeURIComponent(verifyUrl)}`);
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const name = file.fileName || file.name || 'Unknown File';

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: '#080c10', // Dark theme matching BlockVerify
        border: '1px solid rgba(0,212,255,0.2)', // teal/cyan accent
        borderRadius: 20,
        padding: '32px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        position: 'relative',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.05)', border: 'none',
            borderRadius: 8, padding: '6px', cursor: 'pointer',
            color: 'var(--text-muted, #94a3b8)',
            display: 'inline-flex', alignItems: 'center',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <X size={18} />
        </button>

        <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 600, color: '#fff', textAlign: 'center' }}>
          Share Verification Link
        </h3>

        {/* File Info pill */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '12px 16px',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Uploaded: {fmtDate(file.uploadedAt)}
            </span>
          </div>
          <div style={{ flexShrink: 0 }}>
            <StatusBadge status={file.status} />
          </div>
        </div>

        {/* QR Code */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 24,
          background: '#111820', borderRadius: 16, padding: 20,
          border: '1px solid rgba(0,212,255,0.1)'
        }}>
          <QRCodeSVG
            value={verifyUrl}
            size={200}
            bgColor="#111820"
            fgColor="#00d4ff"
            level="M"
          />
        </div>

        {/* URL + Copy */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '10px 14px',
          marginBottom: 20
        }}>
          <span style={{
            flex: 1, fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {verifyUrl}
          </span>
          <button
            onClick={handleCopy}
            style={{
              flexShrink: 0,
              background: copied ? 'rgba(0,200,150,0.15)' : 'rgba(0,212,255,0.1)',
              border: `1px solid ${copied ? 'rgba(0,200,150,0.3)' : 'rgba(0,212,255,0.2)'}`,
              borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', color: copied ? '#00c896' : '#00d4ff',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
            }}
          >
            <Copy size={14} /> {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Social Shares */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={handleWhatsApp}
            style={{
              background: 'rgba(37,211,102,0.1)',
              border: '1px solid rgba(37,211,102,0.2)',
              borderRadius: 10, padding: '10px',
              color: '#25D366', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(37,211,102,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(37,211,102,0.1)'}
          >
            <Share2 size={16} /> WhatsApp
          </button>
          
          <button
            onClick={handleEmail}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '10px',
              color: '#e2e8f0', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <Mail size={16} /> Email
          </button>
        </div>
      </div>
    </div>
  );
}
