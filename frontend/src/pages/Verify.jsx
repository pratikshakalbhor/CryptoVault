import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import '../styles/Verify.css';
import { pageVariants, cardVariants, scalePop } from '../utils/animations';
import { getTxUrl } from '../utils/blockchain';
import { generateCertificate } from '../utils/generateCertificate';
import {
  ShieldCheck, AlertTriangle, CheckCircle, Clipboard,
  ExternalLink, FileText, FileImage, FileCode, FileArchive,
  RefreshCw, Loader2, Database, Link as LinkIcon,
  ChevronRight, FileCheck, Search, UploadCloud, Download, Shield
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────
const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

const getFileIcon = (file) => {
  if (!file) return <FileText size={24} />;
  const type = file.type || '';
  if (type.includes('image')) return <FileImage size={24} />;
  if (type.includes('zip') || type.includes('rar')) return <FileArchive size={24} />;
  if (type.includes('javascript') || type.includes('json') || type.includes('html')) return <FileCode size={24} />;
  return <FileText size={24} />;
};

const DetailedAuditReport = ({ result, onRestore }) => {
  if ((result.status !== 'TAMPERED' && result.status !== 'LOCAL_MISMATCH_PENDING_SYNC') || !result.comparison) return null;

  return (
    <motion.div className="v-card audit-report-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 20, borderLeft: '4px solid var(--accent-red)' }}>
      <div className="pf-section-label" style={{ marginBottom: 16, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={16} /> Audit Findings
      </div>
      <div className="audit-explanation" style={{ padding: 12, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, fontSize: 14, color: 'var(--text-white)', lineHeight: 1.5 }}>
        {result.comparison?.sizeMatch
          ? `File content was modified (same size: ${fmtSize(result.comparison?.originalFileSize)}, different hash). Possible metadata or content change.`
          : `File size changed from ${fmtSize(result.comparison?.originalFileSize)} to ${fmtSize(result.comparison?.currentFileSize)}, indicating data tampering.`
        }
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRestore} className="restore-btn-style"
        style={{
          marginTop: 24,
          padding: '14px 28px',
          background: 'var(--accent-red)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          width: '100%',
          boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        <Download size={18} /> Restore Original File
      </motion.button>
    </motion.div>
  );
};

export default function Verify({ onNotify, walletAddress }) {
  const location = useLocation();
  const [fileId, setFileId] = useState(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    console.log("FileId from URL:", id);
    setFileId(id);
  }, [location]);

  console.log("FULL URL:", window.location.href);

  const STEPS = [
    { n: 1, label: 'Reading File...', icon: <Search size={16} /> },
    { n: 2, label: 'Checking Record...', icon: <Database size={16} /> },
    { n: 3, label: 'Verifying Seal...', icon: <LinkIcon size={16} /> },
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); }
  };



  const doVerify = async () => {
    if (loading) return;
    if (!file) return;

    if (!fileId || fileId === 'null' || fileId === 'undefined') {
      toast('No File ID provided. Falling back to filename search...', { icon: '🔍' });
    }

    setLoading(true);
    setActiveStep(1);

    try {
      // Step 1: Initialize
      await delay(800);
      setActiveStep(2);

      // Step 2: Prepare Request
      const formData = new FormData();
      formData.append('file', file);
      
      if (fileId && fileId !== 'null' && fileId !== 'undefined') {
        formData.append('fileId', fileId);
        console.log("Sending fileId:", fileId);
      }

      // Step 3: Backend Verification
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/verify`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Verification service unavailable');

      const data = await response.json();
      setActiveStep(3);
      await delay(800);

      setResult(data);

      const status = data.status?.toUpperCase();
      if (status === 'VALID') {
        toast.success('✅ File integrity verified!');
      } else if (status === 'TAMPERED') {
        toast.error('🚨 Security Alert: Modification Detected!', { duration: 5000, style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' } });
      } else if (status === 'DATABASE_COMPROMISED') {
        toast.error('🚨 DATABASE BREACH! Blockchain proof does not match DB.', { duration: 6000, style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' } });
      } else if (status === 'NOT_SYNCED') {
        toast('🟠 Not synced with blockchain', { icon: '⏳' });
      } else if (status === 'LOCAL_MISMATCH_PENDING_SYNC') {
        toast('🟠 Local mismatch detected (awaiting sync)', { icon: '⏳' });
      } else if (status === 'NOT_FOUND' || status === 'NOT_REGISTERED') {
        toast('🚫 File not found in system', { icon: '🔍' });
      }
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
      setActiveStep(0);
    }
  };


  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const handleRestore = async () => {
    if (!result?.fileId) return;

    try {
      // ✅ Backend download endpoint use karo (correct port)
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const downloadUrl = `${apiBase}/api/files/${result.fileId}/download`;

      // Open in new tab — auto download hoil
      window.open(downloadUrl, '_blank');

      // Status update (restore POST)
      await fetch(`${apiBase}/api/files/${result.fileId}/restore`, {
        method: 'POST',
      });

      if (typeof onNotify === 'function') {
        onNotify('⬇️ Original file downloading...', 'success');
      }
      toast.success('⬇️ Downloading original file...');

    } catch (err) {
      console.error('Restore error:', err);
      if (typeof onNotify === 'function') {
        onNotify('Restore failed: ' + err.message, 'error');
      }
      toast.error('Restore failed: ' + err.message);
    }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const shortHash = (h) => h ? `${h.slice(0, 14)}...${h.slice(-10)}` : '—';

  const getStatusConfig = () => {
    const status = (result?.status || 'UNKNOWN').toUpperCase();

    console.log("[VERIFY UI] Status:", status);

    switch (status) {
      case 'VALID':
        return {
          class: 'valid',
          badge: 'Verified',
          title: '✔ This file is safe and unchanged',
          desc: 'We have confirmed that this file matches the original record. No changes have been made to it.',
          color: 'var(--accent-teal)',
          icon: <CheckCircle size={48} />,
          bg: 'rgba(45, 212, 191, 0.1)',
          shadow: '0 0 30px rgba(45, 212, 191, 0.2)'
        };
      case 'TAMPERED':
        return {
          class: 'tampered',
          badge: 'Modified',
          title: '⚠ This file has been modified',
          desc: 'Warning: This file does not match the original record. It has likely been altered.',
          color: 'var(--accent-red)',
          icon: <AlertTriangle size={48} />,
          bg: 'rgba(239, 68, 68, 0.1)',
          shadow: '0 0 30px rgba(239, 68, 68, 0.2)'
        };
      case 'DATABASE_COMPROMISED':
        return {
          class: 'tampered',
          badge: 'SECURITY BREACH',
          title: '🚨 DATABASE COMPROMISED!',
          desc: 'CRITICAL: The database record for this file does not match the blockchain proof. This indicates a high-level system breach.',
          color: 'var(--accent-red)',
          icon: <Shield size={48} color="var(--accent-red)" />,
          bg: 'rgba(239, 68, 68, 0.15)',
          shadow: '0 0 40px rgba(239, 68, 68, 0.4)'
        };
      case 'NOT_SYNCED':
        return {
          class: 'warning',
          badge: 'Not Synced',
          title: '⏳ Awaiting Blockchain Seal',
          desc: 'File exists in database but hasn\'t been confirmed on-chain yet. You can force a sync below.',
          color: '#F59E0B',
          icon: <RefreshCw size={48} className="spin" />,
          bg: 'rgba(245, 158, 11, 0.1)',
          shadow: '0 0 30px rgba(245, 158, 11, 0.2)'
        };
      case 'LOCAL_MISMATCH_PENDING_SYNC':
        return {
          class: 'warning',
          badge: 'Pending',
          title: '⚠ File not fully verified on blockchain',
          desc: 'The file is in our records, but the final verification process is not yet complete. Please check again in a while.',
          color: '#F59E0B',
          icon: <Loader2 size={48} className="spin" />,
          bg: 'rgba(245, 158, 11, 0.1)',
          shadow: '0 0 30px rgba(245, 158, 11, 0.2)'
        };
      case 'NOT_FOUND':
      case 'NOT_REGISTERED':
        return {
          class: 'grey',
          badge: 'Unknown',
          title: '🚫 This file was not found in the system',
          desc: 'We couldn\'t find any record of this file. Please make sure you are uploading the correct file.',
          color: '#9CA3AF',
          icon: <Search size={48} />,
          bg: 'rgba(156, 163, 175, 0.1)',
          shadow: '0 0 30px rgba(156, 163, 175, 0.2)'
        };
      default:
        return { class: 'grey', badge: 'Error', title: 'Unable to Verify', desc: 'Some technical error occurred.', color: '#9CA3AF', icon: <AlertTriangle size={48} />, shadow: '0 0 30px rgba(156, 163, 175, 0.2)' };
    }
  };

  const statusConfig = result ? getStatusConfig() : null;
  const isValid = 
    result?.status?.toUpperCase() === 'VALID' ||
    result?.isMatch === true ||
    result?.dbVerified === true;

  return (
    <motion.div className="verify-container" variants={pageVariants} initial="initial" animate="animate">

      {/* 1. HEADER INSTRUCTION */}
      <div className="ph">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🔍 Verify Your File</h1>
          <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
            Upload your file again to check if it has been changed or tampered with.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, fontSize: 13, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>✔ If the file is the same → It will be verified</span>
            <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>⚠ If the file was changed → It will be marked as modified</span>
          </div>
        </div>
        {(file || result) && (
          <button className="ref-btn" onClick={reset}><RefreshCw size={14} /> Reset</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!result && (
          <motion.div key="form" variants={cardVariants} initial="initial" animate="animate" exit={{ opacity: 0, y: -20 }}>

            {/* Stepper Header */}
            <div className="v-card" style={{ padding: '0 12px', marginBottom: 20 }}>
              <div className="v-stepper">
                {STEPS.map((step, i) => (
                  <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`v-step-item ${activeStep >= step.n ? 'active' : ''}`}>
                      <div className="v-step-num">{step.n}</div>
                      <span className="v-step-label">{step.label}</span>
                    </div>
                    {i < 2 && <ChevronRight size={14} className="v-step-sep" />}
                  </div>
                ))}
              </div>
            </div>

            {!loading ? (
              <div className="v-card">
                <div
                  className={`v-dropzone ${drag ? 'drag-active' : ''} ${file ? 'file-selected' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setFile(f); setResult(null); }
                  }} />

                  {file ? (
                    <div className="v-file-preview">
                      <div className="v-file-icon">{getFileIcon(file)}</div>
                      <div className="v-file-info">
                        <div className="v-file-name">{file.name}</div>
                        <div className="v-file-meta">
                          {fmtSize(file.size)} · Ready to check
                          {(!fileId || fileId === 'null') && (
                            <div style={{ color: '#F59E0B', fontSize: 10, marginTop: 4, fontWeight: 600 }}>
                              ⚠ For full verification, open file from "My Files"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 2. EMPTY STATE MESSAGE */
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div className="v-file-icon" style={{ margin: '0 auto 16px', width: 60, height: 60, background: 'rgba(0, 212, 255, 0.05)' }}>
                        <UploadCloud size={30} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No file selected</div>
                      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        👉 Choose the same file you uploaded earlier to verify its integrity
                      </div>
                      {(!fileId || fileId === 'null') && (
                        <div style={{ marginTop: 12, fontSize: 11, padding: '6px 14px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)', fontWeight: 600 }}>
                          ⚠ For full verification, open file from "My Files"
                        </div>
                      )}
                      {fileId && fileId !== 'null' && (
                        <div style={{ marginTop: 10, fontSize: 11, padding: '4px 12px', background: 'rgba(167, 139, 250, 0.1)', color: '#A78BFA', borderRadius: 20 }}>
                          Auditing for File ID: {fileId.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. BUTTON LABEL & 6. TOOLTIP */}
                <button className="v-btn-execute" disabled={!file || loading} onClick={doVerify} title="Check if this file has been changed">
                  {loading ? <Loader2 size={20} className="spin" /> : <ShieldCheck size={20} />}
                  Check File Integrity
                </button>
              </div>
            ) : (
              /* Processing Animation */
              <div className="v-card v-processing-card">
                <Loader2 size={48} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: 20 }} />
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Auditing Integrity...</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Please do not close this window while we verify the official digital seal.</div>

                <div className="v-processing-steps">
                  {STEPS.map((step) => {
                    const done = activeStep > step.n;
                    const active = activeStep === step.n;
                    return (
                      <div key={step.n} className={`v-proc-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                        <div className="v-step-num">
                          {done ? <CheckCircle size={14} /> : active ? <Loader2 size={14} className="spin" /> : step.n}
                        </div>
                        <span className="v-step-label" style={{ flex: 1, textAlign: 'left' }}>{step.label}</span>
                        {done && <span style={{ fontSize: 11, color: 'var(--accent-teal)', fontWeight: 700 }}>COMPLETED</span>}
                        {active && <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700 }}>PROCESSING</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Result View */}
        {result && (
          <motion.div key="result" variants={scalePop} initial="initial" animate="animate">
            <div className={`v-card v-result-verdict ${statusConfig.class}`}>
              <div className={`v-status-badge ${statusConfig.class}`}>
                {statusConfig.badge}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: statusConfig.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: statusConfig.color,
                  boxShadow: statusConfig.shadow
                }}>
                  {statusConfig.icon}
                </div>
              </div>
              <h2 className="v-verdict-title" style={{ color: statusConfig.color }}>
                {statusConfig.title}
              </h2>
              <p className="v-verdict-desc">
                {statusConfig.desc}
              </p>

              {(result.status === 'DATABASE_COMPROMISED') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRestore}
                  style={{
                    marginTop: 24,
                    padding: '14px 28px',
                    background: 'var(--accent-red)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    width: '100%',
                    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  <Download size={18} /> Restore Authentic Version
                </motion.button>
              )}
            </div>

            <div className="v-hash-grid">
              {/* Original Hash */}
              <div className="v-hash-box">
                <div className="v-hash-label">
                  <Database size={14} /> Original Identity
                </div>
                <div className="v-hash-value-wrap">
                  <div className="v-hash-value">{shortHash(result.originalHash)}</div>
                  <button className="v-copy-btn" onClick={() => copyText(result.originalHash, 'orig')}>
                    {copied === 'orig' ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                  </button>
                </div>
              </div>

              {/* Blockchain Hash */}
              <div className="v-hash-box">
                <div className="v-hash-label">
                  <LinkIcon size={14} /> Digital Seal
                </div>
                <div className="v-hash-value-wrap">
                  <div className="v-hash-value">{shortHash(result.blockchainHash)}</div>
                  <button className="v-copy-btn" onClick={() => copyText(result.blockchainHash, 'chain')}>
                    {copied === 'chain' ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                  </button>
                </div>
              </div>

              {/* Current Hash */}
              <div className="v-hash-box" style={{ gridColumn: 'span 2' }}>
                <div className="v-hash-label">
                  <FileCheck size={14} /> Current File Identity
                </div>
                <div className="v-hash-value-wrap" style={{ borderColor: statusConfig.color + '4D' }}>
                  <div className="v-hash-value" style={{ color: statusConfig.color }}>
                    {result.currentHash}
                  </div>
                  <button className="v-copy-btn" onClick={() => copyText(result.currentHash, 'curr')}>
                    {copied === 'curr' ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                  </button>
                </div>
              </div>
            </div>


            {/* Verification Proofs */}
            <div className="v-card" style={{ marginBottom: 20 }}>
              <div className="pf-section-label" style={{ marginBottom: 16 }}>Official Record</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="pf-info-row">
                  <span className="pf-info-key">Database Check</span>
                  <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>SUCCESS</span>
                </div>
                <div className="pf-info-row">
                  <span className="pf-info-key">Blockchain Check</span>
                  <span style={{ color: result.blockchainHash ? 'var(--accent-teal)' : 'var(--accent-red)', fontWeight: 700 }}>
                    {result.blockchainHash ? 'AUTHENTIC' : 'NOT_SYNCED'}
                  </span>
                </div>
                {result.blockchainCID && (
                  <div className="pf-info-row" style={{ gridColumn: 'span 2' }}>
                    <span className="pf-info-key">Recovery Path</span>
                    <span style={{ color: 'var(--accent-teal)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                      <CheckCircle size={12} /> Blockchain Verified (IPFS)
                    </span>
                  </div>
                )}
                {result.txHash && result.txHash !== 'pending' && (
                  <div className="pf-info-row" style={{ gridColumn: 'span 2' }}>
                    <span className="pf-info-key">Sepolia Transaction Hash</span>
                    <a href={getTxUrl(result.txHash)} target="_blank" rel="noreferrer" style={{ color: '#A78BFA', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      {result.txHash.slice(0, 16)}... <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Heuristic Audit Report (Visible only if TAMPERED) */}
            <DetailedAuditReport result={result} onRestore={handleRestore} />

            {(result.status === 'NOT_SYNCED' || result.status === 'LOCAL_MISMATCH_PENDING_SYNC') && (
              <div className="mt-4 p-4 border border-orange-500/50 bg-orange-500/10 rounded-lg" style={{ marginBottom: 20 }}>
                <p className="text-orange-400 text-sm mb-2" style={{ color: '#FB923C', fontSize: 14, marginBottom: 8 }}>
                  ⏳ Data is not yet synced on the blockchain...
                </p>
                <button 
                  onClick={doVerify} 
                  className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition"
                  style={{ backgroundColor: '#F97316', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Force Re-check
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="pf-btn pf-btn-ghost" style={{ flex: 1 }} onClick={reset}>
                <RefreshCw size={14} /> Verify Another
              </button>
              {isValid && (
                <button className="v-btn-execute" style={{ flex: 1.5, marginTop: 0 }} onClick={() => generateCertificate({ ...result, walletAddress })}>
                  <FileCheck size={18} /> GENERATE CERTIFICATE
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));