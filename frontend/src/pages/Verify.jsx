import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, cardVariants } from '../utils/animations';
import { getTxUrl, verifyFileOnChain } from '../utils/blockchain';
import '../styles/Verify.css';

const API = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api$/, '') + '/api';

const AUDIT_STEPS = [
  'Reading file bytes...',
  'Generating SHA-256 fingerprint...',
  'Fetching vault record...',
  'Comparing hashes...',
  'Verifying blockchain seal...',
];

export default function Verify({ walletAddress, onNotify }) {
  // Step 1 — Vault file selection
  const [vaultFiles,    setVaultFiles]    = useState([]);
  const [vaultLoading,  setVaultLoading]  = useState(false);
  const [showVaultPick, setShowVaultPick] = useState(false);
  const [vaultFile,     setVaultFile]     = useState(null); // selected vault record

  // Step 2 — Desktop suspicious file
  const [suspiciousFile, setSuspiciousFile] = useState(null);
  const [drag,           setDrag]           = useState(false);
  const fileRef = useRef();

  // Audit state
  const [auditing,   setAuditing]   = useState(false);
  const [auditStep,  setAuditStep]  = useState(0);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // Load vault files
  useEffect(() => {
    if (!walletAddress) return;
    setVaultLoading(true);
    fetch(`${API}/files?wallet=${walletAddress}`)
      .then(r => r.json())
      .then(d => setVaultFiles(d.files || []))
      .catch(console.error)
      .finally(() => setVaultLoading(false));
  }, [walletAddress]);

  const runForensicAudit = async () => {
    if (!vaultFile || !suspiciousFile) return;
    setAuditing(true); setError(''); setResult(null);

    try {
      for (let i = 0; i < AUDIT_STEPS.length; i++) {
        setAuditStep(i + 1);
        await delay(700);
      }

      const formData = new FormData();
      formData.append('file', suspiciousFile);
      formData.append('fileId', vaultFile.fileId);

      const res  = await fetch(`${API}/verify`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      // Blockchain double-check
      if (data.originalHash) {
        const chain = await verifyFileOnChain(data.originalHash);
        data.chainVerified = chain.valid;
        data.chainOwner    = chain.owner;
      }

      setResult(data);

      const isValid = data.status === 'valid' || data.isMatch;
      if (typeof onNotify === 'function') {
        onNotify(
          isValid ? '✅ Integrity verified — file authentic' : '🚨 TAMPER DETECTED!',
          isValid ? 'success' : 'error'
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAuditing(false); setAuditStep(0);
    }
  };

  const handleRestore = async () => {
    if (!result?.fileId) return;
    try {
      const res = await fetch(`${API}/files/${result.fileId}/download`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = result.filename || vaultFile?.filename || 'restored_file';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Restore failed: ' + err.message);
    }
  };

  const reset = () => {
    setVaultFile(null); setSuspiciousFile(null);
    setResult(null); setError('');
  };

  const isValid = result?.status === 'valid' || result?.isMatch === true;

  return (
    <motion.div className="page-container"
      variants={pageVariants} initial="initial" animate="animate">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Forensic Audit
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Compare your vault original against a suspicious desktop file
        </p>
      </div>

      {/* ── Step indicator ── */}
      {!result && (
        <div className="section-card" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 8, flexWrap: 'wrap',
          }}>
            {[
              { n: 1, label: 'Select Vault File',         done: !!vaultFile },
              { n: 2, label: 'Upload Suspicious File',    done: !!suspiciousFile },
              { n: 3, label: 'Run Forensic Audit',        done: false },
            ].map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: s.done ? 'rgba(0,255,157,0.1)' : 'rgba(0,212,255,0.08)',
                    border: `1px solid ${s.done ? 'var(--green)' : 'rgba(0,212,255,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: s.done ? 'var(--green)' : 'var(--accent)',
                  }}>
                    {s.done ? '✓' : s.n}
                  </div>
                  <span style={{ fontSize: 12, color: s.done ? 'var(--green)' : 'var(--muted)' }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="var(--border)" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── Form (not auditing, no result) ── */}
        {!auditing && !result && (
          <motion.div key="form" variants={cardVariants}
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

            {/* ── STEP 1 — Select Vault File ── */}
            <div className="section-card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                Step 1 — Select Secure Vault File
              </div>

              {!vaultFile ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowVaultPick(true)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 10,
                    border: '1.5px dashed rgba(0,212,255,0.3)',
                    background: 'rgba(0,212,255,0.03)',
                    color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Select Secure Vault File
                </motion.button>
              ) : (
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(0,255,157,0.06)',
                  border: '1px solid rgba(0,255,157,0.2)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'rgba(0,255,157,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'var(--green)',
                  }}>
                    {vaultFile.filename?.split('.').pop()?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vaultFile.filename}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)',
                      color: 'var(--green)', marginTop: 2 }}>
                      ✓ Vault File Selected · {vaultFile.fileId}
                    </div>
                  </div>
                  <button onClick={() => setVaultFile(null)}
                    style={{ background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}>
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* ── STEP 2 — Upload Suspicious File ── */}
            <div className="section-card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                Step 2 — Upload Suspicious File for Audit
              </div>

              {!suspiciousFile ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={e => {
                    e.preventDefault(); setDrag(false);
                    if (e.dataTransfer.files[0])
                      setSuspiciousFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${drag ? '#EF9F27' : 'rgba(239,159,39,0.3)'}`,
                    borderRadius: 12, padding: '28px 20px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: drag ? 'rgba(239,159,39,0.04)' : 'transparent',
                  }}>
                  <input ref={fileRef} type="file" style={{ display: 'none' }}
                    onChange={e => e.target.files[0] && setSuspiciousFile(e.target.files[0])} />
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ marginBottom: 10 }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                      stroke="#EF9F27" strokeWidth="1.4" strokeLinecap="round"
                      style={{ margin: '0 auto' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </motion.div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    Drop suspicious file here
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Upload the possibly tampered desktop copy for comparison
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(239,159,39,0.06)',
                  border: '1px solid rgba(239,159,39,0.25)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'rgba(239,159,39,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#EF9F27',
                  }}>
                    {suspiciousFile.name.split('.').pop()?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {suspiciousFile.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#EF9F27', marginTop: 2 }}>
                      ⚠ Suspicious file loaded · {(suspiciousFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button onClick={() => setSuspiciousFile(null)}
                    style={{ background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}>
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* ── Run Audit Button ── */}
            <motion.button
              whileHover={vaultFile && suspiciousFile ? { scale: 1.02 } : {}}
              whileTap={{ scale: 0.98 }}
              onClick={runForensicAudit}
              disabled={!vaultFile || !suspiciousFile}
              style={{
                width: '100%', height: 52, border: 'none', borderRadius: 12,
                background: vaultFile && suspiciousFile
                  ? 'linear-gradient(135deg, #7F77DD, #378ADD)'
                  : 'rgba(255,255,255,0.05)',
                color: vaultFile && suspiciousFile ? '#fff' : 'var(--muted)',
                fontSize: 14, fontWeight: 700, cursor: vaultFile && suspiciousFile ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '0.04em',
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              EXECUTE FORENSIC AUDIT
            </motion.button>

          </motion.div>
        )}

        {/* ── Auditing Progress ── */}
        {auditing && (
          <motion.div key="auditing" variants={cardVariants}
            initial="initial" animate="animate">
            <div className="section-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </motion.div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: 'var(--text)' }}>
                Running Forensic Audit...
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 28 }}>
                Please wait while we analyze the files
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360, margin: '0 auto' }}>
                {AUDIT_STEPS.map((s, i) => {
                  const done   = auditStep > i + 1;
                  const active = auditStep === i + 1;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8,
                      background: active ? 'rgba(0,212,255,0.06)' : done ? 'rgba(0,255,157,0.04)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(0,212,255,0.25)' : done ? 'rgba(0,255,157,0.2)' : 'var(--border)'}`,
                      opacity: active || done ? 1 : 0.35, transition: 'all 0.3s',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? 'rgba(0,255,157,0.15)' : active ? 'rgba(0,212,255,0.15)' : 'transparent',
                        border: `1px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border)'}`,
                        color: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--muted)',
                        fontSize: 10,
                      }}>
                        {done ? '✓' : active ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                        ) : (i + 1)}
                      </div>
                      <span style={{
                        fontSize: 12, fontFamily: 'var(--font-mono)',
                        color: active ? 'var(--text)' : 'var(--muted)',
                        fontWeight: active ? 600 : 400,
                      }}>
                        {s}
                      </span>
                      {active && (
                        <span style={{ marginLeft: 'auto', fontSize: 10,
                          color: 'var(--accent)', fontWeight: 600 }}>
                          PROCESSING
                        </span>
                      )}
                      {done && (
                        <span style={{ marginLeft: 'auto', fontSize: 10,
                          color: 'var(--green)', fontWeight: 600 }}>
                          DONE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Result ── */}
        {result && !auditing && (
          <motion.div key="result" variants={cardVariants}
            initial="initial" animate="animate">

            {/* Verdict */}
            <div className="section-card"
              style={{
                textAlign: 'center', padding: '28px',
                marginBottom: 16,
                background: isValid ? 'rgba(0,255,157,0.04)' : 'rgba(255,59,92,0.04)',
                border: `1px solid ${isValid ? 'rgba(0,255,157,0.2)' : 'rgba(255,59,92,0.2)'}`,
              }}>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{ marginBottom: 16 }}>
                {isValid ? (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
                    stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,157,0.4))' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                ) : (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
                    stroke="var(--red)" strokeWidth="1.4" strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(255,59,92,0.4))' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                )}
              </motion.div>

              {isValid && (
                <div style={{
                  display: 'inline-block', marginBottom: 12,
                  fontSize: 10, padding: '3px 14px', borderRadius: 20,
                  background: 'rgba(0,255,157,0.1)',
                  border: '1px solid rgba(0,255,157,0.3)',
                  color: 'var(--green)', fontWeight: 700, letterSpacing: '.06em',
                }}>
                  BLOCKCHAIN VERIFIED
                </div>
              )}

              <h2 style={{
                fontSize: 22, fontWeight: 800, margin: '0 0 8px',
                color: isValid ? 'var(--green)' : 'var(--red)',
              }}>
                {isValid ? '✅ INTEGRITY VERIFIED' : '🚨 TAMPERING DETECTED'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                {isValid
                  ? 'Desktop file matches the vault original — no modifications found.'
                  : 'Desktop file does NOT match the vault record — file has been altered.'}
              </p>
            </div>

            {/* Hash comparison */}
            <div className="section-card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
                Hash Comparison
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Vault Original Hash',  value: result.originalHash,  color: 'var(--green)' },
                  { label: 'Desktop File Hash',    value: result.currentHash,   color: isValid ? 'var(--green)' : 'var(--red)' },
                ].map((row, i) => (
                  <div key={i} style={{
                    padding: '12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase',
                      letterSpacing: 1.2, marginBottom: 6 }}>
                      {row.label}
                    </div>
                    <div style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)',
                      color: row.color, wordBreak: 'break-all',
                    }}>
                      {row.value || '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Match badge */}
              <div style={{
                marginTop: 12, padding: '10px 16px', borderRadius: 8,
                background: isValid ? 'rgba(0,255,157,0.06)' : 'rgba(255,59,92,0.06)',
                border: `1px solid ${isValid ? 'rgba(0,255,157,0.2)' : 'rgba(255,59,92,0.2)'}`,
                textAlign: 'center',
                fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: isValid ? 'var(--green)' : 'var(--red)',
              }}>
                {isValid
                  ? '✓ HASH MATCH — File is authentic'
                  : '✗ HASH MISMATCH — File has been modified'}
              </div>
            </div>

            {/* File info */}
            {result.filename && (
              <div className="section-card" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                  Record Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'File Name',    value: result.filename },
                    { label: 'File ID',      value: result.fileId },
                    { label: 'Wallet Owner', value: result.walletAddress
                        ? `${result.walletAddress.slice(0,10)}...` : '—' },
                    { label: 'Blockchain',   value: result.chainVerified ? '✓ Verified' : 'DB Only' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 9, color: 'var(--muted)',
                        textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)',
                        color: 'var(--text)', wordBreak: 'break-all' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TX hash */}
            {result.txHash && result.txHash !== 'pending' && (
              <a href={getTxUrl(result.txHash)} target="_blank" rel="noreferrer"
                style={{
                  display: 'block', textAlign: 'center', marginBottom: 16,
                  fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                }}>
                ⛓ View Blockchain Proof on Etherscan ↗
              </a>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={reset}
                style={{
                  flex: 1, height: 48, borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text)',
                  fontSize: 13, cursor: 'pointer',
                }}>
                Audit Another
              </motion.button>

              {!isValid && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={handleRestore}
                  style={{
                    flex: 1.5, height: 48, borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, var(--red), #c0392b)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Restore Original File
                </motion.button>
              )}

              {isValid && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  style={{
                    flex: 1.5, height: 48, borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #7F77DD, #378ADD)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>
                  Download Certificate
                </motion.button>
              )}
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Vault File Picker Modal ── */}
      <AnimatePresence>
        {showVaultPick && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowVaultPick(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '1rem',
            }}>
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16, width: '100%', maxWidth: 520,
                maxHeight: '75vh', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    Select Vault File
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    Choose the original sealed file to compare against
                  </div>
                </div>
                <button onClick={() => setShowVaultPick(false)}
                  style={{ background: 'none', border: '1px solid var(--border)',
                    cursor: 'pointer', color: 'var(--muted)', fontSize: 16,
                    width: 30, height: 30, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>

              {/* File list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {vaultLoading ? (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                    Loading vault files...
                  </div>
                ) : vaultFiles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                    No files in vault. Upload files first.
                  </div>
                ) : (
                  vaultFiles.map(f => (
                    <motion.div key={f.fileId}
                      whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                      onClick={() => { setVaultFile(f); setShowVaultPick(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px', borderRadius: 10, cursor: 'pointer',
                        marginBottom: 4, border: '1px solid transparent',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                        background: f.status === 'valid' ? 'rgba(0,255,157,0.08)' : 'rgba(255,59,92,0.08)',
                        border: `1px solid ${f.status === 'valid' ? 'rgba(0,255,157,0.2)' : 'rgba(255,59,92,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700,
                        color: f.status === 'valid' ? 'var(--green)' : 'var(--red)',
                      }}>
                        {f.filename?.split('.').pop()?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.filename}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)',
                          fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          {f.fileId} · {new Date(f.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                        background: f.status === 'valid' ? 'rgba(0,255,157,0.1)' : 'rgba(255,59,92,0.1)',
                        color: f.status === 'valid' ? 'var(--green)' : 'var(--red)',
                      }}>
                        {f.status?.toUpperCase()}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}