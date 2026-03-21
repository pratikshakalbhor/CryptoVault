import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Upload.css';
import { pageVariants, staggerContainer, cardVariants, fadeIn } from '../utils/animations';

interface UploadProps { onNotify: (msg: string, type: string) => void; }

const STEPS = [
  { label: 'Encrypt', desc: 'AES-256'    },
  { label: 'Hash',    desc: 'SHA-256'    },
  { label: 'Upload',  desc: 'Cloudinary' },
  { label: 'Seal',    desc: 'Blockchain' },
  { label: 'Done',    desc: 'Complete!'  },
];

const LAYERS = [
  { icon: '🔐', layer: 'Layer 1', title: 'AES-256 Encryption',  color: 'var(--accent)', desc: 'File encrypted before upload. Only you can decrypt with your private key.' },
  { icon: '📝', layer: 'Layer 2', title: 'SHA-256 Hashing',     color: 'var(--yellow)', desc: 'Unique digital fingerprint. Even 1 byte change = completely different hash.' },
  { icon: '⛓️', layer: 'Layer 3', title: 'Blockchain Seal',     color: 'var(--green)',  desc: 'Hash stored permanently on Ethereum. Immutable and tamper-proof forever.' },
];

export default function Upload({ onNotify }: UploadProps) {
  const [dragging,       setDragging]       = useState(false);
  const [selectedFile,   setSelectedFile]   = useState<File | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadStep,     setUploadStep]     = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatedHash,  setGeneratedHash]  = useState<string | null>(null);
  const [txHash,         setTxHash]         = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { setSelectedFile(e.target.files[0]); setGeneratedHash(null); setTxHash(null); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const simulateUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const progress = [15, 35, 60, 85, 100];
    for (let i = 0; i < 5; i++) {
      setUploadStep(i + 1); setUploadProgress(progress[i]);
      if (i === 1) setGeneratedHash(Array.from({ length:64 }, () => Math.floor(Math.random()*16).toString(16)).join(''));
      if (i === 3) setTxHash('0x' + Array.from({ length:40 }, () => Math.floor(Math.random()*16).toString(16)).join(''));
      await new Promise(r => setTimeout(r, 900));
    }
    setUploading(false);
    onNotify('✅ File sealed on blockchain successfully!', 'success');
  };

  const reset = () => { setSelectedFile(null); setUploadStep(0); setUploadProgress(0); setGeneratedHash(null); setTxHash(null); };
  const formatSize = (b: number) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(2) + ' MB';

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Upload Card */}
      <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate">
        <div className="section-header">
          <span className="section-title">Upload & Seal File</span>
          <span className="section-badge">AES-256 + SHA-256 + Blockchain</span>
        </div>

        <AnimatePresence mode="wait">

          {/* Drop Zone */}
          {!selectedFile && !uploading && (
            <motion.div key="dropzone" variants={fadeIn} initial="initial" animate="animate" exit={{ opacity:0, scale:0.97 }}>
              <motion.div
                className={`drop-zone ${dragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ borderColor:'var(--accent)', background:'rgba(0,212,255,0.04)' }}
                animate={dragging ? { scale:1.01, borderColor:'var(--accent)' } : { scale:1 }}
              >
                <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleFileSelect} />
                <motion.span className="drop-icon" animate={{ y:[0,-6,0] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}>📂</motion.span>
                <div className="drop-title">Drop file here or click to browse</div>
                <div className="drop-sub">Any file type · Max 100MB · AES-256 encrypted automatically</div>
              </motion.div>
            </motion.div>
          )}

          {/* File Selected */}
          {selectedFile && !uploading && uploadStep === 0 && (
            <motion.div key="selected" variants={cardVariants} initial="initial" animate="animate" exit={{ opacity:0, x:-20 }}>
              <div className="file-selected">
                <motion.div className="file-icon-box" whileHover={{ rotate:5 }}>📄</motion.div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatSize(selectedFile.size)} · {selectedFile.type || 'unknown'}</div>
                </div>
                <motion.button className="btn btn-outline sm" whileTap={{ scale:0.95 }} onClick={reset}>✕</motion.button>
                <motion.button className="btn btn-primary" whileHover={{ scale:1.04, boxShadow:'0 8px 24px rgba(0,212,255,0.3)' }} whileTap={{ scale:0.97 }} onClick={simulateUpload}>
                  🔒 Encrypt & Seal
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Progress */}
          {uploading && (
            <motion.div key="progress" variants={fadeIn} initial="initial" animate="animate" className="progress-container">
              <div className="progress-steps">
                {STEPS.map((step, i) => (
                  <div key={i} className={`step ${uploadStep > i+1 ? 'done' : uploadStep === i+1 ? 'active' : ''}`}>
                    <motion.div className="step-dot"
                      animate={uploadStep === i+1 ? { boxShadow:['0 0 0 0 rgba(0,212,255,0.4)', '0 0 0 8px rgba(0,212,255,0)', '0 0 0 0 rgba(0,212,255,0.4)'] } : {}}
                      transition={{ duration:1, repeat:Infinity }}>
                      {uploadStep > i+1 ? '✓' : i+1}
                    </motion.div>
                    <div className="step-label">{step.label}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                ))}
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill" initial={{ width:'0%' }} animate={{ width:`${uploadProgress}%` }} transition={{ duration:0.5, ease:'easeOut' }} />
              </div>
              <motion.div className="progress-text" key={uploadStep} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}>
                {uploadStep === 1 && '🔐 Encrypting file with AES-256...'}
                {uploadStep === 2 && '📝 Generating SHA-256 hash fingerprint...'}
                {uploadStep === 3 && '☁️ Uploading encrypted file to Cloudinary...'}
                {uploadStep === 4 && '⛓️ Sealing hash on Ethereum blockchain...'}
                {uploadStep === 5 && '✅ Transaction confirmed on Sepolia!'}
              </motion.div>
            </motion.div>
          )}

          {/* Success */}
          {!uploading && uploadStep === 5 && generatedHash && txHash && (
            <motion.div key="success" variants={cardVariants} initial="initial" animate="animate" className="upload-result">
              <motion.div className="result-success-header" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}>
                <motion.span style={{ fontSize:32 }} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:300 }}>✅</motion.span>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:'var(--green)' }}>File Sealed Successfully!</div>
                  <div style={{ fontSize:12, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>{selectedFile?.name}</div>
                </div>
              </motion.div>
              <div className="result-details">
                {[
                  { label:'SHA-256 Hash', value: generatedHash },
                  { label:'Blockchain TX Hash', value: txHash, color:'var(--accent)' },
                  { label:'Network', value:'Ethereum Sepolia Testnet' },
                ].map((item, i) => (
                  <motion.div key={i} className="result-item" initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.1 }}>
                    <div className="result-label">{item.label}</div>
                    <div className="result-value" style={{ color: (item as any).color || 'var(--text)' }}>{item.value}</div>
                  </motion.div>
                ))}
              </div>
              <motion.button className="btn btn-outline" whileHover={{ scale:1.02 }} onClick={reset}>Upload Another File</motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      {/* 3-Layer Security */}
      <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate" transition={{ delay:0.15 }}>
        <div className="section-title" style={{ marginBottom:20 }}>3-Layer Security System</div>
        <motion.div className="layer-grid" variants={staggerContainer} initial="initial" animate="animate">
          {LAYERS.map((item, i) => (
            <motion.div key={i} className="layer-card" style={{ borderTopColor: item.color }}
              variants={cardVariants} whileHover={{ y:-4, boxShadow:`0 12px 28px ${item.color}22` }}>
              <motion.div style={{ fontSize:32, marginBottom:12 }} whileHover={{ rotate:[0,-10,10,0] }} transition={{ duration:0.4 }}>{item.icon}</motion.div>
              <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:item.color, letterSpacing:1.5, marginBottom:6, textTransform:'uppercase' }}>{item.layer}</div>
              <div style={{ fontWeight:700, marginBottom:8, fontSize:14 }}>{item.title}</div>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>{item.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

    </motion.div>
  );
}