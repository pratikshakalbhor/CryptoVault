import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import '../styles/Verify.css';
import { pageVariants, cardVariants, scalePop } from '../utils/animations';
import { getTxUrl } from '../utils/blockchain';
import { generateCertificate } from '../utils/generateCertificate';
import {
  ShieldCheck, AlertTriangle, CheckCircle, Clipboard,
  ExternalLink, FileText, FileImage, FileCode, FileArchive,
  RefreshCw, Loader2, Database, Link as LinkIcon,
  ChevronRight, FileCheck, Search, UploadCloud, Download,
  Shield, ArrowRight, FolderOpen, GitCompare,
  Info, Clock, Hash, Activity
} from 'lucide-react';

const API = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const delay = ms => new Promise(r => setTimeout(r, ms));

const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

const getFileIcon = file => {
  if (!file) return <FileText size={22} />;
  const t = file.type || '';
  if (t.includes('image'))  return <FileImage  size={22} />;
  if (t.includes('zip') || t.includes('rar')) return <FileArchive size={22} />;
  if (t.includes('javascript') || t.includes('json') || t.includes('html')) return <FileCode size={22} />;
  return <FileText size={22} />;
};

// ══════════════════════════════════════════════════
// DIFF VIEWER COMPONENT
// ══════════════════════════════════════════════════
function DiffViewer({ diff, filename }) {
  const [expanded,  setExpanded]  = useState(true);
  const [viewMode,  setViewMode]  = useState('changes');

  if (!diff) return null;

  if (!diff.available) {
    return (
      <div style={{
        padding: '14px 18px', marginBottom: 16,
        background: 'rgba(124,92,252,.06)',
        border: '1px solid rgba(124,92,252,.2)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <GitCompare size={16} color="#7c5cfc" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#7c5cfc' }}>
            Diff Preview Unavailable
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {diff.message || 'Binary/unsupported file — detailed diff not available'}
          </div>
        </div>
      </div>
    );
  }

  const { summary, changes } = diff;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        border: '1px solid rgba(255,68,68,.3)',
        borderLeft: '4px solid var(--accent-red)',
        borderRadius: 12, overflow: 'hidden', marginBottom: 16,
      }}>

      {/* Header */}
      <div onClick={() => setExpanded(e => !e)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', cursor: 'pointer',
        background: 'rgba(255,68,68,.06)',
        borderBottom: expanded ? '1px solid rgba(255,68,68,.15)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GitCompare size={16} color="var(--accent-red)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-red)' }}>
            🔬 Forensic Diff Analysis — {filename}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {summary?.modifiedLines > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,.25)' }}>
              {summary.modifiedLines} Modified
            </span>
          )}
          {summary?.addedLines > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,200,150,.12)', color: '#00c896', border: '1px solid rgba(0,200,150,.25)' }}>
              +{summary.addedLines} Added
            </span>
          )}
          {summary?.removedLines > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,68,68,.12)', color: '#ff4444', border: '1px solid rgba(255,68,68,.25)' }}>
              -{summary.removedLines} Removed
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: .2 }}>

            {/* Summary */}
            <div style={{
              padding: '12px 18px', background: 'rgba(255,68,68,.03)',
              borderBottom: '1px solid rgba(255,68,68,.1)',
              display: 'flex', gap: 24, flexWrap: 'wrap',
            }}>
              {[
                { label: 'Total Changes',  value: summary?.totalChanges  || 0, color: 'var(--accent-red)' },
                { label: 'Lines Added',    value: summary?.addedLines    || 0, color: '#00c896' },
                { label: 'Lines Removed',  value: summary?.removedLines  || 0, color: '#ff4444' },
                { label: 'Lines Modified', value: summary?.modifiedLines || 0, color: '#F59E0B' },
                { label: 'Original Lines', value: summary?.originalLines || 0, color: 'var(--text-secondary)' },
                { label: 'Current Lines',  value: summary?.currentLines  || 0, color: 'var(--text-secondary)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 4, padding: '10px 18px',
              borderBottom: '1px solid rgba(255,68,68,.1)',
              background: 'var(--bg-input)',
            }}>
              {[
                { key: 'changes', label: `Changed Lines (${changes?.length || 0})` },
                { key: 'side',    label: 'Side-by-Side View' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setViewMode(tab.key)} style={{
                  padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: viewMode === tab.key ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-main)',
                  transition: 'all .15s',
                }}>{tab.label}</button>
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: '14px 18px', maxHeight: 420, overflowY: 'auto' }}>

              {viewMode === 'changes' && (
                !changes?.length ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
                    No line changes detected
                  </div>
                ) : changes.map((change, i) => {
                  if (change.type === 'truncated') {
                    return (
                      <div key={i} style={{ padding: '8px 14px', textAlign: 'center', background: 'rgba(124,92,252,.06)', border: '1px solid rgba(124,92,252,.2)', borderRadius: 6, fontSize: 11, color: '#7c5cfc', margin: '4px 0' }}>
                        {change.message}
                      </div>
                    );
                  }

                  const cfg = {
                    added:    { bg: 'rgba(0,200,150,.08)', border: 'rgba(0,200,150,.2)', color: '#00c896', label: 'ADDED',    prefix: '+' },
                    removed:  { bg: 'rgba(255,68,68,.08)',  border: 'rgba(255,68,68,.2)',  color: '#ff4444', label: 'REMOVED',  prefix: '-' },
                    modified: { bg: 'rgba(245,158,11,.06)', border: 'rgba(245,158,11,.2)', color: '#F59E0B', label: 'MODIFIED', prefix: '~' },
                  }[change.type] || { bg: 'rgba(0,0,0,.05)', border: 'var(--border)', color: 'var(--text-muted)', label: '?', prefix: '?' };

                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ margin: '4px 0', border: `1px solid ${cfg.border}`, borderRadius: 8, overflow: 'hidden', background: cfg.bg }}>

                      {/* Line header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderBottom: `1px solid ${cfg.border}` }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, textTransform: 'uppercase' }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Line {change.line}
                        </span>
                      </div>

                      {/* Before */}
                      {change.before && (
                        <div style={{ display: 'flex', gap: 8, padding: '6px 12px', background: 'rgba(255,68,68,.05)', borderBottom: change.after ? '1px solid rgba(255,68,68,.1)' : 'none' }}>
                          <span style={{ color: '#ff4444', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>−</span>
                          <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#ff8888', wordBreak: 'break-all' }}>
                            {change.before}
                          </code>
                        </div>
                      )}

                      {/* After */}
                      {change.after && (
                        <div style={{ display: 'flex', gap: 8, padding: '6px 12px', background: 'rgba(0,200,150,.05)' }}>
                          <span style={{ color: '#00c896', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>+</span>
                          <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#88ffcc', wordBreak: 'break-all' }}>
                            {change.after}
                          </code>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}

              {viewMode === 'side' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                      📄 Original File
                    </div>
                    <pre style={{
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: 12, margin: 0,
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)', lineHeight: 1.6,
                      overflowX: 'auto', maxHeight: 300, overflowY: 'auto',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {diff.originalText || 'Content not available'}
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                      ⚠️ Modified File
                    </div>
                    <pre style={{
                      background: 'rgba(255,68,68,.04)', border: '1px solid rgba(255,68,68,.2)',
                      borderRadius: 8, padding: 12, margin: 0,
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      color: '#ff8888', lineHeight: 1.6,
                      overflowX: 'auto', maxHeight: 300, overflowY: 'auto',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {diff.currentText || 'Content not available'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════
// MAIN VERIFY COMPONENT
// ══════════════════════════════════════════════════
export default function Verify({ onNotify, walletAddress }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  const [fileId,     setFileId]     = useState('');
  const [filename,   setFilename]   = useState('');
  const [file,       setFile]       = useState(null);
  const [drag,       setDrag]       = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [copied,     setCopied]     = useState('');
  const [restoredPath, setRestoredPath] = useState(null); // ✅ Tracking restore state

  // Parse URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id   = params.get('id')   || '';
    const name = params.get('name') || '';
    setFileId(id);
    setFilename(decodeURIComponent(name));
  }, [location]);

  const STEPS = [
    { n: 1, label: 'Computing SHA-256 Hash...' },
    { n: 2, label: 'Fetching Ledger Record...' },
    { n: 3, label: 'Auditing Blockchain Seal...' },
  ];

  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); }
  };

  const doVerify = async () => {
    if (!file || loading) return;
    setLoading(true); setResult(null); setActiveStep(1);

    try {
      await delay(600);
      setActiveStep(2);

      const formData = new FormData();
      formData.append('file', file);
      if (fileId && fileId !== 'null' && fileId !== 'undefined') {
        formData.append('fileId', fileId);
      }

      const res = await fetch(`${API}/verify`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Verification service unavailable');

      const data = await res.json();
      setActiveStep(3);
      await delay(600);
      setResult(data);

      const st = (data.status || '').toUpperCase();
      if (st === 'VALID') {
        toast.success('✅ File integrity verified!');
      } else if (st === 'TAMPERED') {
        toast.error('🚨 TAMPERING DETECTED!', {
          duration: 5000,
          style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' }
        });
      } else if (st === 'NOT_REGISTERED') {
        toast('🚫 File not found in registry', { icon: '🔍' });
      }

    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false); setActiveStep(0);
    }
  };

  const handleRestore = async () => {
    if (!result?.fileId) return;
    setLoading(true);
    try {
      const { restoreFile } = await import('../utils/api');
      const data = await restoreFile(result.fileId);
      
      if (data.success) {
        setRestoredPath(data.downloadPath);
        toast.success('✔ Original file restored successfully');
        if (typeof onNotify === 'function') onNotify('✅ File restored!', 'success');
      } else {
        throw new Error(data.message || 'Restore failed');
      }
    } catch (err) {
      toast.error('Restore failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRestored = async () => {
    try {
      const url = `${API}/files/${result.fileId}/download`;

      // ✅ Fetch as blob — binary correct rahil
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      
      // ✅ Correct filename sathe download
      const filename = result.filename || 'restored_file';
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed: ' + err.message);
    }
  };

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const shortHash = h => h ? `${h.slice(0, 14)}...${h.slice(-10)}` : '—';

  const getStatusConfig = () => {
    const st = (result?.status || '').toUpperCase();
    switch (st) {
      case 'VALID': return {
        cls: 'valid', badge: '✓ Verified Authentic',
        title: 'File is Authentic', desc: 'All cryptographic hashes match. No tampering detected.',
        color: 'var(--accent-teal)', icon: <CheckCircle size={48} />,
        bg: 'rgba(0,200,150,.1)', shadow: '0 0 30px rgba(0,200,150,.2)',
      };
      case 'TAMPERED': return {
        cls: 'tampered', badge: '⚠ TAMPERING DETECTED',
        title: 'File Has Been Modified', desc: 'This file does not match the original blockchain record. Forensic details below.',
        color: 'var(--accent-red)', icon: <AlertTriangle size={48} />,
        bg: 'rgba(255,68,68,.1)', shadow: '0 0 30px rgba(255,68,68,.2)',
      };
      case 'DATABASE_COMPROMISED': return {
        cls: 'tampered', badge: '🚨 DATABASE BREACH',
        title: 'CRITICAL: System Compromised', desc: 'Database record does not match blockchain proof. Immediate action required.',
        color: '#ff1a1a', icon: <Shield size={48} />,
        bg: 'rgba(255,26,26,.15)', shadow: '0 0 40px rgba(255,26,26,.4)',
      };
      case 'NOT_REGISTERED': return {
        cls: 'grey', badge: 'Not Found',
        title: 'File Not Registered', desc: 'No record found for this file. Upload it first to register on blockchain.',
        color: '#9CA3AF', icon: <Search size={48} />,
        bg: 'rgba(156,163,175,.1)', shadow: '0 0 30px rgba(156,163,175,.2)',
      };
      default: return {
        cls: 'grey', badge: 'Unknown',
        title: 'Verification Error', desc: 'Could not determine status.',
        color: '#9CA3AF', icon: <AlertTriangle size={48} />,
        bg: 'rgba(156,163,175,.1)', shadow: '0 0 30px rgba(156,163,175,.2)',
      };
    }
  };

  const sc      = result ? getStatusConfig() : null;
  const isValid = result?.status?.toUpperCase() === 'VALID' || result?.isMatch === true;
  const hasParam = !!fileId;

  return (
    <motion.div className="verify-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Header */}
      <div className="ph">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>🔬 Forensic File Audit</h1>
          <p style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
            Multi-layer verification — Database + Blockchain + Diff Analysis
          </p>
        </div>
        {(file || result) && (
          <button className="ref-btn" onClick={() => { setFile(null); setResult(null); }}>
            <RefreshCw size={14} /> Reset
          </button>
        )}
      </div>

      {/* Selected file info banner */}
      {hasParam && !result && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '14px 18px', borderRadius: 12, marginBottom: 16,
            background: 'rgba(0,200,150,.06)', border: '1px solid rgba(0,200,150,.2)',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
          <FileCheck size={16} color="var(--accent-teal)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-teal)' }}>
              ✅ File Selected for Audit
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {filename && <span style={{ marginRight: 12 }}>📄 {filename}</span>}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: 10 }}>
                ID: {fileId}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            ⚠️ Upload the <strong style={{ color: 'var(--text-primary)' }}>same file</strong> to verify
          </div>
        </motion.div>
      )}

      {/* No param — guide */}
      {!hasParam && !result && !file && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            padding: '20px 22px', borderRadius: 12, marginBottom: 16,
            background: 'rgba(0,212,255,.05)', border: '1px solid rgba(0,212,255,.15)',
          }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Info size={14} /> How to Verify a File
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { n: '01', text: 'Go to "My Files" page', icon: <FolderOpen size={12} /> },
              { n: '02', text: 'Click "Verify" button on any file', icon: <ShieldCheck size={12} /> },
              { n: '03', text: 'Upload the same file here', icon: <UploadCloud size={12} /> },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,212,255,.1)', border: '1px solid rgba(0,212,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--accent-cyan)', flexShrink: 0 }}>
                  {s.n}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {s.icon} {s.text}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/files')}
            style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(0,212,255,.1)', border: '1px solid rgba(0,212,255,.2)', color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
            <FolderOpen size={13} /> Go to My Files <ArrowRight size={12} />
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!result && (
          <motion.div key="form" variants={cardVariants} initial="initial" animate="animate" exit={{ opacity: 0, y: -10 }}>

            {/* Stepper */}
            {(hasParam || file) && (
              <div className="v-card" style={{ padding: '0 12px', marginBottom: 16 }}>
                <div className="v-stepper">
                  {STEPS.map((step, i) => (
                    <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`v-step-item ${activeStep >= step.n ? 'active' : ''}`}>
                        <div className="v-step-num">{step.n}</div>
                        <span className="v-step-label">{step.label}</span>
                      </div>
                      {i < 2 && <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading ? (
              <div className="v-card">
                {/* Dropzone */}
                <div
                  className={`v-dropzone ${drag ? 'drag-active' : ''} ${file ? 'file-selected' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setResult(null); } }} />

                  {file ? (
                    <div className="v-file-preview">
                      <div className="v-file-icon">{getFileIcon(file)}</div>
                      <div className="v-file-info">
                        <div className="v-file-name">{file.name}</div>
                        <div className="v-file-meta">{fmtSize(file.size)} · Ready for forensic audit</div>
                      </div>
                      <button className="v-remove-btn" onClick={e => { e.stopPropagation(); setFile(null); }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                        Drop the file to audit
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Same file jo originally upload kela hota
                      </div>
                    </div>
                  )}
                </div>

                <button className="v-btn-execute" disabled={!file} onClick={doVerify}>
                  <ShieldCheck size={18} /> Execute Forensic Audit
                </button>
              </div>
            ) : (
              <div className="v-card v-processing-card">
                <div style={{ fontSize: 36, marginBottom: 16 }}>🔬</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Forensic Analysis Running...</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>
                  Comparing cryptographic signatures...
                </div>
                <div className="v-processing-steps">
                  {STEPS.map(step => {
                    const done   = activeStep > step.n;
                    const active = activeStep === step.n;
                    return (
                      <div key={step.n} className={`v-proc-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                        <div className="v-step-num">
                          {done ? <CheckCircle size={13} /> : active ? <Loader2 size={13} style={{ animation: 'spin .8s linear infinite' }} /> : step.n}
                        </div>
                        <span style={{ flex: 1, textAlign: 'left', fontSize: 12 }}>{step.label}</span>
                        {done   && <span style={{ fontSize: 10, color: 'var(--accent-teal)', fontWeight: 700 }}>DONE</span>}
                        {active && <span style={{ fontSize: 10, color: 'var(--accent-cyan)', fontWeight: 700 }}>RUNNING</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {result && sc && (
          <motion.div key="result" variants={scalePop} initial="initial" animate="animate">

            {/* Verdict */}
            <div className={`v-card v-result-verdict ${sc.cls}`} style={{ textAlign: 'center', marginBottom: 16 }}>
              <div className={`v-status-badge ${sc.cls}`}>{sc.badge}</div>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: sc.bg, color: sc.color, boxShadow: sc.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px auto' }}>
                {sc.icon}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: sc.color, marginBottom: 8 }}>
                {sc.title}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {sc.desc}
              </p>
            </div>

            {/* ── DIFF VIEWER (only for TAMPERED) ── */}
            {result.status === 'TAMPERED' && result.diff && (
              <DiffViewer diff={result.diff} filename={result.filename || file?.name} />
            )}

            {/* ── AUDIT INFO (TAMPERED) ── */}
            {result.status === 'TAMPERED' && result.comparison && (
              <div style={{
                padding: '18px 20px', borderRadius: 12, marginBottom: 16,
                background: 'rgba(255,68,68,.05)',
                border: '1px solid rgba(255,68,68,.2)',
                borderLeft: '4px solid var(--accent-red)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: 'var(--accent-red)', fontWeight: 700, fontSize: 13 }}>
                  <Activity size={15} /> Audit Findings
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                  {result.comparison.sizeMatch
                    ? `⚠️ Same size (${fmtSize(result.comparison.originalFileSize)}) but different hash — content modified internally.`
                    : `📏 Size changed: ${fmtSize(result.comparison.originalFileSize)} → ${fmtSize(result.comparison.currentFileSize)}`
                  }
                </div>

                {/* Restore button */}
                {!restoredPath ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }}
                    onClick={handleRestore}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 10,
                      background: 'var(--accent-red)', color: '#fff', border: 'none',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 6px 20px rgba(255,68,68,.35)',
                      textTransform: 'uppercase', letterSpacing: '1px',
                    }}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} /> 
                    {loading ? 'Restoring...' : 'Restore Original File'}
                  </motion.button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: 'rgba(0,200,150,.1)', border: '1px solid var(--accent-teal)', color: 'var(--accent-teal)', padding: '10px', borderRadius: 8, fontSize: 12, textAlign: 'center', fontWeight: 600 }}>
                      ✔ Original file restored successfully
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }}
                      onClick={handleDownloadRestored}
                      style={{
                        width: '100%', padding: '13px', borderRadius: 10,
                        background: 'var(--accent-teal)', color: '#fff', border: 'none',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 6px 20px rgba(0,200,150,.3)',
                        textTransform: 'uppercase', letterSpacing: '1px',
                      }}>
                      <Download size={16} /> Download Restored File
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {/* ── HASH GRID ── */}
            <div className="v-hash-grid" style={{ marginBottom: 16 }}>
              {[
                { label: 'Original Hash (DB)', key: 'orig',  val: result.originalHash, icon: <Database size={13} /> },
                { label: 'Digital Seal',       key: 'chain', val: result.blockchainHash || result.txHash, icon: <LinkIcon size={13} /> },
              ].map(({ label, key, val, icon }) => (
                <div key={key} className="v-hash-box">
                  <div className="v-hash-label">{icon} {label}</div>
                  <div className="v-hash-value-wrap">
                    <div className="v-hash-value">{shortHash(val)}</div>
                    <button className="v-copy-btn" onClick={() => copyText(val, key)}>
                      {copied === key ? <CheckCircle size={13} color="var(--accent-teal)" /> : <Clipboard size={13} />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="v-hash-box" style={{ gridColumn: 'span 2' }}>
                <div className="v-hash-label"><Hash size={13} /> Current File Hash</div>
                <div className="v-hash-value-wrap" style={{ borderColor: sc.color + '4D' }}>
                  <div className="v-hash-value" style={{ color: sc.color }}>{result.currentHash}</div>
                  <button className="v-copy-btn" onClick={() => copyText(result.currentHash, 'curr')}>
                    {copied === 'curr' ? <CheckCircle size={13} color="var(--accent-teal)" /> : <Clipboard size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── OFFICIAL RECORD ── */}
            <div className="v-card" style={{ marginBottom: 16 }}>
              <div className="pf-section-label" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Shield size={13} /> Official Blockchain Record
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Database Check',    val: 'SUCCESS',   color: 'var(--accent-teal)' },
                  { label: 'Blockchain Check',  val: result.chainVerified ? 'CONFIRMED' : 'PENDING', color: result.chainVerified ? 'var(--accent-teal)' : '#F59E0B' },
                  { label: 'File',              val: result.filename || '—', color: 'var(--text-primary)' },
                  { label: 'Wallet',            val: result.walletAddress ? result.walletAddress.slice(0,8)+'...'+result.walletAddress.slice(-4) : '—', color: 'var(--text-secondary)' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="pf-info-row">
                    <span className="pf-info-key">{label}</span>
                    <span style={{ color, fontWeight: 600, fontSize: 12 }}>{val}</span>
                  </div>
                ))}

                {result.txHash && result.txHash !== 'pending' && (
                  <div className="pf-info-row" style={{ gridColumn: 'span 2' }}>
                    <span className="pf-info-key">TX Hash</span>
                    <a href={getTxUrl(result.txHash)} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--accent-purple)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      {result.txHash.slice(0, 20)}... <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                {result.uploadedAt && (
                  <div className="pf-info-row" style={{ gridColumn: 'span 2' }}>
                    <span className="pf-info-key">Uploaded At</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={11} /> {new Date(result.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* View Blockchain Proof Button */}
              {result.txHash && (
                <div style={{ marginTop: 16 }}>
                   <a href={`https://sepolia.etherscan.io/tx/${result.txHash}`} target="_blank" rel="noreferrer"
                      style={{
                        width: '100%', padding: '12px', borderRadius: 10,
                        background: 'rgba(124,92,252,.1)', color: 'var(--accent-purple)', border: '1px solid rgba(124,92,252,.3)',
                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px'
                      }}>
                      <LinkIcon size={16} /> View Blockchain Proof
                   </a>
                </div>
              )}
            </div>

            {/* ── ACTIONS ── */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }}
                onClick={() => { setFile(null); setResult(null); }}>
                <RefreshCw size={13} /> Verify Another
              </button>
              {isValid && (
                <button className="v-btn-execute" style={{ flex: 1.5, marginTop: 0 }}
                  onClick={() => generateCertificate({ ...result, walletAddress })}>
                  <FileCheck size={16} /> Generate Certificate
                </button>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}