import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { uploadFile } from '../utils/api';
import { sealFileOnBlockchain } from '../utils/blockchain';
import { Activity, AlertTriangle, CheckCircle, Circle, Cloud, FileText, Folder, Link, Lock, RefreshCw, UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'hash',    label: 'Generating Secure Hash' },
  { id: 'upload',  label: 'Encrypting & Storing' },
  { id: 'chain',   label: 'Sealing on Blockchain' },
];

const fmtSize = b =>
  !b ? '0 B' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(2) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

// Helper to hash file on client
async function calculateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Upload({ walletAddress }) {
  const navigate = useNavigate();
  const [phase, setPhase]         = useState('idle');     // idle | uploading | done
  const [file, setFile]            = useState(null);
  const [expiryDate, setExpiryDate]= useState('');
  const [drag, setDrag]            = useState(false);
  const [stepsDone, setStepsDone]  = useState([]);
  const [activeStep, setActiveStep]= useState(null);
  const [progress, setProgress]    = useState(0);
  const [result, setResult]        = useState(null);
  const [chainStatus, setChainStatus] = useState(''); 
  const fileRef = useRef();

  const handleUpload = async (e) => {
    if (e) e.preventDefault();
    if (!file) return;

    if (!window.ethereum) {
      toast.error('MetaMask is not installed.');
      return;
    }

    setPhase('uploading');
    setStepsDone([]);
    setActiveStep('hash');
    setProgress(10);

    try {
      // ── STEP 1: HASH ──
      console.log('Calculating hash...');
      const fileHash = await calculateFileHash(file);
      setStepsDone(prev => [...prev, 'hash']);
      setProgress(40);

      // ── STEP 2: UPLOAD ──
      setActiveStep('upload');
      const formattedExpiry = expiryDate ? new Date(expiryDate).toISOString() : null;
      // Pass fileHash to uploadFile, but skip signature
      const data = await uploadFile(file, walletAddress || '', formattedExpiry, null, null, fileHash);
      console.log('✅ Backend response:', data);

      const file_ = data.file || data;
      // Map storage URL from backend for display in success card
      if (!file_.cloudURL && !file_.ipfsURL) {
        file_.ipfsURL = file_.ipfsURL || file_.encryptedUrl || file_.ipfsCID ? 
          (file_.encryptedUrl || `https://gateway.pinata.cloud/ipfs/${file_.ipfsCID}`) : '';
      }
      setStepsDone(prev => [...prev, 'upload']);
      setProgress(75);

      // ── STEP 4: BLOCKCHAIN SEAL ──
      setActiveStep('chain');
      setChainStatus('waiting');
      setProgress(90);

      try {
        const blockchainResult = await sealFileOnBlockchain({
          fileHash: file_.fileHash || fileHash,
          ipfsCID:  file_.ipfsCID
        });

        const txHash = blockchainResult.txHash;
        setChainStatus('confirmed');
        file_.txHash = txHash;
        file_.txSuccess = true;

        // Sync txHash
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        await fetch(`${API_URL}/api/files/${file_.fileId || data.fileId}/tx`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash: txHash })
        });

        toast.success("File sealed successfully!");
      } catch (chainErr) {
        console.error('Blockchain error:', chainErr);
        file_.txSuccess = false;
        toast.error("Blockchain sealing failed. Metadata saved safely.");
      }

      setStepsDone(STEPS.map(s => s.id));
      setProgress(100);
      setResult(file_);
      setPhase('done');

    } catch (err) {
      console.error('Upload failed:', err);
      setPhase('idle');
      toast.error(err.message || 'Upload failed');
    }
  };

  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); }
  };
  
  const handleFileChange = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); }
  };

  const reset = () => {
    setPhase('idle'); setFile(null); setExpiryDate('');
    setStepsDone([]); setActiveStep(null); setProgress(0);
    setResult(null); setChainStatus('');
  };

  /* ── UI phases ── */
  if (phase === 'uploading') {
    return (
      <div className="page-inner" style={{ maxWidth: 640 }}>
        <div className="ph"><div><h1>Upload File</h1><p>Encrypt, store, and register on the blockchain</p></div></div>
      <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>Processing your file...</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 18 }}>{file?.name}</p>
          <div className="progress" style={{ height: 8 }}>
            <div className="progress-fill fill-cyan" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 5, marginBottom: 18 }}>
            {chainStatus === 'waiting'
              ? '🦊 Waiting for MetaMask... Please confirm in MetaMask popup.'
              : `${progress}% complete`}
          </p>
          <div className="up-steps">
            {STEPS.map(s => {
              const done   = stepsDone.includes(s.id);
              const active = activeStep === s.id;
              return (
                <div key={s.id} className="up-step">
                  <div className={`step-dot ${done ? 'sd-done' : active ? 'sd-act' : 'sd-pend'}`}>
                     {done ? <CheckCircle size={18} /> : active && s.id === 'chain' ? <Activity size={18} /> : active ? <RefreshCw size={18} /> : <Circle size={18} />}
                  </div>
                  <span style={{
                    color: done ? 'var(--text-primary)' : active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 400,
                  }}>
                    {s.id === 'chain' && active ? 'Waiting for Blockchain Confirmation...' : s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'done' && result) {
    const file_ = result.file || result;
    const sealed = file_.txSuccess === true;
    return (
      <div className="page-inner" style={{ maxWidth: 640 }}>
        <div className="ph"><div><h1>Upload File</h1><p>Encrypt, store, and register on the blockchain</p></div></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {sealed ? (
            <motion.div className="success-modal vr valid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>✅ File uploaded successfully!</h3>
              <p style={{ color: 'var(--text-muted)' }}>You can verify this file anytime in the future to check if it has been modified.</p>
              <div className="btn-group" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                <button className="btn btn-p" onClick={() => navigate('/verify?id=' + (file_.fileId || file_.id))}>Verify This File</button>
                <button className="btn btn-s" onClick={() => navigate('/my-files')}>View My Files</button>
              </div>
            </motion.div>
          ) : (
            <div className="vr" style={{ textAlign: 'center', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)' }}>
              <div className="vr-ico" style={{ color: '#fbbf24' }}><AlertTriangle size={18} /></div>
              <h2 style={{ color: '#fbbf24' }}>File Saved (Not Sealed) ⚠️</h2>
              <p style={{ color: 'var(--text-secondary)' }}>File stored in backend, but MetaMask transaction was not confirmed.</p>
            </div>
          )}
          <div className="card">
            <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Registration Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <DetailRow label="File Identity">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                  {file_.hash || file_.fileHash}
                </span>
              </DetailRow>
              <DetailRow label="Digital Seal">
                {sealed && file_.txHash && file_.txHash.length === 66 ? (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${file_.txHash}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-purple)', wordBreak: 'break-all' }}
                  >
                    {file_.txHash}
                  </a>
                ) : (
                  <span style={{ fontSize: 10, color: '#fca5a5' }}>
                    {file_.txHash ? 'Invalid Record' : 'Not sealed — MetaMask rejected'}
                  </span>
                )}
              </DetailRow>
              {file_.cloudURL || file_.ipfsURL ? (
                <DetailRow label="Storage URL">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {file_.cloudURL || file_.ipfsURL}
                  </span>
                </DetailRow>
              ) : null}
              {(file_.expiresAt || file_.expiryDate) && (
                <DetailRow label="Expiry Date">
                  <span style={{ fontSize: 10, color: 'var(--accent-orange)' }}>
                    {new Date(file_.expiresAt || file_.expiryDate).toLocaleString()}
                  </span>
                </DetailRow>
              )}
            </div>
          </div>
          
          {/* Etherscan Direct Button */}
          {file_.txHash && file_.txHash.length === 66 && (
            <div className="btn-row" style={{ marginTop: 8 }}>
               <a
                  href={`https://sepolia.etherscan.io/tx/${file_.txHash}`}
                  target="_blank" rel="noreferrer"
                  className="btn btn-purple" 
                  style={{ flex: 1, textAlign: 'center', textDecoration: 'none', justifyContent: 'center' }}
                >
                  <Link size={18} /> View Official Record
                </a>
            </div>
          )}

          <div className="btn-row" style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="btn btn-g" style={{ flex: 1 }} onClick={reset}>Upload Another</button>
          </div>
        </div>
      </div>
    );
  }

  /* IDLE */
  return (
    <div className="page-inner" style={{ maxWidth: 640 }}>
      <div className="ph"><div><h1>Upload File</h1><p>Encrypt, store, and register on the blockchain</p></div></div>

      <div
        className={`dz${drag ? ' on' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
        <div className="dz-ico"><Folder size={18} /></div>
        <h3>Drag &amp; drop a file, or click to select</h3>
        <p>Your file will be encrypted with AES-256 before upload</p>
        <small>PDF, JPEG, PNG, TXT — max 50 MB</small>
      </div>

      {file && (
        <>
          <div className="card" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ fontSize: 20 }}><FileText size={18} /></span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                  {fmtSize(file.size)} · {file.type || 'unknown'}
                </div>
              </div>
            </div>
            <button
              className="btn btn-g"
              style={{ padding: '3px 9px', fontSize: 11 }}
              onClick={() => { setFile(null); setExpiryDate(''); }}
            ><X size={18} /></button>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Expiry Date (Optional)
            </label>
            <input 
              type="datetime-local" 
              className="search-bar input" 
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 13px', color: 'var(--text-primary)', fontFamily: 'var(--font-main)', margin: 0 }}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="sec-info">
        <span className="sec-row"><Lock size={18} /> <strong>AES-256 encryption</strong> applied before upload</span>
        <span className="sec-row"><Link size={18} /> <strong>SHA-256 hash</strong> registered on Sepolia blockchain</span>
        <span className="sec-row"><Cloud size={18} /> Encrypted file stored on <strong>IPFS/Pinata</strong></span>
      </div>

      <button
        className="btn btn-teal btn-full"
        style={{ marginTop: 14 }}
        disabled={!file || phase === 'uploading'}
        onClick={handleUpload}
      >
        {phase === 'uploading' && activeStep === 'chain'
          ? <><Activity size={18} /> Waiting for Blockchain...</>
          : phase === 'uploading'
          ? <><RefreshCw size={18} /> Processing...</>
          : <><UploadCloud size={18} /> Upload &amp; Seal via MetaMask <Activity size={18} /></>}
      </button>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', minWidth: 110 }}>
        {label}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}