import { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/Dashboard.css';
import StatusBadge from '../components/StatusBadge';
import { pageVariants, staggerContainer, cardVariants, tableRow, fadeIn } from '../utils/animations';

interface FileRecord {
  _id: string; name: string; type: string; size: string;
  hash: string; txHash: string; timestamp: string;
  status: 'valid' | 'tampered' | 'pending'; encrypted: boolean;
}
interface DashboardProps { onNavigate: (page: string) => void; }

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [files] = useState<FileRecord[]>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const totalFiles    = files.length;
  const validFiles    = files.filter(f => f.status === 'valid').length;
  const tamperedFiles = files.filter(f => f.status === 'tampered').length;

  const stats = [
    { label: 'Total Files',    value: totalFiles.toString(),    sub: 'Uploaded files',    color: 'var(--accent)', cls: 'blue'   },
    { label: 'Valid',          value: validFiles.toString(),    sub: 'Integrity intact',  color: 'var(--green)',  cls: 'green'  },
    { label: 'Tampered',       value: tamperedFiles.toString(), sub: '⚠️ Action needed',  color: 'var(--red)',    cls: 'red'    },
    { label: 'Blockchain TXs', value: totalFiles.toString(),    sub: 'On Sepolia',        color: '#a78bfa',       cls: 'purple' },
  ];

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Stats — stagger animation */}
      <motion.div className="stats-grid" variants={staggerContainer} initial="initial" animate="animate">
        {stats.map((s, i) => (
          <motion.div key={i} className={`stat-card ${s.cls}`} variants={cardVariants}
            whileHover={{ y:-4, boxShadow:'0 12px 32px rgba(0,212,255,0.1)' }} transition={{ duration:0.2 }}>
            <div className="stat-label">{s.label}</div>
            <motion.div className="stat-value" style={{ color: s.color }}
              initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i * 0.08 + 0.2, duration:0.4, ease:[0.16,1,0.3,1] }}>
              {s.value}
            </motion.div>
            <div className="stat-sub">{s.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="quick-actions" variants={fadeIn} initial="initial" animate="animate" transition={{ delay:0.3 }}>
        {[
          { label: '🔒 Upload & Seal', page: 'upload', primary: true  },
          { label: '◎ Verify File',   page: 'verify', primary: false },
          { label: '⛓ Blockchain Log',page: 'blockchain', primary: false },
        ].map((btn, i) => (
          <motion.button key={i}
            className={`btn ${btn.primary ? 'btn-primary' : 'btn-outline'}`}
            whileHover={{ y:-2, scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={() => onNavigate(btn.page)}>
            {btn.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Files Table */}
      <motion.div className="files-section" variants={cardVariants} initial="initial" animate="animate" transition={{ delay:0.2 }}>
        <div className="files-header">
          <span className="section-title">Recent Files</span>
          <motion.button className="btn btn-outline sm" whileHover={{ x:3 }} onClick={() => onNavigate('files')}>View All →</motion.button>
        </div>

        {files.length === 0 ? (
          <motion.div variants={fadeIn} initial="initial" animate="animate"
            style={{ textAlign:'center', padding:'48px 24px', color:'var(--muted)' }}>
            <motion.div style={{ fontSize:40, marginBottom:12 }} animate={{ y:[0,-8,0] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}>📂</motion.div>
            <div style={{ fontWeight:700, marginBottom:6, color:'var(--text)' }}>No files uploaded yet</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:16 }}>Upload your first file to get started</div>
            <motion.button className="btn btn-primary" whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} onClick={() => onNavigate('upload')}>
              🔒 Upload First File
            </motion.button>
          </motion.div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th><th>Size</th><th>SHA-256 Hash</th>
                <th>TX Hash</th><th>Uploaded</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {files.slice(0, 5).map((f, i) => (
                <motion.tr key={f._id} variants={tableRow} initial="initial" animate="animate" transition={{ delay: i * 0.05 }}
                  onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ background: hoveredRow === i ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td>
                    <div className="file-row-name">
                      <span className={`file-type-badge badge-${f.type}`}>{f.type.toUpperCase()}</span>
                      <span style={{ fontWeight:600, fontSize:13 }}>{f.name}</span>
                      {f.encrypted && <span>🔐</span>}
                    </div>
                  </td>
                  <td><span className="mono-text">{f.size}</span></td>
                  <td><span className="hash-text">{f.hash.substring(0,16)}...</span></td>
                  <td><span className="tx-link">{f.txHash.substring(0,14)}... ↗</span></td>
                  <td><span className="mono-text">{f.timestamp}</span></td>
                  <td><StatusBadge status={f.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Tamper Alert */}
      {tamperedFiles > 0 && (
        <motion.div className="alert-banner" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
          <span>⚠️</span>
          <div>
            <div style={{ fontWeight:700, marginBottom:2 }}>{tamperedFiles} Tampered File{tamperedFiles > 1 ? 's' : ''} Detected!</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>File integrity compromised. Verify immediately.</div>
          </div>
          <motion.button className="btn btn-danger sm" whileHover={{ scale:1.04 }} onClick={() => onNavigate('verify')}>Investigate →</motion.button>
        </motion.div>
      )}

    </motion.div>
  );
}