import { useState, useEffect } from 'react';
import { publicVerifyFile, downloadCertificate } from '../utils/api';

export default function PublicVerify({ publicId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    publicVerifyFile(publicId)
      .then(res => {
        if (!res.success) throw new Error(res.error || 'Verification failed');
        setData(res);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [publicId]);

  if (loading) return <div className="page-inner"><div className="loading-center"><div className="spin-ring" />Verifying authenticity...</div></div>;
  if (error) return <div className="page-inner"><div className="error-box">⚠️ {error}</div></div>;
  if (!data) return <div className="page-inner"><div className="empty">No record found.</div></div>;

  const isValid = data.status === 'valid';
  const isTampered = data.status === 'tampered';

  return (
    <div className="page-inner" style={{ maxWidth: 700, margin: '40px auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
         <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, var(--accent-cyan), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
           ChainLock Validation
         </h1>
      </div>

      <div className={`vr ${isValid ? 'valid' : isTampered ? 'tampered' : ''}`} style={{ textAlign: 'center', marginBottom: 20 }}>
        <div className="vr-ico">{isValid ? '✅' : isTampered ? '❌' : '⏳'}</div>
        <h2>{isValid ? 'Authentic Record Verified' : isTampered ? 'Warning: Tampered Record' : 'Verification Status Pending'}</h2>
        <p style={{ marginTop: 5, fontSize: 13 }}>
          {isValid
            ? 'This document has been cryptographically verified against the blockchain ledger. It is 100% authentic and unmodified.'
            : isTampered
            ? 'Warning: The cryptographic signature of this document does not match the original blockchain record.'
            : 'This document is currently being processed by the blockchain network.'}
        </p>
      </div>

      <div className="card">
         <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
           <span>📄</span> Document Details
         </h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8}}>
               <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Filename</span>
               <span style={{ fontSize: 13, fontWeight: 500 }}>{data.filename}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8}}>
               <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Version</span>
               <span style={{ fontSize: 13, fontWeight: 500 }}>v{data.version || 1}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
               <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sealed Date</span>
               <span style={{ fontSize: 13, fontWeight: 500 }}>{new Date(data.updatedAt).toLocaleString()}</span>
            </div>
         </div>
      </div>

      <div className="ig" style={{ marginTop: 20 }}>
        <div className="ig-hdr"><span>🔗</span><h3>Blockchain Information</h3></div>
        <div className="ig-row">
          <span className="ig-lbl">Transaction Hash</span>
          {data.txHash ? (
             <a
                 href={`https://sepolia.etherscan.io/tx/${data.txHash}`}
                 target="_blank" rel="noreferrer"
                 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-purple)', wordBreak: 'break-all' }}
               >
                 {data.txHash} ↗
             </a>
          ) : <span className="ig-val">—</span>}
        </div>
        <div className="ig-row">
          <span className="ig-lbl">Original SHA-256</span>
          <span className="ig-val mono">{data.fileHash || '—'}</span>
        </div>
        <div className="ig-row"><span className="ig-lbl">Network</span><span className="ig-val" style={{color: 'var(--accent-cyan)'}}>Ethereum Sepolia Testnet</span></div>
      </div>

      <div className="btn-row" style={{ marginTop: 20, justifyContent: 'center' }}>
         <button className="btn btn-pu" onClick={() => {
             setCertLoading(true);
             downloadCertificate(data.fileId).finally(() => setCertLoading(false));
         }} disabled={certLoading || !isValid} style={{ flex: 1 }}>
            {certLoading ? 'Generating PDF...' : '🏅 Download Proof Certificate'}
         </button>
      </div>

    </div>
  );
}
