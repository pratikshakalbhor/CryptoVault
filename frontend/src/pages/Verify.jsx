import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyFile, getFileById } from '../utils/api';
import { generateCertificate } from '../utils/generateCertificate';
import {
  AlertTriangle, Award, CheckCircle, Clipboard,
  FileText, RefreshCw, Search, X
} from 'lucide-react';

export default function Verify({ walletAddress }) {
  const [searchParams]   = useSearchParams();
  const navigate          = useNavigate();
  const preloadedId       = searchParams.get('id'); // e.g. ?id=abc123

  // Pre-loaded metadata state (from URL param)
  const [metadata, setMetadata]   = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);

  // File drop state
  const [file, setFile]     = useState(null);
  const [drag, setDrag]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  // ── Auto-fetch metadata when ?id= is present ──────────────────────
  useEffect(() => {
    if (!preloadedId) return;
    setMetaLoading(true);
    getFileById(preloadedId)
      .then(res => {
        const f = res.file || res;
        setMetadata(f);
      })
      .catch(err => setError(`Could not load file info: ${err.message}`))
      .finally(() => setMetaLoading(false));
  }, [preloadedId]);

  // ── Drag & drop handlers ───────────────────────────────────────────
  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };
  const handleSelect = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  // ── Verify ────────────────────────────────────────────────────────
  const doVerify = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const data = await verifyFile(file, preloadedId || undefined);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setResult(null); setError('');
    if (preloadedId) navigate('/verify', { replace: true });
  };

  // ── Status resolution ─────────────────────────────────────────────
  const resolveStatus = data => {
    if (!data) return null;
    if (data.verified === true)  return 'VALID';
    if (data.verified === false) return 'TAMPERED';
    if (typeof data.status === 'string') return data.status.toUpperCase();
    return null;
  };

  const status      = resolveStatus(result);
  const isValid     = status === 'VALID' || status === 'SAFE';
  const fileRecord  = result?.file || result?.fileRecord || metadata || result;

  // ── Download Certificate ──────────────────────────────────────────
  const handleCertificate = () => {
    if (!fileRecord) return;
    generateCertificate({
      filename:     fileRecord.filename || fileRecord.name || 'Unknown',
      fileId:       fileRecord.fileId   || fileRecord.id   || preloadedId,
      uploadedAt:   fileRecord.uploadedAt,
      walletAddress: fileRecord.walletAddress || walletAddress,
      originalHash: fileRecord.hash || fileRecord.fileHash,
      txHash:       fileRecord.txHash,
    });
  };

  return (
    <div className="page-inner" style={{ maxWidth: 660 }}>
      <div className="ph">
        <div>
          <h1>Verify File Integrity</h1>
          <p>
            {preloadedId
              ? 'File pre-loaded from blockchain — drop the file below to confirm integrity'
              : 'Drop any file to check its blockchain record'}
          </p>
        </div>
      </div>

      {/* ── Pre-loaded metadata panel ── */}
      {preloadedId && (
        <div className="ig" style={{ marginBottom: 18 }}>
          <div className="ig-hdr">
            <span><Clipboard size={16} /></span>
            <h3>Blockchain Record {metaLoading && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(loading...)</span>}</h3>
          </div>
          {metadata ? (
            <>
              <div className="ig-row"><span className="ig-lbl">Filename</span><span className="ig-val">{metadata.filename || metadata.name}</span></div>
              <div className="ig-row"><span className="ig-lbl">SHA-256</span><span className="ig-val mono" style={{ wordBreak: 'break-all', fontSize: 10 }}>{metadata.hash || metadata.fileHash}</span></div>
              <div className="ig-row"><span className="ig-lbl">Uploaded</span><span className="ig-val">{metadata.uploadedAt ? new Date(metadata.uploadedAt).toLocaleString() : '—'}</span></div>
              <div className="ig-row"><span className="ig-lbl">Status</span>
                <span className="ig-val" style={{ color: metadata.status === 'valid' ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
                  {(metadata.status || 'pending').toUpperCase()}
                </span>
              </div>
            </>
          ) : !metaLoading && (
            <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 12 }}>File record not found for ID: {preloadedId}</div>
          )}
        </div>
      )}

      {/* ── Drop zone & verify button ── */}
      {!result && (
        <>
          {error && <div className="error-box" style={{ marginBottom: 14 }}><AlertTriangle size={16} /> {error}</div>}

          <div
            className={`dz grn${drag ? ' on' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('vf-input').click()}
          >
            <input id="vf-input" type="file" style={{ display: 'none' }} onChange={handleSelect} />
            <div className="dz-ico"><Search size={18} /></div>
            <h3>
              {preloadedId
                ? 'Drop the original file to confirm authenticity'
                : 'Drop any file to verify its blockchain record'}
            </h3>
            <p>SHA-256 hash will be computed and compared with the on-chain record</p>
          </div>

          {file && (
            <div className="card" style={{ marginTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{file.type || 'unknown type'}</div>
                </div>
              </div>
              <button className="btn btn-g" style={{ padding: '3px 9px', fontSize: 11 }} onClick={() => setFile(null)}><X size={16} /></button>
            </div>
          )}

          <button
            className="btn btn-teal btn-full"
            style={{ marginTop: 13 }}
            disabled={!file || loading}
            onClick={doVerify}
          >
            {loading
              ? <><RefreshCw size={16} /> Verifying...</>
              : <><Search size={16} /> Verify Integrity</>}
          </button>
        </>
      )}

      {/* ── Verification Result ── */}
      {result && status && (
        <>
          <div className={`vr ${isValid ? 'valid' : 'tampered'}`} style={{ textAlign: 'center' }}>
            <div className="vr-ico">{isValid ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}</div>
            <h2>{isValid ? '✅ AUTHENTIC — File is intact' : '⚠️ TAMPERED — File has been modified'}</h2>
            <p style={{ marginTop: 5 }}>
              {isValid
                ? 'SHA-256 hash matches blockchain record. This file has not been altered.'
                : 'No matching hash found. This file may have been modified after upload.'}
            </p>
          </div>

          {/* Verification details */}
          {fileRecord && (
            <div className="ig" style={{ marginTop: 13 }}>
              <div className="ig-hdr"><span><Clipboard size={16} /></span><h3>Verification Details</h3></div>
              {(fileRecord.hash || fileRecord.fileHash) && (
                <div className="ig-row">
                  <span className="ig-lbl">SHA-256 Hash</span>
                  <span className="ig-val mono" style={{ wordBreak: 'break-all', fontSize: 10 }}>{fileRecord.hash || fileRecord.fileHash}</span>
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
                  <span className="ig-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{fileRecord.walletAddress}</span>
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
                    {fileRecord.txHash.slice(0, 32)}... ↗
                  </a>
                </div>
              )}
              <div className="ig-row">
                <span className="ig-lbl">Blockchain</span>
                <span className="ig-val" style={{ color: 'var(--accent-teal)' }}><CheckCircle size={13} style={{ marginRight: 4 }} />Confirmed on Sepolia</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn btn-s" style={{ flex: 1 }} onClick={reset}>Verify Another</button>
            {/* ── Download Certificate — only shown when VALID ── */}
            {isValid && (
              <button className="btn btn-pu" style={{ flex: 1 }} onClick={handleCertificate}>
                <Award size={16} /> Download Certificate
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}