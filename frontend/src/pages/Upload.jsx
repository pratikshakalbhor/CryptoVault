import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Upload.css';
import { pageVariants, staggerContainer, cardVariants, fadeIn } from '../utils/animations';
import { uploadFile } from '../utils/api';
import { sealFileOnBlockchain } from '../utils/blockchain';
import TxStatus from '../components/TxStatus';

const STEPS = [
  { label: 'Read',      desc: 'File read'      },
  { label: 'Hash',      desc: 'SHA-256'         },
  { label: 'Backend',   desc: 'Go API'          },
  { label: 'MongoDB',   desc: 'Save DB'         },
  { label: 'Blockchain',desc: 'Seal on ETH'     },
  { label: 'Done',      desc: 'Complete!'       },
];

const LAYERS = [
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    layer: 'Layer 1', title: 'AES-256 Encryption',  color: 'var(--accent)',
    desc: 'File encrypted before upload. Only you can decrypt with your private key.'
  },
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    layer: 'Layer 2', title: 'SHA-256 Hashing',     color: 'var(--yellow)',
    desc: 'Unique digital fingerprint. Even 1 byte change = completely different hash.'
  },
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>,
    layer: 'Layer 3', title: 'Blockchain Seal',     color: 'var(--green)',
    desc: 'Hash stored permanently on Ethereum. Immutable and tamper-proof forever.'
  },
];

