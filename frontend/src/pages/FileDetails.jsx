import { useState, useEffect } from 'react';
import { downloadCertificate, getFileVersions } from '../utils/api';

const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

export default function FileDetails({ file, onNavigate }) {
  const [copied, setCopied] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    if (file && (file.fileId || file.id)) {
      getFileVersions(file.fileId || file.id)
        .then(res => {
          if (res.success && res.versions) setVersions(res.versions);
        }).catch(err => console.error("Error fetching versions:", err));
    }
  }, [file]);

  if (!file) {
    return (
      <div className="empty">
        No file data available.{' '}
        <button className="view-all" onClick={() => onNavigate('my-files')}>Go to My Files</button>
      </div>
    );
  }

  const name    = file.filename || file.name || 'Unknown';
  const hash    = file.hash || file.fileHash || '';
  const txHash  = file.txHash || '';
  const network = file.network || 'Sepolia Testnet';
  const shareURL = file.shareURL || `${window.location.origin}/verify-public/${file.publicId || file.fileId || file.id}`;
  const cloudURL = file.cloudURL || file.ipfsURL || file.storageURL || '';
  const isValid = file.status === 'valid';
  const isTampered = file.status === 'tampered';
  const isExpired = file.isExpired || (file.expiryDate && new Date(file.expiryDate) < new Date());
  const isImage = file.fileType?.startsWith('image/') || /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(name);
  const isPdf = file.fileType === 'application/pdf' || /\.pdf$/i.test(name);

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Blockchain File Verification',
          text: `Verify the authenticity of this file: ${name}`,
          url: shareURL,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCert = async () => {
    if (!file.fileId && !file.id) return;
    setCertLoading(true);
    try {
      await downloadCertificate(file.fileId || file.id);
    } catch (err) {
      alert('Certificate download failed: ' + err.message);
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="page-inner" style={{ maxWidth: 700 }}>
      <button className="back-btn" onClick={() => onNavigate('my-files')}>← Back</button>

      {isExpired && (
        <div className="error-box" style={{ marginBottom: 15, background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          ⚠️ This file's verification lifespan expired on {new Date(file.expiryDate).toLocaleString()}
        </div>
      )}

      {/* Large Status Badge */}
      <div className={`vr ${isValid ? 'valid' : isTampered ? 'tampered' : ''}`} style={{ textAlign: 'center', marginBottom: 20 }}>
        <div className="vr-ico">{isValid ? '✅' : isTampered ? '❌' : '⏳'}</div>
        <h2>{isValid ? 'This file is authentic' : isTampered ? 'This file is tampered!' : 'Verification Pending'}</h2>
        <p style={{ marginTop: 5, fontSize: 13 }}>
          {isValid
            ? 'The integrity of this file has been verified securely on the blockchain. It matches the original uploaded record perfectly.'
            : isTampered
            ? 'Warning: The contents of this file do not match the blockchain record or it has been maliciously modified.'
            : 'This file is currently being processed by the blockchain network.'}
        </p>
      </div>

      <div className="det-hero">
        <div style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
          
          {/* File Preview */}
          <div className="preview-container">
            {isImage && cloudURL ? (
              <img src={cloudURL} alt={name} className="preview-img" />
            ) : isPdf && cloudURL ? (
              <embed src={cloudURL} type="application/pdf" width="100%" height="350px" style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="preview-icon">📄</div>
              </div>
            )}
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{name}</div>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>{fmtSize(file.fileSize)} • {file.fileType || 'Unknown format'}</div>
          </div>

          {/* Action Buttons */}
          <div className="det-acts" style={{ justifyContent: 'center' }}>
             {cloudURL && (
              <a href={cloudURL} download={name} className="btn btn-teal">
                ⬇️ Download Original File
              </a>
            )}
            <button className="btn btn-pu" onClick={handleCert} disabled={certLoading || !isValid}>
              {certLoading ? 'Generating...' : '🏅 Download Proof Certificate'}
            </button>
          </div>

          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 5 }}>
            <button className="btn btn-g" onClick={handleNativeShare}>📤 Share</button>
            <button className="btn btn-g" onClick={handleCopy}>🔗 {copied ? 'Copied Link!' : 'Copy Verification Link'}</button>
          </div>

        </div>
      </div>

      <div className="ig">
        <div className="ig-hdr"><span>🔗</span><h3>Blockchain Information</h3></div>
        <div className="ig-row">
          <span className="ig-lbl">TX Hash</span>
          {txHash ? (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank" rel="noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-purple)', wordBreak: 'break-all' }}
            >
              {txHash} ↗
            </a>
          ) : <span className="ig-val">—</span>}
        </div>
        <div className="ig-row">
          <span className="ig-lbl">SHA-256 Hash</span>
          <span className="ig-val mono">{hash || '—'}</span>
        </div>
        <div className="ig-row">
          <span className="ig-lbl">Timestamp</span>
          <span className="ig-val">{file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : '—'}</span>
        </div>
        <div className="ig-row"><span className="ig-lbl">Network</span><span className="ig-val" style={{color: 'var(--accent-cyan)'}}>{network}</span></div>
      </div>

      {versions?.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 className="sec-title" style={{ marginBottom: 15 }}>🕒 Version History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {versions.map((v, i) => (
              <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                   <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent-teal)' }}>Version {v.versionNumber || i + 1}</span>
                   <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.timestamp ? new Date(v.timestamp).toLocaleString() : '—'}</span>
                 </div>
                 <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                   Hash: {v.hash ? v.hash.slice(0, 24) + '...' : '—'}
                 </div>
                 {v.note && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>Note: {v.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button className="btn btn-s" style={{ flex: 1 }} onClick={() => onNavigate('verify')}>
          🔍 Verify Another File
        </button>
      </div>

    </div>
  );
}
