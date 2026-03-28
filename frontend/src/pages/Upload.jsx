import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Upload.css';
import { pageVariants, staggerContainer, cardVariants, fadeIn } from '../utils/animations';
import { uploadFile } from '../utils/api';

const STEPS = [
  { label: 'Read',    desc: 'File read'   },
  { label: 'Hash',    desc: 'SHA-256'     },
  { label: 'Upload',  desc: 'Go Backend'  },
  { label: 'Save',    desc: 'MongoDB'     },
  { label: 'Done',    desc: 'Complete!'   },
];

const LAYERS = [
  { icon: '🔐', layer: 'Layer 1', title: 'AES-256 Encryption',  color: 'var(--accent)', desc: 'File encrypted before upload. Only you can decrypt with your private key.' },
  { icon: '📝', layer: 'Layer 2', title: 'SHA-256 Hashing',     color: 'var(--yellow)', desc: 'Unique digital fingerprint. Even 1 byte change = completely different hash.' },
  { icon: '⛓️', layer: 'Layer 3', title: 'Blockchain Seal',     color: 'var(--green)',  desc: 'Hash stored permanently on Ethereum. Immutable and tamper-proof forever.' },
];

export default function Upload({ onNotify, walletAddress }) {
  const [dragging,      setDragging]      = useState(false);
  const [selectedFile,  setSelectedFile]  = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const [uploadStep,    setUploadStep]    = useState(0);
  const [uploadProgress,setUploadProgress]= useState(0);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null); setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !walletAddress) return;
    setUploading(true); setError(''); setResult(null);

    try {
      // Step 1
      setUploadStep(1); setUploadProgress(15);
      await delay(400);

      // Step 2
      setUploadStep(2); setUploadProgress(35);
      await delay(400);

      // Step 3 — Real Go Backend API Call
      setUploadStep(3); setUploadProgress(60);
      const data = await uploadFile(selectedFile, walletAddress);

      // Step 4
      setUploadStep(4); setUploadProgress(85);
      await delay(400);

      // Step 5
      setUploadStep(5); setUploadProgress(100);
      await delay(300);

      setResult(data);
      setUploading(false);
      onNotify('✅ File uploaded and sealed successfully!', 'success');

    } catch (err) {
      setError(err.message);
      setUploading(false);
      setUploadStep(0); setUploadProgress(0);
      onNotify('❌ Upload failed: ' + err.message, 'error');
    }
  };

  const reset = () => {
    setSelectedFile(null); setUploadStep(0);
    setUploadProgress(0); setResult(null); setError('');
  };

  const formatSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Upload Card */}
      <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate">
        <div className="section-header">
          <span className="section-title">Upload & Seal File</span>
          <span className="section-badge">SHA-256 + MongoDB + Blockchain</span>
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
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>📂</motion.span>
                <div className="drop-title">Drop file here or click to browse</div>
                <div className="drop-sub">Any file type · Max 100MB · SHA-256 hash generated automatically</div>
              </motion.div>
            </motion.div>
          )}

          {/* File Selected */}
          {selectedFile && !uploading && !result && (
            <motion.div key="selected" variants={cardVariants} initial="initial" animate="animate">
              {error && (
                <div style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                  ⚠️ {error}
                </div>
              )}
              <div className="file-selected">
                <motion.div className="file-icon-box" whileHover={{ rotate: 5 }}>📄</motion.div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatSize(selectedFile.size)} · {selectedFile.type || 'unknown'}</div>
                </div>
                <motion.button className="btn btn-outline sm" whileTap={{ scale: 0.95 }} onClick={reset}>✕</motion.button>
                <motion.button className="btn btn-primary"
                  whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(0,212,255,0.3)' }}
                  whileTap={{ scale: 0.97 }} onClick={handleUpload}>
                  🔒 Upload & Seal
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
                {uploadStep === 1 && '📖 Reading file...'}
                {uploadStep === 2 && '📝 Generating SHA-256 hash...'}
                {uploadStep === 3 && '☁️ Uploading to Go backend + MongoDB...'}
                {uploadStep === 4 && '💾 Saving to database...'}
                {uploadStep === 5 && '✅ File sealed successfully!'}
              </motion.div>
            </motion.div>
          )}

          {/* Success Result */}
          {result && !uploading && (
            <motion.div key="success" variants={cardVariants} initial="initial" animate="animate" className="upload-result">
              <motion.div className="result-success-header"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <motion.span style={{ fontSize: 32 }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}>✅</motion.span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--green)' }}>File Sealed Successfully!</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{result.filename}</div>
                </div>
              </motion.div>

              <div className="result-details">
                {[
                  { label: 'File ID',        value: result.fileId,   color: 'var(--accent)' },
                  { label: 'SHA-256 Hash',   value: result.fileHash, color: 'var(--text)'   },
                  { label: 'TX Hash (Mock)', value: result.txHash,   color: 'var(--accent)' },
                  { label: 'File Size',      value: formatSize(result.fileSize), color: 'var(--text)' },
                ].map((item, i) => (
                  <motion.div key={i} className="result-item"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}>
                    <div className="result-label">{item.label}</div>
                    <div className="result-value" style={{ color: item.color }}>{item.value}</div>
                  </motion.div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button className="btn btn-outline" whileHover={{ scale: 1.02 }} onClick={reset}>
                  Upload Another File
                </motion.button>
                <motion.button className="btn btn-primary" whileHover={{ scale: 1.02 }}>
                  ⛓ Seal on Blockchain →
                </motion.button>
              </div>
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
              <motion.div style={{ fontSize: 32, marginBottom: 12 }}
                whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>{item.icon}</motion.div>
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