export default function Upload({ onNotify, walletAddress }) {
  const [dragging,       setDragging]       = useState(false);
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadStep,     setUploadStep]     = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result,         setResult]         = useState(null);
  const [txInfo,         setTxInfo]         = useState(null);
  const [txStatus,       setTxStatus]       = useState('');
  const [error,          setError]          = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null); setError(''); setTxInfo(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !walletAddress) return;
    setUploading(true); setError('');
    setResult(null); setTxInfo(null);

    try {
      // ── Step 1: File read ──
      setUploadStep(1); setUploadProgress(10);
      await delay(300);

      // ── Step 2: Hash (Go backend karto) ──
      setUploadStep(2); setUploadProgress(25);
      await delay(300);

      // ── Step 3: Go Backend API call ──
      setUploadStep(3); setUploadProgress(45);
      const apiResult = await uploadFile(selectedFile, walletAddress);

      // ── Step 4: MongoDB save ──
      setUploadStep(4); setUploadProgress(65);
      await delay(300);

      // ── Step 5: Blockchain Seal ──
      setUploadStep(5); setUploadProgress(80);
      setTxStatus('pending');

      const blockchainResult = await sealFileOnBlockchain({
        fileId:   apiResult.fileId,
        filename: apiResult.filename,
        fileHash: apiResult.fileHash,
        fileSize: apiResult.fileSize,
        cloudUrl: '',
      });

      setTxInfo(blockchainResult);
      setTxStatus('success');

      // ── Step 6: Done ──
      setUploadStep(6); setUploadProgress(100);
      await delay(300);

      setResult({ ...apiResult, txHash: blockchainResult.txHash });
      setUploading(false);
      onNotify('✅ File uploaded and sealed on blockchain!', 'success');

    } catch (err) {
      // Blockchain fail zali tari backend result save hoto
      if (err.message?.includes('blockchain') || err.message?.includes('MetaMask') || err.message?.includes('Transaction')) {
        setTxStatus('failed');
        setError('⚠️ Backend save zala, pan blockchain seal failed: ' + err.message);
      } else {
        setError(err.message);
      }
      setUploading(false);
      setUploadStep(0); setUploadProgress(0);
      onNotify('❌ ' + err.message, 'error');
    }
  };

  const reset = () => {
    setSelectedFile(null); setUploadStep(0); setUploadProgress(0);
    setResult(null); setError(''); setTxInfo(null); setTxStatus('');
  };

  const formatSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate">
        <div className="section-header">
          <span className="section-title">Upload & Seal File</span>
          <span className="section-badge">SHA-256 + MongoDB + Ethereum</span>
        </div>

        <AnimatePresence mode="wait">

          {/* Drop Zone */}
          {!selectedFile && !uploading && !result && (
            <motion.div key="drop" variants={fadeIn} initial="initial" animate="animate" exit={{ opacity: 0 }}>
              <motion.div
                className={`drop-zone ${dragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ borderColor: 'var(--accent)', background: 'rgba(0,212,255,0.04)' }}
              >
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
                <motion.span className="drop-icon"
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </motion.span>
                <div className="drop-title">Drop file here or click to browse</div>
                <div className="drop-sub">Any file type · Max 100MB · Sealed on Ethereum Sepolia</div>
              </motion.div>
            </motion.div>
          )}

          {/* File Selected */}
          {selectedFile && !uploading && !result && (
            <motion.div key="selected" variants={cardVariants} initial="initial" animate="animate">
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                  {error}
                </motion.div>
              )}
              {txStatus === 'failed' && txInfo === null && (
                <TxStatus txHash={null} status="failed" />
              )}
              <div className="file-selected">
                <motion.div className="file-icon-box" whileHover={{ rotate: 5 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </motion.div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatSize(selectedFile.size)} · {selectedFile.type || 'unknown'}</div>
                </div>
                <motion.button className="btn btn-outline sm" whileTap={{ scale: 0.95 }} onClick={reset}>✕</motion.button>
                <motion.button className="btn btn-primary"
                  whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(0,212,255,0.3)' }}
                  whileTap={{ scale: 0.97 }} onClick={handleUpload}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Upload &amp; Seal on Blockchain
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Progress */}
          {uploading && (
            <motion.div key="progress" variants={fadeIn} initial="initial" animate="animate" className="progress-container">
              <div className="progress-steps">
                {STEPS.map((step, i) => (
                  <div key={i} className={`step ${uploadStep > i + 1 ? 'done' : uploadStep === i + 1 ? 'active' : ''}`}>
                    <motion.div className="step-dot"
                      animate={uploadStep === i + 1 ? { boxShadow: ['0 0 0 0 rgba(0,212,255,0.4)', '0 0 0 8px rgba(0,212,255,0)', '0 0 0 0 rgba(0,212,255,0.4)'] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}>
                      {uploadStep > i + 1 ? '✓' : i + 1}
                    </motion.div>
                    <div className="step-label">{step.label}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                ))}
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }} />
              </div>
              <motion.div className="progress-text" key={uploadStep} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                {uploadStep === 1 && 'Reading file...'}
                {uploadStep === 2 && 'Generating SHA-256 hash...'}
                {uploadStep === 3 && 'Uploading to Go backend...'}
                {uploadStep === 4 && 'Saving to MongoDB...'}
                {uploadStep === 5 && 'Sealing on Ethereum blockchain... (Check MetaMask!)'}
                {uploadStep === 6 && 'File sealed on blockchain!'}
              </motion.div>
            </motion.div>
          )}

          {/* Success */}
          {result && !uploading && (
            <motion.div key="success" variants={cardVariants} initial="initial" animate="animate" className="upload-result">
              <motion.div className="result-success-header" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <motion.span style={{ fontSize: 32, display:'flex', justifyContent:'center', marginBottom:4 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </motion.span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--green)' }}>File Sealed on Blockchain!</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{result.filename}</div>
                </div>
              </motion.div>

              <div className="result-details">
                {[
                  { label: 'File ID',      value: result.fileId },
                  { label: 'SHA-256 Hash', value: result.fileHash },
                  { label: 'File Size',    value: formatSize(result.fileSize) },
                ].map((item, i) => (
                  <motion.div key={i} className="result-item"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}>
                    <div className="result-label">{item.label}</div>
                    <div className="result-value">{item.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* TX Status */}
              {txInfo && (
                <TxStatus
                  txHash={txInfo.txHash}
                  status="success"
                  blockNumber={txInfo.blockNumber}
                  gasUsed={txInfo.gasUsed}
                />
              )}

              <motion.button className="btn btn-outline" style={{ marginTop: 16 }} whileHover={{ scale: 1.02 }} onClick={reset}>
                Upload Another File
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      {/* 3-Layer Info */}
      <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate" transition={{ delay: 0.15 }}>
        <div className="section-title" style={{ marginBottom: 20 }}>3-Layer Security System</div>
        <motion.div className="layer-grid" variants={staggerContainer} initial="initial" animate="animate">
          {LAYERS.map((item, i) => (
            <motion.div key={i} className="layer-card" style={{ borderTopColor: item.color }}
              variants={cardVariants} whileHover={{ y: -4, boxShadow: `0 12px 28px ${item.color}22` }}>
              <motion.div style={{ fontSize: 32, marginBottom: 12 }} whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>{item.icon}</motion.div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: item.color, letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' }}>{item.layer}</div>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>{item.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

    </motion.div>
  );
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));