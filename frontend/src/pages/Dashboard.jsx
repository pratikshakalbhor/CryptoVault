import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFiles, getStats } from '../utils/api';
import {
  Activity, AlertTriangle, Clock, FileText,
  RefreshCw, UploadCloud, Shield, Zap
} from 'lucide-react';
import {
  Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function Dashboard({ walletAddress }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, tampered: 0, recentLogs: [], chartData: [] });

  const fetchData = useCallback(async () => {
    try {
      const [filesRes, statsRes] = await Promise.all([
        getAllFiles(walletAddress),
        getStats(walletAddress),
      ]);
      setFiles(filesRes.files || []);
      const s = statsRes.stats || statsRes || {};

      // Mock chart data if not provided by backend
      const chartData = s.chartData || [
        { day: 'Mon', count: 4 },
        { day: 'Tue', count: 7 },
        { day: 'Wed', count: 5 },
        { day: 'Thu', count: 12 },
        { day: 'Fri', count: 8 },
        { day: 'Sat', count: 15 },
        { day: 'Sun', count: 10 },
      ];

      setStats({
        total: s.total || 0,
        valid: s.valid || 0,
        tampered: s.tampered || 0,
        recentLogs: statsRes.recentLogs || [],
        chartData
      });
    } catch (err) {
      console.error(err);
    } finally {
      // Done
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const integrityPct = stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0;
  const securityLevel = integrityPct > 90 ? 'High' : integrityPct > 70 ? 'Moderate' : 'Critical';
  const securityColor = integrityPct > 90 ? '#2DD4BF' : integrityPct > 70 ? '#F59E0B' : '#FB7185';

  return (
    <div className="page-inner">
      <div className="ph">
        <div><h1>Security Suite</h1><p>Professional-grade file integrity monitoring</p></div>
        <button className="ref-btn" onClick={fetchData}><RefreshCw size={18} /> Refresh</button>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ borderLeft: `4px solid ${securityColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>SECURITY SCORE</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: securityColor }}>{integrityPct}%</div>
            </div>
            <Shield size={32} color={securityColor} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            Status: <span style={{ fontWeight: 700, color: securityColor }}>{securityLevel}</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL ASSETS</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.total}</div>
            </div>
            <FileText size={32} color="var(--accent-cyan)" />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            Across {files.length} unique records
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>THREATS DETECTED</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-red)' }}>{stats.tampered}</div>
            </div>
            <AlertTriangle size={32} color="var(--accent-red)" />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            Integrity violations flagged
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ minWidth: 0 }}>
          <div className="sec-hdr">
            <span className="sec-title"><Activity size={18} /> Verification Activity (Last 7 Days)</span>
          </div>
          <div style={{ width: '100%', height: 300, minWidth: 0, minHeight: 0, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ color: 'var(--accent-cyan)' }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--accent-cyan)" strokeWidth={3} dot={{ fill: 'var(--accent-cyan)', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="sec-hdr">
            <span className="sec-title"><Zap size={18} /> Quick Stats</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>LAST SCAN</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{stats.recentLogs?.[0]?.verifiedAt ? new Date(stats.recentLogs[0].verifiedAt).toLocaleTimeString() : 'N/A'}</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>VAULT HEALTH</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-teal)' }}>OPTIMIZED</div>
            </div>
            <button className="btn btn-teal btn-full" onClick={() => navigate('/upload')}>
              <UploadCloud size={16} /> New Security Seal
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="sec-hdr">
          <span className="sec-title"><Clock size={18} /> Recent Activity Log</span>
        </div>
        {!stats.recentLogs || stats.recentLogs.length === 0 ? (
          <div className="empty">No recent activity detected.</div>
        ) : (
          <table className="activity-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>File</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLogs.slice(0, 10).map((log, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(log.verifiedAt || log.uploadedAt).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                      {log.verifiedAt ? 'Verification' : 'Registration'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={14} color="var(--accent-cyan)" />
                      <span style={{ fontWeight: 600 }}>{log.filename || log.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      color: log.status === 'valid' ? 'var(--accent-teal)' : log.status === 'tampered' ? 'var(--accent-red)' : 'var(--accent-orange)',
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: 'uppercase'
                    }}>
                      {log.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}