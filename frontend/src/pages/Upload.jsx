import { useState, useRef } from 'react';
import { uploadFile } from '../utils/api';

const STEPS = [
  { id: 'hash',    label: 'Generating SHA-256 hash' },
  { id: 'encrypt', label: 'Encrypting with AES-256' },
  { id: 'cloud',   label: 'Uploading to IPFS/Pinata' },
  { id: 'db',      label: 'Saving metadata to MongoDB' },
  { id: 'chain',   label: 'Registering on Sepolia blockchain' },
];

const fmtSize = b =>
  !b ? '0 B' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(2) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

export default function Upload({ walletAddress, onNavigate }) {
  const [phase, setPhase] = useState('idle');     // idle | uploading | done
  const [file, setFile]   = useState(null);
  const [drag, setDrag]   = useState(false);
  const [stepsDone, setStepsDone] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const [progress, setProgress]   = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const fileRef = useRef();

  /* ── handlers ── */
  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(''); setResult(null); }
  };
  const handleFileChange = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); setError(''); setResult(null); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setPhase('uploading');
    setStepsDone([]); setActiveStep(null); setProgress(0); setError('');
    try {
      // Simulate step-by-step progression while real upload runs
      const stepDuration = 600;
      let si = 0;
      const stepTimer = setInterval(() => {
        if (si < STEPS.length) {
          setActiveStep(STEPS[si].id);
          if (si > 0) setStepsDone(prev => [...prev, STEPS[si - 1].id]);
          setProgress(Math.round((si / STEPS.length) * 80));
          si++;
        }
      }, stepDuration);

      const data = await uploadFile(file, walletAddress || '');

      clearInterval(stepTimer);
      // Mark all steps done
      setStepsDone(STEPS.map(s => s.id));
      setActiveStep(null);
      setProgress(100);
      setResult(data);
      setPhase('done');
    } catch (err) {
      setPhase('idle');
      setError(err.message || 'Upload failed. Is the Go backend running?');
      setStepsDone([]); setActiveStep(null); setProgress(0);
    }
  };

  const reset = () => {
    setPhase('idle'); setFile(null); setStepsDone([]);
    setActiveStep(null); setProgress(0); setResult(null); setError('');
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
            {progress}% complete
          </p>
          <div className="up-steps">
            {STEPS.map(s => {
              const done   = stepsDone.includes(s.id);
              const active = activeStep === s.id;
              return (
                <div key={s.id} className="up-step">
                  <div className={`step-dot ${done ? 'sd-done' : active ? 'sd-act' : 'sd-pend'}`}>
                    {done ? '✓' : active ? '⟳' : '○'}
                  </div>
                  <span style={{
                    color: done ? 'var(--text-primary)' : active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 400,
                  }}>
                    {s.label}
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
    return (
      <div className="page-inner" style={{ maxWidth: 640 }}>
        <div className="ph"><div><h1>Upload File</h1><p>Encrypt, store, and register on the blockchain</p></div></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div className="vr valid" style={{ textAlign: 'center' }}>
            <div className="vr-ico">✅</div>
            <h2>File Registered Successfully!</h2>
            <p>Encrypted, stored, and registered on the Sepolia blockchain.</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Registration Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <DetailRow label="SHA-256 Hash">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                  {file_.hash || file_.fileHash}
                </span>
              </DetailRow>
              <DetailRow label="Blockchain TX">
                <a
                  href={`https://sepolia.etherscan.io/tx/${file_.txHash}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-purple)', wordBreak: 'break-all' }}
                >
                  {(file_.txHash || '').slice(0, 35)}...
                </a>
              </DetailRow>
              {file_.cloudURL || file_.ipfsURL ? (
                <DetailRow label="Storage URL">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {file_.cloudURL || file_.ipfsURL}
                  </span>
                </DetailRow>
              ) : null}
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-s" style={{ flex: 1 }} onClick={reset}>Upload Another</button>
            <button className="btn btn-p" style={{ flex: 1 }} onClick={() => onNavigate('my-files')}>View My Files</button>
          </div>
        </div>
      </div>
    );
  }

  /* IDLE */
  return (
    <div className="page-inner" style={{ maxWidth: 640 }}>
      <div className="ph"><div><h1>Upload File</h1><p>Encrypt, store, and register on the blockchain</p></div></div>

      {error && (
        <div className="error-box" style={{ marginBottom: 14 }}>
          ⚠️ {error}
        </div>
      )}

      <div
        className={`dz${drag ? ' on' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
        <div className="dz-ico">📂</div>
        <h3>Drag &amp; drop a file, or click to select</h3>
        <p>Your file will be encrypted with AES-256 before upload</p>
        <small>PDF, JPEG, PNG, TXT — max 50 MB</small>
      </div>

      {file && (
        <div className="card" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ fontSize: 20 }}>📄</span>
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
            onClick={() => setFile(null)}
          >✕</button>
        </div>
      )}

      <div className="sec-info">
        <span className="sec-row">🔒 <strong>AES-256 encryption</strong> applied before upload</span>
        <span className="sec-row">🔗 <strong>SHA-256 hash</strong> registered on Sepolia blockchain</span>
        <span className="sec-row">☁️ Encrypted file stored on <strong>IPFS/Pinata</strong></span>
      </div>

      <button
        className="btn btn-teal btn-full"
        style={{ marginTop: 14 }}
        disabled={!file}
        onClick={handleUpload}
      >
        ⬆️ Upload &amp; Register on Blockchain
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