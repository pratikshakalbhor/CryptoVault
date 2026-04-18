import { useState } from 'react';
import { verifyFile } from '../utils/api';

export default function Verify({ walletAddress }) {
  const [file, setFile]     = useState(null);
  const [drag, setDrag]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };
  const handleSelect = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const doVerify = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const data = await verifyFile(file);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setResult(null); setError(''); setLoading(false);
  };

  /* ── Determine status from various backend response shapes ── */
  const resolveStatus = data => {
    if (!data) return null;
    // Backend may return verified: true/false, or status: "VALID"/"TAMPERED"
    if (data.verified === true)  return 'VALID';
    if (data.verified === false) return 'TAMPERED';
    if (typeof data.status === 'string') return data.status.toUpperCase();
    return null;
  };
  const status = resolveStatus(result);
  const isValid = status === 'VALID';
  const fileRecord = result?.file || result?.fileRecord || result;

  return (
    <div className="page-inner" style={{ maxWidth: 640 }}>
      <div className="ph">
        <div>
          <h1>Verify File Integrity</h1>
          <p>Re-upload a file to check if it has been tampered with</p>
        </div>
      </div>

      <div className="how-it-works">
        <div className="how-step">
          <div className="how-num">1</div>
          <span className="how-lbl">Hash computed</span>
        </div>
        <span className="how-arr">→</span>
        <div className="how-step">
          <div className="how-num">2</div>
          <span className="how-lbl">Compare with blockchain</span>
        </div>
        <span className="how-arr">→</span>
        <div className="how-step">
          <div className="how-num">3</div>
          <span className="how-lbl">Result shown</span>
        </div>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 14 }}>⚠️ {error}</div>
      )}

      {!result && (
        <>
          <div
            className={`dz grn${drag ? ' on' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('vf-input').click()}
          >
            <input
              id="vf-input" type="file" style={{ display: 'none' }}
              onChange={handleSelect}
            />
            <div className="dz-ico">🔍</div>
            <h3>Drop the file you want to verify</h3>
            <p>We'll compute its hash and compare it with the blockchain record</p>
          </div>

          {file && (
            <div className="card" style={{ marginTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 19 }}>📄</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{file.type || 'unknown'}</div>
                </div>
              </div>
              <button className="btn btn-g" style={{ padding: '3px 9px', fontSize: 11 }} onClick={() => setFile(null)}>✕</button>
            </div>
          )}

          <button
            className="btn btn-teal btn-full"
            style={{ marginTop: 13 }}
            disabled={!file || loading}
            onClick={doVerify}
          >
            {loading ? '⟳ Verifying...' : '🔍 Verify Integrity'}
          </button>
        </>
      )}

      {result && status && (
        <>
          <div className={`vr ${isValid ? 'valid' : 'tampered'}`} style={{ textAlign: 'center' }}>
            <div className="vr-ico">{isValid ? '✅' : '❌'}</div>
            <h2>{isValid ? 'VALID — File is intact' : 'TAMPERED — File has been modified'}</h2>
            <p style={{ marginTop: 5 }}>
              {isValid
                ? 'SHA-256 hash matches blockchain record. This file has not been altered.'
                : 'No matching hash found in the blockchain registry. This file may have been modified.'}
            </p>
          </div>

          {isValid && fileRecord && (
            <div className="ig" style={{ marginTop: 13 }}>
              <div className="ig-hdr"><span>📋</span><h3>Verification Details</h3></div>
              {(fileRecord.hash || fileRecord.fileHash) && (
                <div className="ig-row">
                  <span className="ig-lbl">SHA-256 Hash</span>
                  <span className="ig-val mono">{fileRecord.hash || fileRecord.fileHash}</span>
                </div>
              )}
              {(fileRecord.filename || fileRecord.name) && (
                <div className="ig-row">
                  <span className="ig-lbl">Original File</span>
                  <span className="ig-val">{fileRecord.filename || fileRecord.name}</span>
                </div>
              )}
              {fileRecord.uploadedAt && (
                <div className="ig-row">
                  <span className="ig-lbl">Uploaded At</span>
                  <span className="ig-val">{new Date(fileRecord.uploadedAt).toLocaleString()}</span>
                </div>
              )}
              {fileRecord.walletAddress && (
                <div className="ig-row">
                  <span className="ig-lbl">Owner Wallet</span>
                  <span className="ig-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {fileRecord.walletAddress}
                  </span>
                </div>
              )}
              {fileRecord.txHash && (
                <div className="ig-row">
                  <span className="ig-lbl">TX Hash</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${fileRecord.txHash}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-purple)', wordBreak: 'break-all' }}
                  >
                    {(fileRecord.txHash || '').slice(0, 32)}...
                  </a>
                </div>
              )}
              <div className="ig-row">
                <span className="ig-lbl">Blockchain</span>
                <span className="ig-val" style={{ color: 'var(--accent-teal)' }}>✅ Confirmed on Sepolia</span>
              </div>
            </div>
          )}

          <div className="btn-row">
            <button className="btn btn-s" style={{ flex: 1 }} onClick={reset}>Verify Another</button>
          </div>
        </>
      )}
    </div>
  );
}