import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import '../styles/Verify.css';
import { pageVariants, cardVariants, scalePop } from '../utils/animations';
import { verifyFile, getAllFiles } from '../utils/api';

export default function Verify({ onNotify, walletAddress }) {
  const [verifyFile_, setVerifyFile] = useState(null);
  const [fileId, setFileId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyStep, setVerifyStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const verifyInputRef = useRef(null);

  const VERIFY_STEPS = [
    'Reading file bytes...',
    'Generating SHA-256 hash...',
    'Fetching original hash from MongoDB...',
    'Comparing hashes...',
  ];

  // Files dropdown load karto
  const loadFiles = async () => {
    if (!walletAddress || files.length > 0) return;
    setLoadingFiles(true);
    try {
      const res = await getAllFiles(walletAddress);
      setFiles(res.files || []);
    } catch (err) {
      onNotify('Failed to load files: ' + err.message, 'error');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyFile_ || !fileId) return;
    setVerifying(true); setResult(null);

    try {
      for (let i = 1; i <= 4; i++) {
        setVerifyStep(i);
        await new Promise(r => setTimeout(r, 600));
      }

      // Real Go Backend API Call
      const data = await verifyFile(verifyFile_, fileId);
      setResult(data);
      setVerifying(false); setVerifyStep(0);

      if (data.status === 'tampered') {
        onNotify('⚠️ TAMPER DETECTED! File integrity compromised!', 'error');
      } else {
        onNotify('✅ File integrity verified — VALID!', 'success');
      }
    } catch (err) {
      setVerifying(false); setVerifyStep(0);
      onNotify('Verify failed: ' + err.message, 'error');
    }
  };

  const reset = () => { setVerifyFile(null); setResult(null); setVerifyStep(0); setFileId(''); };

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Result */}
      {result && (
        <motion.div className="verify-result-card" variants={scalePop} initial="initial" animate="animate"
          style={{
            borderColor: result.status === 'valid' ? 'rgba(0,255,157,0.3)' : 'rgba(255,59,92,0.3)',
            background: result.status === 'valid' ? 'rgba(0,255,157,0.04)' : 'rgba(255,59,92,0.04)',
          }}>
          <motion.span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
            {result.status === 'valid' ? '✅' : '⚠️'}
          </motion.span>

          <div style={{ fontSize: 24, fontWeight: 800, color: result.status === 'valid' ? 'var(--green)' : 'var(--red)', marginBottom: 8 }}>
            {result.status === 'valid' ? 'FILE INTEGRITY VERIFIED' : 'TAMPER DETECTED!'}
          </div>

          <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 28 }}>
            {result.message}
          </div>

          {/* Hash Comparison */}
          <div className="hash-compare">
            <div className="hash-box">
              <div className="hash-box-label">📦 Original Hash (MongoDB)</div>
              <div className="hash-box-value hash-match">{result.originalHash}</div>
            </div>
            <div className="hash-box">
              <div className="hash-box-label">📄 Current File Hash</div>
              <div className={`hash-box-value ${result.isMatch ? 'hash-match' : 'hash-mismatch'}`}>
                {result.currentHash}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 16, padding: '10px 20px', borderRadius: 8, display: 'inline-block',
            background: result.isMatch ? 'rgba(0,255,157,0.1)' : 'rgba(255,59,92,0.1)',
            border: `1px solid ${result.isMatch ? 'rgba(0,255,157,0.3)' : 'rgba(255,59,92,0.3)'}`,
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: result.isMatch ? 'var(--green)' : 'var(--red)'
          }}>
            {result.isMatch ? '✓ HASH MATCH — File is authentic' : '✗ HASH MISMATCH — File has been altered'}
          </div>

          <div style={{ marginTop: 24 }}>
            <motion.button className="btn btn-outline" whileHover={{ scale: 1.02 }} onClick={reset}>
              Verify Another File
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Verify Form */}
      {!result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Left — Upload */}
          <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate">
            <div className="section-header">
              <span className="section-title">Verify File Integrity</span>
            </div>

            {/* File ID Select */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
                Select File to Verify
              </div>
              <select
                value={fileId}
                onChange={e => setFileId(e.target.value)}
                onFocus={loadFiles}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer' }}
              >
                <option value="">-- Select a file --</option>
                {files.map(f => (
                  <option key={f.fileId} value={f.fileId}>
                    {f.filename} ({f.status})
                  </option>
                ))}
              </select>
              {loadingFiles && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Loading files...</div>}
            </div>

            {/* Or manual input */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
                Or Enter File ID Manually
              </div>
              <input
                type="text"
                placeholder="FILE-XXXXXX..."
                value={fileId}
                onChange={e => setFileId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>

            {/* File Upload */}
            <motion.div className="drop-zone" style={{ padding: 28 }}
              onClick={() => verifyInputRef.current?.click()}
              whileHover={{ borderColor: 'var(--accent)' }}>
              <input ref={verifyInputRef} type="file" style={{ display: 'none' }}
                onChange={e => e.target.files && setVerifyFile(e.target.files[0])} />
              <span className="drop-icon" style={{ fontSize: 28 }}>🔍</span>
              <div className="drop-title" style={{ fontSize: 14 }}>Upload file to verify</div>
              <div className="drop-sub">Same file jo tune upload kiya tha</div>
            </motion.div>

            {verifyFile_ && (
              <div className="file-selected" style={{ marginTop: 12 }}>
                <div className="file-icon-box">📄</div>
                <div className="file-info">
                  <div className="file-name">{verifyFile_.name}</div>
                  <div className="file-size">{(verifyFile_.size / 1048576).toFixed(2)} MB</div>
                </div>
              </div>
            )}

            {/* Verifying Steps */}
            {verifying && (
              <div style={{ marginTop: 16 }}>
                {VERIFY_STEPS.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', opacity: verifyStep > i ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                    <span style={{ fontSize: 14 }}>
                      {verifyStep > i + 1 ? '✅' : verifyStep === i + 1 ? '⏳' : '○'}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{step}</span>
                  </div>
                ))}
              </div>
            )}

            <motion.button
              className="btn btn-primary"
              style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
              disabled={!verifyFile_ || !fileId || verifying}
              whileHover={!verifyFile_ || !fileId ? {} : { scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleVerify}>
              {verifying ? '⏳ Verifying...' : '◎ Verify Integrity'}
            </motion.button>
          </motion.div>

          {/* Right — How it works */}
          <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate">
            <div className="section-title" style={{ marginBottom: 20 }}>How Verification Works</div>
            <div className="verify-steps-list">
              {[
                { n: '01', icon: '📂', title: 'Select File Record', desc: 'Dropdown madhe konati file verify karaychay te select kara.' },
                { n: '02', icon: '📤', title: 'Upload Same File', desc: 'Same file jo tune originally upload kela hota.' },
                { n: '03', icon: '📝', title: 'Hash Generated', desc: 'Go backend SHA-256 hash generate karto current file cha.' },
                { n: '04', icon: '🔗', title: 'MongoDB Comparison', desc: 'Original hash MongoDB madhe stored aahe — compare hoto.' },
                { n: '05', icon: '⚖️', title: 'Result', desc: 'Match → Valid ✅. Different → Tampered ⚠️' },
              ].map((s, i) => (
                <motion.div key={i} className="verify-step-item"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}>
                  <div className="verify-step-num">{s.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{s.icon} {s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="tip-box">
              💡 SHA-256 is a one-way function. Same file = same hash always. Any modification = completely different hash.
            </div>
          </motion.div>

        </div>
      )}
    </motion.div>
  );
}