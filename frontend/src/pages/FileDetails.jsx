import { useState } from 'react';
import { downloadCertificate } from '../utils/api';

const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

function StatusBadge({ status }) {
  const cls  = status === 'valid' ? 'b-valid' : status === 'tampered' ? 'b-tampered' : 'b-pending';
  const icon = status === 'valid' ? '✅' : status === 'tampered' ? '❌' : '⏳';
  return <span className={`badge ${cls}`}>{icon} {status}</span>;
}

export default function FileDetails({ file, onNavigate }) {
  const [copied, setCopied] = useState(false);
  const [certLoading, setCertLoading] = useState(false);

  if (!file) {
    return (
      <div className="empty">
        No file selected.{' '}
        <button className="view-all" onClick={() => onNavigate('my-files')}>Go to My Files</button>
      </div>
    );
  }

  const name    = file.filename || file.name || 'Unknown';
  const hash    = file.hash || file.fileHash || '';
  const txHash  = file.txHash || '';
  const network = file.network || 'Sepolia Testnet';
  const shareURL = file.shareURL || `${window.location.origin}/verify-public/${file.fileId || file.id}`;
  const cloudURL = file.cloudURL || file.ipfsURL || file.storageURL || '';

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
      <button className="back-btn" onClick={() => onNavigate('my-files')}>← Back to Files</button>

      <div className="det-hero">
        <div className="det-top">
          <div className="det-ico">✅</div>
          <div className="det-info">
            <h2>{name}</h2>
            <div className="det-badges">
              <StatusBadge status={file.status} />
              <span className="net-tag">{network}</span>
            </div>
          </div>
        </div>

        <div className="det-acts">
          {cloudURL && (
            <a href={cloudURL} target="_blank" rel="noreferrer" className="btn btn-g">
              👁️ Preview
            </a>
          )}
          {cloudURL && (
            <a href={cloudURL} download={name} className="btn btn-g">
              ⬇️ Download
            </a>
          )}
          <button className="btn btn-g" onClick={handleCopy}>🔗 Share Link</button>
          <button className="btn btn-pu" onClick={handleCert} disabled={certLoading}>
            {certLoading ? '...' : '🏅 Download Proof Certificate'}
          </button>
        </div>

        <div className="share-box">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔗</span>
          <span className="share-url">{shareURL}</span>
          <button className="copy-btn" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      </div>

      <div className="ig">
        <div className="ig-hdr"><span>📄</span><h3>File Information</h3></div>
        <div className="ig-row"><span className="ig-lbl">File Name</span><span className="ig-val">{name}</span></div>
        <div className="ig-row"><span className="ig-lbl">File Type</span><span className="ig-val">{file.fileType || file.type || '—'}</span></div>
        <div className="ig-row"><span className="ig-lbl">File Size</span><span className="ig-val">{fmtSize(file.fileSize)}</span></div>
        <div className="ig-row">
          <span className="ig-lbl">Uploaded</span>
          <span className="ig-val">{file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : '—'}</span>
        </div>
      </div>

      <div className="ig">
        <div className="ig-hdr"><span>🔗</span><h3>Blockchain &amp; Integrity</h3></div>
        <div className="ig-row">
          <span className="ig-lbl">SHA-256 Hash</span>
          <span className="ig-val mono">{hash || '—'}</span>
        </div>
        <div className="ig-row">
          <span className="ig-lbl">TX Hash</span>
          {txHash ? (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank" rel="noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-purple)', wordBreak: 'break-all' }}
            >{txHash}</a>
          ) : <span className="ig-val">—</span>}
        </div>
        <div className="ig-row"><span className="ig-lbl">Network</span><span className="ig-val">{network}</span></div>
        <div className="ig-row">
          <span className="ig-lbl">Integrity</span>
          <span className="ig-val" style={{ color: file.status === 'valid' ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
            {file.status === 'valid' ? '✅ Verified — Not tampered' : '❌ Tampered'}
          </span>
        </div>
      </div>

      <div className="ig">
        <div className="ig-hdr"><span>👤</span><h3>Owner &amp; Storage</h3></div>
        <div className="ig-row">
          <span className="ig-lbl">Wallet Address</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {file.walletAddress || '—'}
          </span>
        </div>
        {cloudURL && (
          <div className="ig-row">
            <span className="ig-lbl">Storage URL</span>
            <a href={cloudURL} target="_blank" rel="noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
              {cloudURL}
            </a>
          </div>
        )}
      </div>

      <div className="btn-row">
        <button className="btn btn-s" style={{ flex: 1 }} onClick={() => onNavigate('verify')}>
          🔍 Re-Verify This File
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} onClick={() => onNavigate('blockchain-log')}>
          🔗 View in Blockchain Log
        </button>
      </div>
    </div>
  );
}
