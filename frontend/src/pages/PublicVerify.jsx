import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ExternalLink, Activity, FileText, CheckCircle, Clock, Hash, Wallet, Network } from 'lucide-react';

const fmtDate = dt =>
  dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function PublicVerify() {
  const { fileId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        // Use relative URL to support proxying or proper host
        // But for development, we can use the same origin, 
        // since the React app is served by Vite which proxies /api usually.
        // Let's use /api/public/verify/ to let the proxy handle it or fetch the backend port directly.
        const apiUrl = process.env.NODE_ENV === 'development' 
            ? `http://localhost:8080/api/public/verify/${fileId}`
            : `/api/public/verify/${fileId}`;

        const res = await fetch(apiUrl);
        const json = await res.json();
        
        if (!res.ok || !json.fileId) {
          throw new Error(json.error || 'Verification link invalid or expired');
        }
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVerification();
  }, [fileId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c10', color: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Activity size={32} style={{ color: '#00d4ff' }} className="spin" />
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16 }}>Loading Verification Data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c10', color: '#fff' }}>
        <div style={{ textAlign: 'center', padding: 40, background: '#111820', borderRadius: 24, border: '1px solid rgba(255,68,68,0.2)', maxWidth: 400 }}>
          <AlertTriangle size={48} style={{ color: '#ff4444', margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", margin: '0 0 10px', fontSize: 24 }}>Link Invalid</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>{error}</p>
          <Link to="/" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600, border: '1px solid #00d4ff', padding: '10px 20px', borderRadius: 8 }}>Return Home</Link>
        </div>
      </div>
    );
  }

  const isTampered = data.status === 'tampered';
  const isValid = data.status === 'valid';

  return (
    <div style={{ minHeight: '100vh', background: '#080c10', color: '#e2e8f0', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,212,255,0.1)', background: 'rgba(11,17,26,0.5)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #00d4ff, #00c896)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
            <ShieldCheck size={24} color="#080c10" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: '#fff' }}>BlockVerify</span>
        </div>
        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#94a3b8'}>
          Go to App
        </Link>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', color: '#fff' }}>Public Verification File</h1>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>This file is secured and verified via blockchain technology.</p>
          </div>

          <div style={{
            background: '#111820',
            borderRadius: 24,
            border: `1px solid ${isValid ? 'rgba(0,200,150,0.3)' : isTampered ? 'rgba(255,68,68,0.3)' : 'rgba(0,212,255,0.2)'}`,
            padding: '40px',
            boxShadow: `0 20px 40px ${isValid ? 'rgba(0,200,150,0.05)' : isTampered ? 'rgba(255,68,68,0.05)' : 'rgba(0,0,0,0.5)'}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background glow */}
            <div style={{
              position: 'absolute', top: -100, right: -100, width: 200, height: 200,
              background: isValid ? 'radial-gradient(circle, rgba(0,200,150,0.15) 0%, transparent 70%)' : isTampered ? 'radial-gradient(circle, rgba(255,68,68,0.15) 0%, transparent 70%)' : 'transparent',
              filter: 'blur(40px)', zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* File Info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16 }}>
                    <FileText size={32} style={{ color: '#00d4ff' }} />
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 6px', fontSize: 20, color: '#fff', wordBreak: 'break-all' }}>{data.filename}</h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                      <Network size={14} /> {data.network || 'Ethereum Sepolia Testnet'}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{
                  background: isValid ? 'rgba(0,200,150,0.1)' : isTampered ? 'rgba(255,68,68,0.1)' : 'rgba(255,140,66,0.1)',
                  color: isValid ? '#00c896' : isTampered ? '#ff4444' : '#ff8c42',
                  border: `1px solid ${isValid ? 'rgba(0,200,150,0.3)' : isTampered ? 'rgba(255,68,68,0.3)' : 'rgba(255,140,66,0.3)'}`,
                  padding: '8px 16px', borderRadius: 24, fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  {isValid ? <CheckCircle size={18} /> : isTampered ? <AlertTriangle size={18} /> : <Activity size={18} />}
                  {isValid ? 'VALID ✅' : isTampered ? 'TAMPERED ⚠️' : data.status.toUpperCase()}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 0 32px' }} />

              {/* Data Grid */}
              <div style={{ display: 'grid', gap: 24 }}>
                <InfoRow icon={<Hash size={16} />} label="SHA-256 Checksum" value={data.hash} mono truncate />
                <InfoRow icon={<Network size={16} />} label="Blockchain Transaction" value={data.txHash} link={data.txHash ? `https://sepolia.etherscan.io/tx/${data.txHash}` : null} mono truncate />
                <InfoRow icon={<Wallet size={16} />} label="Uploader Wallet" value={data.wallet} mono />
                <InfoRow icon={<Clock size={16} />} label="Timestamp" value={fmtDate(data.uploadedAt)} />
              </div>
            </div>
          </div>
          
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 32 }}>
            This page provides read-only cryptographic proof of the file's existence and integrity.<br/>
            The original file is private and cannot be downloaded here.
          </p>

        </div>
      </main>
    </div>
  );
}

function InfoRow({ icon, label, value, mono, truncate, link }) {
  if (!value) return null;
  const displayValue = truncate && value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>
        {icon} {label}
      </div>
      <div style={{ 
        background: 'rgba(0,0,0,0.3)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: 12, padding: '12px 16px',
        color: '#e2e8f0', 
        fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
        fontSize: mono ? 13 : 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ wordBreak: 'break-all' }}>{displayValue}</span>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" style={{ color: '#00d4ff', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 600, fontSize: 12, background: 'rgba(0,212,255,0.1)', padding: '6px 12px', borderRadius: 8, transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(0,212,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(0,212,255,0.1)'}>
            View TX <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
