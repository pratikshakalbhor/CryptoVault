import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFiles, getStats } from '../utils/api';
import {
  Activity, AlertTriangle, CheckCircle, Clock, FileText,
  RefreshCw, TrendingUp, UploadCloud, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────
const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

function hashPill(hash) {
  if (!hash) return '—';
  return (
    <span className="hash-p">{hash.slice(0, 8)}...{hash.slice(-6)}</span>
  );
}

// ── Pie Chart colours ─────────────────────────────────────────────────
const PIE_COLORS = ['#2DD4BF', '#FB7185'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '10px 16px',
        fontSize: 13,
        color: payload[0].payload.fill,
        fontWeight: 600,
      }}>
        {payload[0].name}: <span style={{ color: '#fff' }}>{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

// ── Status Badge Component ───────────────────────────────────────────
function StatusBadge({ status, isExpired }) {
  const s = (status || '').toLowerCase();
  if (isExpired) {
    return (
      <span className="badge b-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(252, 165, 165, 0.1)', color: '#fca5a5', border: '1px solid rgba(252, 165, 165, 0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600' }}>
        <AlertCircle size={13} /> Expired
      </span>
    );
  }
  if (s === 'valid') {
    return (
      <span className="badge b-valid" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 200, 150, 0.1)', color: 'var(--accent-teal)', border: '1px solid rgba(0, 200, 150, 0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600' }}>
        <CheckCircle size={13} /> Valid
      </span>
    );
  }
  if (s === 'tampered') {
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

// ── Main Component ────────────────────────────────────────────────────
export default function Dashboard({ walletAddress }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, tampered: 0, recentLogs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollingRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await getStats();
      const s = statsRes.stats || statsRes || {};
      setStats({ total: s.total || 0, valid: s.valid || 0, tampered: s.tampered || 0, recentLogs: statsRes.recentLogs || [] });
    } catch {
      // silently ignore
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [filesRes, statsRes] = await Promise.all([
        getAllFiles(walletAddress),
        getStats(),
      ]);
      setFiles(filesRes.files || []);
      const s = statsRes.stats || statsRes || {};
      setStats({ total: s.total || 0, valid: s.valid || 0, tampered: s.tampered || 0, recentLogs: statsRes.recentLogs || [] });
    } catch (err) {
      setError(err.message || 'Failed to reach backend');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
    pollingRef.current = setInterval(() => { fetchStats(); }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchData, fetchStats]);

  const totalBytes = files.reduce((a, f) => a + (f.fileSize || 0), 0);
  const storagePct = Math.min(Math.round((totalBytes / (500 * 1024 * 1024)) * 100), 100);
  const integrityPct = stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0;

  const pieData = [
    { name: 'Verified', value: stats.valid },
    { name: 'Tampered', value: stats.tampered },
  ];
  const hasPieData = stats.valid > 0 || stats.tampered > 0;

  if (loading) {
    return (
      <div className="page-inner">
        <div className="loading-center"><div className="spin-ring" />Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page-inner">
      <div className="ph">
        <div><h1>Dashboard</h1><p>Overview of your blockchain file registry</p></div>
        <button className="ref-btn" onClick={fetchData}><RefreshCw size={18} /> Refresh</button>
      </div>

      {error && <div className="error-box"><AlertTriangle size={18} /> {error}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div className="stats" style={{ flex: '1 1 340px' }}>
          <div className="stat">
            <div className="stat-ico ico-blue"><FileText size={18} /></div>
            <div><div className="stat-val">{stats.total}</div><div className="stat-lbl">Total Files</div></div>
          </div>
          <div className="stat">
            <div className="stat-ico ico-green"><CheckCircle size={18} /></div>
            <div><div className="stat-val">{stats.valid}</div><div className="stat-lbl">Valid Files</div></div>
          </div>
          <div className="stat">
            <div className="stat-ico ico-red"><AlertTriangle size={18} /></div>
            <div><div className="stat-val">{stats.tampered}</div><div className="stat-lbl">Tampered</div></div>
          </div>
          <div className="stat">
            <div className="stat-ico ico-purple"><TrendingUp size={18} /></div>
            <div><div className="stat-val">{integrityPct}%</div><div className="stat-lbl">Integrity Score</div></div>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>FILE INTEGRITY RATIO</div>
          {hasPieData ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value, entry) => <span style={{ color: entry.color, fontSize: 12, fontWeight: 600 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}><FileText size={36} style={{ opacity: 0.3, marginBottom: 8 }} /><div>No data yet.</div></div>
          )}
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12 }}>Integrity Score</span><span>{integrityPct}%</span></div>
          <div className="progress"><div className="progress-fill fill-green" style={{ width: `${integrityPct}%` }} /></div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12 }}>Storage Used</span><span>{storagePct}%</span></div>
          <div className="progress"><div className="progress-fill fill-cyan" style={{ width: `${storagePct}%` }} /></div>
        </div>
      </div>

      <div className="actions-row">
        <div className="ac" onClick={() => navigate('/upload')}>
          <div className="ac-l"><span className="ac-ico"><UploadCloud size={18} /></span><div className="ac-t"><h3>Upload File</h3><p>Store &amp; hash on blockchain</p></div></div>
          <span>→</span>
        </div>
        <div className="ac grn" onClick={() => navigate('/verify')}>
          <div className="ac-l"><span className="ac-ico"><CheckCircle size={18} /></span><div className="ac-t"><h3>Verify File</h3><p>Check file integrity</p></div></div>
          <span>→</span>
        </div>
      </div>

      <div className="card">
        <div className="sec-hdr"><span className="sec-title"><Clock size={18} /> Recent Files</span><button className="view-all" onClick={() => navigate('/my-files')}>View all →</button></div>
        {files.length === 0 ? <div className="empty">No files uploaded yet.</div> : (
          <table>
            <thead><tr><th>File</th><th>Hash</th><th>Size</th><th>Status</th></tr></thead>
            <tbody>
              {files.slice(0, 5).map(f => {
                const isExpired = f.isExpired || (f.expiryDate && new Date(f.expiryDate) < new Date());
                return (
                  <tr key={f.fileId || f.id} className="tr-click" onClick={() => navigate(`/files/${f.fileId || f.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
                        <div><div className="fname">{f.filename || f.name}</div><div className="ftype">{f.fileType || f.type}</div></div>
                      </div>
                    </td>
                    <td>{hashPill(f.hash || f.fileHash)}</td>
                    <td>{fmtSize(f.fileSize)}</td>
                    <td><StatusBadge status={f.status} isExpired={isExpired} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="sec-hdr">
          <span className="sec-title"><Activity size={18} /> Recent Verifications</span>
        </div>
        {!stats.recentLogs || stats.recentLogs.length === 0 ? <div className="empty">No verifications yet.</div> : (
          <table>
            <thead><tr><th>File</th><th>Hash</th><th>Status</th><th>Verified At</th></tr></thead>
            <tbody>
              {(stats.recentLogs || []).map(f => {
                const isExpired = f.isExpired || (f.expiryDate && new Date(f.expiryDate) < new Date());
                return (
                <tr key={f.fileId || f.id} className="tr-click" onClick={() => navigate(`/files/${f.fileId || f.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
                      <div><div className="fname">{f.filename || f.name}</div><div className="ftype">{f.fileType || f.type || 'unknown'}</div></div>
                    </div>
                  </td>
                  <td>{hashPill(f.originalHash || f.fileHash)}</td>
                  <td><StatusBadge status={f.status} isExpired={isExpired} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {f.verifiedAt ? new Date(f.verifiedAt).toLocaleString() : 'N/A'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}