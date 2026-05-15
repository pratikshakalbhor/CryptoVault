/**
 * ForensicModal.jsx
 * Full-screen Forensic Comparison Modal
 * Requires: npm install react-diff-viewer-continued
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import '../styles/ForensicModal.css';

const API = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '') + '/api';

/* ─── Risk Score Ring ───────────────────────────────────── */
function RiskRing({ score, level }) {
  const r    = 36;
  const circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;

  const colors = {
    SECURE:   '#14b8a6',
    LOW:      '#f59e0b',
    MEDIUM:   '#f97316',
    HIGH:     '#ef4444',
    CRITICAL: '#dc2626',
  };
  const color = colors[level] || colors.SECURE;

  return (
    <div className="risk-ring-wrap">
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r}
          fill="none" stroke="rgba(255,255,255,0.07)"
          strokeWidth={7} />
        <circle cx={45} cy={45} r={r}
          fill="none" stroke={color} strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x={45} y={49}
          textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={16} fontWeight={800}
          fontFamily="monospace">
          {score}
        </text>
      </svg>
      <span className="risk-ring-label" style={{ color }}>
        {level}
      </span>
    </div>
  );
}

/* ─── File Preview ──────────────────────────────────────── */
function FilePreview({ content, mimeType, label, status }) {
  const isImage   = mimeType?.startsWith('image/');
  const isPDF     = mimeType === 'application/pdf';
  const isDataURL = content?.startsWith('data:');

  return (
    <div className={`forensic-preview-pane ${status}`}>
      <div className="forensic-preview-label">
        <span className="forensic-preview-dot" />
        <span className="forensic-preview-label-text">{label}</span>
      </div>

      <div className="forensic-preview-content">
        {isImage && isDataURL ? (
          <img src={content} alt={label} />
        ) : isPDF && isDataURL ? (
          <iframe src={content} title={label} />
        ) : content?.startsWith('[') ? (
          <div className="forensic-preview-unavailable">
            {content}
          </div>
        ) : (
          <pre>
            {content || '(empty)'}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ─── Main Modal ────────────────────────────────────────── */
export default function ForensicModal({ fileId, filename, onClose, onRestored }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState('diff');  // diff | preview | info
  const [restoring, setRestoring] = useState(false);
  const [restored,  setRestored]  = useState(false);

  /* ── Fetch forensic data ── */
  const fetchData = useCallback(async () => {
    if (!fileId) {
      setError('No file ID provided');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = `${API}/file/forensic-compare/${encodeURIComponent(fileId)}`;
      console.log('[ForensicModal] Fetching:', url);

      const res = await fetch(url);

      if (!res.ok) {
        // Try to read backend error message
        let msg = `HTTP ${res.status}`;
        try {
          const json = await res.json();
          msg = json.error || json.message || msg;
        } catch (_) { /* ignore */ }
        throw new Error(msg);
      }

      const json = await res.json();
      console.log('[ForensicModal] Response keys:', Object.keys(json));
      setData(json);

      // Auto-switch to preview tab for binary files
      if (json.isBinary) setTab('preview');

    } catch (e) {
      console.error('[ForensicModal] Fetch error:', e);
      setError(e.message || 'Failed to load forensic data');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Restore ── */
  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await fetch(`${API}/restore/${encodeURIComponent(fileId)}`,
        { method: 'POST' });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.error || msg; } catch (_) {}
        throw new Error(msg);
      }
      setRestored(true);
      onRestored?.();
      await fetchData(); // refresh comparison after restore
    } catch (e) {
      alert('Restore failed: ' + e.message);
    } finally {
      setRestoring(false);
    }
  };

  /* ── Download Evidence ── */
  const handleDownloadEvidence = () => {
    if (!data) return;
    const report = {
      generatedAt:   new Date().toISOString(),
      fileId:        data.fileId,
      fileName:      data.fileName,
      walletAddress: data.walletAddress,
      txHash:        data.txHash,
      status:        data.status,
      riskScore:     data.riskScore,
      riskLevel:     data.riskLevel,
      originalHash:  data.originalHash,
      modifiedHash:  data.modifiedHash,
      isIdentical:   data.isIdentical,
      mimeType:      data.mimeType,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `forensic-report-${data.fileId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Diff viewer styles ── */
  const diffStyles = {
    variables: {
      dark: {
        diffViewerBackground:      '#0d1117',
        diffViewerColor:           '#e2e8f0',
        addedBackground:           'rgba(20,184,166,0.15)',
        addedColor:                '#d1fae5',
        removedBackground:         'rgba(239,68,68,0.15)',
        removedColor:              '#fecaca',
        wordAddedBackground:       'rgba(20,184,166,0.4)',
        wordRemovedBackground:     'rgba(239,68,68,0.4)',
        addedGutterBackground:     'rgba(20,184,166,0.25)',
        removedGutterBackground:   'rgba(239,68,68,0.25)',
        gutterBackground:          '#0a0f1a',
        gutterColor:               '#475569',
        codeFoldBackground:        '#111827',
        codeFoldGutterBackground:  '#111827',
        codeFoldContentColor:      '#64748b',
        emptyLineBackground:       '#0a0f1a',
        highlightBackground:       'rgba(245,158,11,0.15)',
        highlightGutterBackground: 'rgba(245,158,11,0.25)',
      },
    },
    line:   { fontFamily: 'monospace', fontSize: '12px' },
    gutter: { minWidth: '40px' },
  };

  /* ── UI helpers ── */
  const isCritical = data?.riskLevel === 'CRITICAL' || data?.riskLevel === 'HIGH';
  const isText     = data?.isTextComparable;
  const isBinary   = data?.isBinary;

  return (
    <AnimatePresence>
      <motion.div
        className="forensic-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className={`forensic-modal ${isCritical ? 'critical' : ''}`}
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── Header ── */}
          <div className={`forensic-header ${isCritical ? 'critical' : ''}`}>
            {/* Risk ring — only when data is loaded */}
            {data && !loading && (
              <RiskRing score={data.riskScore} level={data.riskLevel} />
            )}

            {/* Title */}
            <div className="forensic-title-block">
              <div className="forensic-title">
                <h2>🔬 Forensic Report</h2>
                {isCritical && !loading && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="badge badge-critical">
                    ⚠ TAMPERING DETECTED
                  </motion.span>
                )}
                {data?.isIdentical && !loading && (
                  <span className="badge badge-valid">✅ IDENTICAL</span>
                )}
                {restored && (
                  <span className="badge badge-restored">✅ RESTORED</span>
                )}
              </div>
              <div className="forensic-subtitle">
                {data?.fileName || filename || fileId}
                {data?.txHash && data.txHash !== 'pending' && (
                  <> · TX: {data.txHash.slice(0, 16)}...</>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="forensic-tabs">
              {[
                { key: 'diff',    label: '⚡ Diff',    hidden: isBinary },
                { key: 'preview', label: '👁 Preview' },
                { key: 'info',    label: 'ℹ Info' },
              ].filter(t => !t.hidden).map(({ key, label }) => (
                <button key={key}
                  className={`forensic-tab ${tab === key ? 'active' : ''}`}
                  onClick={() => setTab(key)}>
                  {label}
                </button>
              ))}
            </div>

            {/* Close */}
            <button onClick={onClose} className="forensic-close">×</button>
          </div>

          {/* ── Body ── */}
          <div className="forensic-body">

            {/* LOADING */}
            {loading && (
              <div className="forensic-loading">
                <div className="forensic-spinner" />
                Generating forensic comparison...
              </div>
            )}

            {/* ERROR */}
            {!loading && error && (
              <div className="forensic-error">
                <div className="forensic-error-icon">⚠️</div>
                <div className="forensic-error-message">{error}</div>
                <button className="forensic-retry-btn" onClick={fetchData}>
                  🔄 Retry
                </button>
                <div className="forensic-error-hint">
                  <strong>Possible causes:</strong>
                  <ul>
                    <li>The file was not saved locally during upload</li>
                    <li>The backend server is not running</li>
                    <li>The fileId is invalid</li>
                  </ul>
                </div>
              </div>
            )}

            {/* CONTENT */}
            {!loading && !error && data && (
              <>
                {/* ── DIFF TAB ── */}
                {tab === 'diff' && (
                  <div className="forensic-diff-wrap">
                    {isBinary ? (
                      <div className="forensic-no-diff">
                        <div className="forensic-no-diff-icon">📄</div>
                        <h3>Diff Preview Unavailable</h3>
                        <p>
                          Text diff is not available for{' '}
                          <code>{data.mimeType}</code> files.
                          Use the <strong>Preview</strong> tab instead.
                        </p>
                      </div>
                    ) : data.isIdentical ? (
                      <div className="forensic-no-diff forensic-identical">
                        <div className="forensic-no-diff-icon">✅</div>
                        <h3>Files Are Identical</h3>
                        <p>
                          The current file matches the original blockchain-sealed version.
                          No tampering detected.
                        </p>
                      </div>
                    ) : (
                      <ReactDiffViewer
                        oldValue={data.original || ''}
                        newValue={data.modified || ''}
                        splitView={true}
                        compareMethod={DiffMethod.WORDS}
                        useDarkTheme={true}
                        styles={diffStyles}
                        leftTitle="🔒 Original (Blockchain Verified)"
                        rightTitle="⚠️ Current / Modified Version"
                        hideLineNumbers={false}
                      />
                    )}
                  </div>
                )}

                {/* ── PREVIEW TAB ── */}
                {tab === 'preview' && (
                  <div className="forensic-preview-wrap">
                    <FilePreview
                      content={data.original}
                      mimeType={data.mimeType}
                      label="Original (Sealed)"
                      status="original"
                    />
                    <FilePreview
                      content={data.modified}
                      mimeType={data.mimeType}
                      label="Current Version"
                      status="modified"
                    />
                  </div>
                )}

                {/* ── INFO TAB ── */}
                {tab === 'info' && (
                  <div className="forensic-info-wrap">
                    <div className="forensic-info-title">
                      📋 File Intelligence Report
                    </div>

                    {[
                      { label: 'File ID',        val: data.fileId },
                      { label: 'Filename',       val: data.fileName },
                      { label: 'MIME Type',      val: data.mimeType },
                      { label: 'File Size',      val: data.fileSize ? `${(data.fileSize / 1024).toFixed(1)} KB` : '--' },
                      { label: 'Status',         val: data.status?.toUpperCase() },
                      { label: 'Risk Score',     val: `${data.riskScore}/100 — ${data.riskLevel}` },
                      { label: 'Identical',      val: data.isIdentical ? '✅ Yes — No tampering' : '❌ No — Modified' },
                      { label: 'Original Hash',  val: data.originalHash },
                      { label: 'Modified Hash',  val: data.modifiedHash },
                      { label: 'TX Hash',        val: data.txHash },
                      { label: 'Wallet',         val: data.walletAddress },
                      { label: 'Uploaded',       val: data.uploadedAt ? new Date(data.uploadedAt).toLocaleString() : '--' },
                    ].map(({ label, val }) => (
                      <div key={label} className="forensic-info-row">
                        <span className="forensic-info-label">{label}</span>
                        <span className="forensic-info-value">{val || '--'}</span>
                      </div>
                    ))}

                    {/* Etherscan link */}
                    {data.txHash && data.txHash !== 'pending' && data.txHash.startsWith('0x') && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${data.txHash}`}
                        target="_blank" rel="noreferrer"
                        className="forensic-etherscan-link">
                        🔗 View Blockchain Proof on Etherscan ↗
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Footer ── */}
          {!loading && !error && data && (
            <div className="forensic-footer">
              {/* Status pill */}
              <div className="forensic-footer-left">
                <span className="forensic-footer-filename">
                  {data.fileName || filename}
                </span>
                <span className={`badge badge-${data.status || 'pending'}`}>
                  {data.status?.toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              <div className="forensic-footer-actions">
                {/* Download Evidence */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownloadEvidence}
                  className="btn-evidence">
                  📥 Download Evidence
                </motion.button>

                {/* Open Blockchain Proof */}
                {data.txHash && data.txHash !== 'pending' && data.txHash.startsWith('0x') && (
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`https://sepolia.etherscan.io/tx/${data.txHash}`}
                    target="_blank" rel="noreferrer"
                    className="btn-blockchain">
                    🔗 Blockchain Proof
                  </motion.a>
                )}

                {/* Restore */}
                {(data.status === 'tampered' || !data.isIdentical) && !restored && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={restoring}
                    onClick={handleRestore}
                    className="btn-restore">
                    {restoring ? '⏳ Restoring...' : '🔄 Restore Original'}
                  </motion.button>
                )}

                <button onClick={onClose} className="btn-close-modal">
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
