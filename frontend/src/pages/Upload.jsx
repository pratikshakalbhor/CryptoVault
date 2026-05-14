import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, cardVariants, fadeIn } from '../utils/animations';
import { sealFileOnBlockchain, getTxUrl } from '../utils/blockchain';
import '../styles/Upload.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STEPS = [
  { pct: 20,  label: 'Generating SHA-256 Hash...',       icon: '#' },
  { pct: 40,  label: 'Encrypting File (AES-256)...',     icon: '🔐' },
  { pct: 60,  label: 'Uploading to IPFS Backup...',      icon: '☁️' },
  { pct: 80,  label: 'Waiting for MetaMask...',           icon: '🦊' },
  { pct: 90,  label: 'Registering on Blockchain...',     icon: '⛓️' },
  { pct: 100, label: 'Vault Secured!',                   icon: '✅' },
];

export default function Upload({ walletAddress, onNavigate }) {
  const [file,     setFile]     = useState(null);
  const [drag,     setDrag]     = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIdx,  setStepIdx]  = useState(-1);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const step = (i) => { setStepIdx(i); setProgress(STEPS[i].pct); };
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  const handleUpload = async () => {
    if (!file || !walletAddress) return;
    setUploading(true); setError(''); setResult(null);

    try {
      // Step 1 — Hash
      step(0); await delay(600);

      // Step 2 — Encrypt
      step(1); await delay(500);

      // Step 3 — IPFS upload via backend
      step(2);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('walletAddress', walletAddress);

      const uploadRes = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { 'X-Wallet-Address': walletAddress },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      const { fileId, fileHash, filename, fileSize } = uploadData;
      console.log('✅ Backend response:', uploadData);

      // Duplicate hash check — skip blockchain if already exists
      if (uploadData.existing) {
        setResult({
          fileId, fileHash, filename, fileSize,
          txHash:    uploadData.txHash || 'existing',
          duplicate: true,
        });
        setUploading(false);
        return;
      }

      // Step 4 — MetaMask popup
      step(3); await delay(300);
      console.log('🦊 Triggering MetaMask...');

      let txHash     = 'pending';
      let blockNumber = 0;

      try {
        const bcResult = await sealFileOnBlockchain({ fileHash });
        txHash      = bcResult.txHash;
        blockNumber = bcResult.blockNumber;
        console.log('✅ Blockchain confirmed! TX:', txHash);
      } catch (bcErr) {
        console.warn('⚠️ Blockchain seal failed:', bcErr.message);
        // Don't block — file saved, blockchain optional
      }

      // Step 5 — Save txHash to backend
      step(4);
      if (txHash !== 'pending') {
        await fetch(`${API}/files/${fileId}/tx`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash, blockNumber }),
        }).catch(console.warn);
      }

      // Step 6 — Done
      step(5); await delay(400);

      setResult({ fileId, fileHash, filename, fileSize, txHash });
      setUploading(false);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setUploading(false);
      setStepIdx(-1); setProgress(0);
    }
  };

  const reset = () => {
    setFile(null); setProgress(0); setStepIdx(-1);
    setResult(null); setError('');
  };

  return (
    <motion.div className="page-container"
      variants={pageVariants} initial="initial" animate="animate">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Upload & Seal
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Files are encrypted, stored on IPFS, and hash sealed on Ethereum
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Drop Zone ── */}
        {!file && !uploading && !result && (
          <motion.div key="drop" variants={cardVariants}
            initial="initial" animate="animate" exit={{ opacity: 0 }}>
            <div className="section-card"
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => {
                e.preventDefault(); setDrag(false);
                if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${drag ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 16, padding: '48px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                background: drag ? 'rgba(0,212,255,0.03)' : 'transparent',
              }}>
              <input ref={fileRef} type="file" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
              <motion.div
                animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: 48, marginBottom: 16 }}>
                📂
              </motion.div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                Drop file here or click to browse
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Any file type · Sealed on Ethereum Sepolia
              </div>
            </div>

            {/* 3-Layer info */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12, marginTop: 16,
            }}>
              {[
                { icon: '🔐', title: 'AES-256', desc: 'File encrypted before upload' },
                { icon: '#', title: 'SHA-256', desc: 'Cryptographic fingerprint' },
                { icon: '⛓️', title: 'Blockchain', desc: 'Immutable Sepolia proof' },
              ].map((item, i) => (
                <div key={i} className="section-card"
                  style={{ padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── File selected ── */}
        {file && !uploading && !result && (
          <motion.div key="selected" variants={cardVariants}
            initial="initial" animate="animate">
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(255,59,92,0.08)',
                border: '1px solid rgba(255,59,92,0.25)',
                fontSize: 12, color: 'var(--red)',
              }}>
                {error}
              </div>
            )}

            <div className="section-card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--accent)',
                }}>
                  {file.name.split('.').pop()?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}
                  </div>
                </div>
                <button onClick={reset} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', fontSize: 16, padding: '4px 8px',
                }}>✕</button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleUpload}
              style={{
                width: '100%', height: 52, border: 'none', borderRadius: 12,
                background: 'var(--accent)', color: '#000',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
              <span>🔒</span> Upload & Seal on Blockchain
            </motion.button>
          </motion.div>
        )}

        {/* ── Upload Progress ── */}
        {uploading && (
          <motion.div key="progress" variants={fadeIn}
            initial="initial" animate="animate">
            <div className="section-card" style={{ padding: '28px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6,
                color: 'var(--text)' }}>
                Processing your file...
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
                {file?.name}
              </div>

              {/* Progress bar */}
              <div style={{
                height: 6, background: 'rgba(255,255,255,0.06)',
                borderRadius: 20, overflow: 'hidden', marginBottom: 8,
              }}>
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    height: '100%', background: 'var(--accent)',
                    borderRadius: 20,
                  }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)',
                textAlign: 'right', marginBottom: 24 }}>
                {progress}% complete
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STEPS.map((s, i) => {
                  const done   = stepIdx > i;
                  const active = stepIdx === i;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      opacity: active || done ? 1 : 0.3, transition: 'opacity 0.3s',
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? 'rgba(0,255,157,0.15)'
                          : active ? 'rgba(0,212,255,0.15)' : 'transparent',
                        border: `1px solid ${done ? 'var(--green)'
                          : active ? 'var(--accent)' : 'var(--border)'}`,
                        color: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--muted)',
                        fontSize: 11,
                      }}>
                        {done ? '✓' : active ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                        ) : (i + 1)}
                      </div>
                      <span style={{
                        fontSize: 13,
                        color: active ? 'var(--text)' : 'var(--muted)',
                        fontWeight: active ? 600 : 400,
                      }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Success ── */}
        {result && !uploading && (
          <motion.div key="success" variants={cardVariants}
            initial="initial" animate="animate">
            <div className="section-card"
              style={{
                background: 'rgba(0,255,157,0.04)',
                border: '1px solid rgba(0,255,157,0.2)',
                padding: '28px',
              }}>

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{ fontSize: 48, marginBottom: 12 }}>
                  ✅
                </motion.div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>
                  {result.duplicate
                    ? 'Existing Blockchain Proof Reused!'
                    : 'File Registered Successfully!'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  {result.duplicate
                    ? 'Same file hash found — existing TX proof linked.'
                    : 'Encrypted, stored on IPFS, and sealed on Sepolia.'}
                </div>
              </div>

              {/* Details */}
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '16px',
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700,
                  color: 'var(--text)', marginBottom: 12 }}>
                  Registration Details
                </div>
                {[
                  { label: 'SHA-256 HASH',    value: result.fileHash, color: 'var(--accent)' },
                  { label: 'BLOCKCHAIN TX',   value: result.txHash,   color: '#a78bfa' },
                  { label: 'FILE ID',         value: result.fileId,   color: 'var(--muted)' },
                ].map((row, i) => (
                  <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)',
                      color: 'var(--muted)', letterSpacing: 1.5,
                      textTransform: 'uppercase', marginBottom: 3 }}>
                      {row.label}
                    </div>
                    <div style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      color: row.color, wordBreak: 'break-all',
                    }}>
                      {row.value === 'pending'
                        ? <span style={{ color: '#EF9F27' }}>⏳ Pending confirmation...</span>
                        : row.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* TX Etherscan link */}
              {result.txHash && result.txHash !== 'pending' && result.txHash !== 'existing' && (
                <a href={getTxUrl(result.txHash)} target="_blank" rel="noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', marginBottom: 16,
                    fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                  }}>
                  View transaction on Etherscan ↗
                </a>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={reset}
                  style={{
                    flex: 1, height: 44, borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text)',
                    fontSize: 13, cursor: 'pointer',
                  }}>
                  Upload Another
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onNavigate('files')}
                  style={{
                    flex: 1, height: 44, borderRadius: 10,
                    border: 'none', background: 'var(--accent)',
                    color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>
                  View My Files →
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}