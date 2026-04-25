import { useState, useEffect, useCallback } from 'react';
import { getAllFiles } from '../utils/api';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, ShieldCheck, FileText } from 'lucide-react';


function StatusBadge({ status }) {
  if (status === 'valid') {
    return (
      <span className="badge b-valid" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 200, 150, 0.1)', color: 'var(--accent-teal)', border: '1px solid rgba(0, 200, 150, 0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600' }}>
        <CheckCircle size={13} /> Valid
      </span>
    );
  }
  if (status === 'tampered') {
    return (
      <span className="badge b-tampered" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255, 68, 68, 0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600' }}>
        <AlertTriangle size={13} /> Tampered
      </span>
    );
  }
  return (
    <span className="badge b-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 140, 66, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(255, 140, 66, 0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600' }}>
      <Activity size={13} /> Not Synced
    </span>
  );
}

export default function BlockchainLog({ walletAddress }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('uploads');
  const [blocks, setBlocks] = useState(() =>
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(3, '0'))
  );

  useEffect(() => {
    const iv = setInterval(() => {
      setBlocks(prev => {
        const last = parseInt(prev[prev.length - 1]) + 1;
        return [...prev.slice(1), String(last).padStart(3, '0')];
      });
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllFiles(walletAddress);
      setFiles(res.files || []);
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // All files are "uploads"; for verifications we'd need a separate endpoint
  const uploads = files;
  const verifs = [];
  const shown = tab === 'uploads' ? uploads : verifs;

  return (
    <div className="page-inner">
      <div className="ph">
        <div>
          <h1>Blockchain Log</h1>
          <p>All transactions recorded on Sepolia Testnet</p>
        </div>
        <button className="ref-btn" onClick={fetchFiles}><RefreshCw size={18} /> Refresh</button>
      </div>

      {/* ── Live block ticker ── */}
      <div className="ticker">
        <span style={{ fontSize: 14, color: 'var(--accent-cyan)' }}><ShieldCheck size={18} /></span>
        <div className="blks">
          {blocks.map(b => <div key={b} className="blk">{b}</div>)}
        </div>
        <span className="blks-lbl">Live Blocks</span>
      </div>

      {error && <div className="error-box"><AlertTriangle size={18} /> {error}</div>}

      {/* ── Tabs ── */}
      <div className="log-tabs">
        <button className={`tab-b${tab === 'uploads' ? ' on' : ''}`} onClick={() => setTab('uploads')}>
          Uploads ({uploads.length})
        </button>
        <button className={`tab-b${tab === 'verifications' ? ' on' : ''}`} onClick={() => setTab('verifications')}>
          Verifications ({verifs.length})
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center"><div className="spin-ring" />Loading transactions...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>TX Hash</th>
                <th>File</th>
                <th>Status</th>
                <th>Wallet</th>
                <th>Timestamp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 38, color: 'var(--text-muted)' }}>
                    No {tab} recorded yet.
                  </td>
                </tr>
              ) : shown.map(f => (
                <tr key={f.fileId || f.id}>
                  <td>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${f.txHash}`}
                      target="_blank" rel="noreferrer"
                      className="tx-h"
                    >
                      {f.txHash
                        ? `${f.txHash.slice(0, 10)}...${f.txHash.slice(-6)}`
                        : 'pending'}
                    </a>
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, color: 'var(--accent-cyan)', flexShrink: 0 }}><FileText size={14} /></span>
                      <span>{(f.filename || f.name || '').slice(0, 24)}{(f.filename || f.name || '').length > 24 ? '...' : ''}</span>
                    </div>
                  </td>
                  <td><StatusBadge status={f.status} /></td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                      {f.walletAddress
                        ? `${f.walletAddress.slice(0, 6)}...${f.walletAddress.slice(-4)}`
                        : '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {f.uploadedAt
                      ? new Date(f.uploadedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td>
                    {f.txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${f.txHash}`}
                        target="_blank" rel="noreferrer"
                        className="link-ico"
                      >↗</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="log-stats">
        <div className="ls">
          <div className="ls-num">{files.length}</div>
          <div className="ls-lbl">Total Transactions</div>
        </div>
        <div className="ls">
          <div className="ls-num">{uploads.length}</div>
          <div className="ls-lbl">Files Stored</div>
        </div>
        <div className="ls">
          <div className="ls-num">{verifs.length}</div>
          <div className="ls-lbl">Verifications</div>
        </div>
      </div>
    </div>
  );
}