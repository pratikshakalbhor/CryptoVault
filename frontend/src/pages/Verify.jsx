import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Verify.css';
import { pageVariants, cardVariants, scalePop } from '../utils/animations';
import { getTxUrl } from '../utils/blockchain';
import { generateCertificate } from '../utils/generateCertificate';

export default function Verify({ onNotify, walletAddress }) {
  const [file, setFile]         = useState(null);
  const [drag, setDrag]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied]     = useState('');
  const fileInputRef            = useRef(null);

  const STEPS = [
    { n: 1, label: 'Computing Cryptographic Hash...',  icon: '🔐' },
    { n: 2, label: 'Fetching Ledger Records...',       icon: '🗄️' },
    { n: 3, label: 'Auditing Smart Contract State...', icon: '⛓️' },
  ];

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const doVerify = async () => {
    if (!file) return;
    setLoading(true); setError(''); setActiveStep(1);
    try {
      await delay(1000);  setActiveStep(2);
      await delay(1000);  setActiveStep(3);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/verify`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();

      await delay(800);
      setResult(data);
      if (typeof onNotify === 'function') {
        onNotify(
          data.isMatch ? '✅ File integrity verified!' : '⚠️ Tamper detected!',
          data.isMatch ? 'success' : 'error'
        );
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false); setActiveStep(0);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const shortHash = (h) => h ? `${h.slice(0,14)}...${h.slice(-10)}` : '—';

  const isValid = result?.isMatch === true ||
    result?.status?.toLowerCase() === 'valid' ||
    result?.finalStatus?.toLowerCase() === 'safe' ||
    (result?.currentHash && result?.originalHash &&
     result.currentHash.toLowerCase() === result.originalHash.toLowerCase());

  return (
    <motion.div className="page-container"
      variants={pageVariants} initial="initial" animate="animate">

      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Protocol Audit: Triple-Check
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Multi-layer validation against Database, Ledger, and Smart Contract
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Upload Form ── */}
        {!result && (
          <motion.div key="form"
            variants={cardVariants} initial="initial" animate="animate"
            exit={{ opacity: 0, y: -10 }}>

            {/* Step indicator */}
            <motion.div className="section-card"
              style={{ padding: '14px 20px', marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                {[
                  { n: 1, label: 'Hash computed' },
                  { n: 2, label: 'Compare with blockchain' },
                  { n: 3, label: 'Result shown' },
                ].map((step, i) => (
                  <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(0,212,255,0.1)',
                        border: '1px solid rgba(0,212,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                      }}>
                        {step.n}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {step.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="var(--border)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Error */}
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

            {!loading ? (
              <motion.div className="section-card">

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${drag ? 'var(--accent)' : file ? 'var(--green)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 12, padding: '36px 20px', textAlign: 'center',
                    cursor: 'pointer', marginBottom: 16,
                    background: drag ? 'rgba(0,212,255,0.04)'
                      : file ? 'rgba(0,255,157,0.03)' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files[0];
                      if (f) { setFile(f); setResult(null); setError(''); }
                    }} />

                  {/* Animated scanner icon */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
                      stroke={file ? 'var(--green)' : 'var(--accent)'}
                      strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ filter: `drop-shadow(0 0 8px ${file ? 'rgba(0,255,157,0.3)' : 'rgba(0,212,255,0.3)'})` }}>
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      {file && <polyline points="8 11 10 13 14 9"/>}
                    </svg>
                  </motion.div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                    {file ? file.name : 'Drop the file you want to verify'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {file
                      ? `${Math.round(file.size / 1024)} KB · Ready for cryptographic audit`
                      : "We'll compute its hash and compare with the blockchain record"}
                  </div>

                  {file && (
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      style={{
                        marginTop: 10, fontSize: 11, color: 'var(--red)',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}>
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Verify button */}
                <motion.button
                  whileHover={file ? { scale: 1.02 } : {}}
                  whileTap={{ scale: 0.97 }}
                  disabled={!file}
                  onClick={doVerify}
                  style={{
                    width: '100%', height: 50, borderRadius: 10, border: 'none',
                    background: file ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: file ? '#000' : 'var(--muted)',
                    fontSize: 14, fontWeight: 700, cursor: file ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    letterSpacing: '0.05em',
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                  EXECUTE TRIPLE-CHECK
                </motion.button>
              </motion.div>

            ) : (
              /* Loading steps */
              <motion.div className="section-card"
                variants={fadeIn} initial="initial" animate="animate">
                {STEPS.map((step, i) => {
                  const done   = activeStep > step.n;
                  const active = activeStep === step.n;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 0',
                      borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                      opacity: activeStep >= step.n ? 1 : 0.3,
                      transition: 'opacity 0.3s',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: done ? 'rgba(0,255,157,0.1)'
                          : active ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${done ? 'rgba(0,255,157,0.3)'
                          : active ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--muted)',
                      }}>
                        {done ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : active ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700 }}>{step.n}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 13, color: active ? 'var(--text)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>
                        Step {step.n}: {step.label}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Result ── */}
        {result && (
          <motion.div key="result"
            variants={scalePop} initial="initial" animate="animate">

            {/* Status header */}
            <motion.div className="section-card"
              style={{
                textAlign: 'center', padding: '28px 24px', marginBottom: 16,
                background: isValid ? 'rgba(0,255,157,0.04)' : 'rgba(255,59,92,0.04)',
                border: `1px solid ${isValid ? 'rgba(0,255,157,0.2)' : 'rgba(255,59,92,0.2)'}`,
              }}>

              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{ marginBottom: 16 }}>
                {isValid ? (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
                    stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 16px rgba(0,255,157,0.4))' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                ) : (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
                    stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 16px rgba(255,59,92,0.4))' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                )}
              </motion.div>

              {isValid && (
                <div style={{
                  display: 'inline-block', marginBottom: 12,
                  fontSize: 11, padding: '4px 14px', borderRadius: 20,
                  background: 'rgba(0,255,157,0.1)',
                  border: '1px solid rgba(0,255,157,0.3)',
                  color: 'var(--green)', fontWeight: 600, letterSpacing: '.05em',
                }}>
                  Protocol Verified
                </div>
              )}

              <h2 style={{
                fontSize: 24, fontWeight: 800, margin: '0 0 8px',
                color: isValid ? 'var(--green)' : 'var(--red)',
                letterSpacing: '0.02em',
              }}>
                {isValid ? 'VERIFICATION SECURE' : 'INTEGRITY COMPROMISED'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                {isValid
                  ? 'All cryptographic signatures match on-chain records.'
                  : 'Mismatch detected between current file and immutable records.'}
              </p>
            </motion.div>

            {/* Hash comparison card */}
            <motion.div className="section-card"
              style={{ marginBottom: 16, overflow: 'hidden' }}>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                gap: 0, minHeight: 120,
              }}>
                {/* Original Record */}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 10,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3"/>
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                      textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      Original Record
                    </span>
                  </div>

                  <div style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 8,
                    background: 'rgba(0,255,157,0.06)',
                    border: '1px solid rgba(0,255,157,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  }}>
                    <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)', wordBreak: 'break-all' }}>
                      {shortHash(result.originalHash)}
                    </code>
                    <button onClick={() => copyText(result.originalHash, 'orig')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        color: copied === 'orig' ? 'var(--green)' : 'var(--muted)', flexShrink: 0 }}>
                      {copied === 'orig' ? '✓' : '⧉'}
                    </button>
                  </div>

                  <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 10 }}>
                    <span>DB: OK</span>
                    <span>Chain: {result.blockchainHash ? 'OK' : '—'}</span>
                  </div>
                </div>

                {/* Center separator */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                  borderLeft: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--surface)',
                    border: `1px solid ${isValid ? 'rgba(0,255,157,0.3)' : 'rgba(255,59,92,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isValid ? 'var(--green)' : 'var(--red)',
                  }}>
                    {isValid ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Current File */}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 10,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 9h6M9 13h6M9 17h4"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                      textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      Current File
                    </span>
                  </div>

                  <div style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 8,
                    background: isValid ? 'rgba(0,255,157,0.06)' : 'rgba(255,59,92,0.06)',
                    border: `1px solid ${isValid ? 'rgba(0,255,157,0.2)' : 'rgba(255,59,92,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  }}>
                    <code style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      color: isValid ? 'var(--green)' : 'var(--red)',
                      wordBreak: 'break-all',
                    }}>
                      {shortHash(result.currentHash)}
                    </code>
                    <button onClick={() => copyText(result.currentHash, 'curr')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        color: copied === 'curr' ? 'var(--green)' : 'var(--muted)', flexShrink: 0 }}>
                      {copied === 'curr' ? '✓' : '⧉'}
                    </button>
                  </div>

                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
                    color: isValid ? 'var(--green)' : 'var(--red)',
                  }}>
                    {isValid ? 'AUTHENTIC' : 'TAMPERED'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* File details */}
            {isValid && result.filename && (
              <motion.div className="section-card"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                }}>
                  {[
                    { label: 'File Name', value: result.filename },
                    { label: 'File ID',   value: result.fileId },
                    { label: 'Wallet',    value: `${result.walletAddress?.slice(0,10)}...` },
                    { label: 'Uploaded',  value: result.uploadedAt ? new Date(result.uploadedAt).toLocaleDateString() : '—' },
                  ].filter(x => x.value && x.value !== '...').map((item, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)',
                        color: 'var(--muted)', textTransform: 'uppercase',
                        letterSpacing: 1.2, marginBottom: 4 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)',
                        color: 'var(--text)', wordBreak: 'break-all' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {result.txHash && result.txHash !== 'pending' && (
                  <a href={getTxUrl(result.txHash)} target="_blank" rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 12, fontSize: 12, color: 'var(--accent)',
                      textDecoration: 'none',
                    }}>
                    ⛓ View TX on Etherscan ↗
                  </a>
                )}
              </motion.div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="btn btn-outline"
                style={{ flex: 1, height: 48 }}
                onClick={reset}>
                Verify Another
              </motion.button>

              {isValid && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => generateCertificate(result)}
                  style={{
                    flex: 1.5, height: 48, border: 'none', borderRadius: 10,
                    background: 'linear-gradient(135deg, #7F77DD, #378ADD)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6"/>
                    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                  </svg>
                  GENERATE CERTIFICATE
                </motion.button>
              )}
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 } };