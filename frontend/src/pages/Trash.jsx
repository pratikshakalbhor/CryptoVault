import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RefreshCw, Loader2, Database, AlertCircle } from 'lucide-react';
import { getTrashFiles, restoreFile, deleteFilePermanently } from '../utils/api';
import { pageVariants, staggerContainer, fadeIn } from '../utils/animations';

const fmtSize = b => !b ? '—' : b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(2) + ' MB';

export default function Trash({ walletAddress }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrashFiles(walletAddress);
      setFiles(res.files || []);
      setError('');
    } catch (err) {
      setError(err.message || "Failed to load trash");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (id) => {
    setProcessing(id);
    try {
      await restoreFile(id);
      setFiles(files.filter(f => f.fileId !== id));
    } catch (err) {
      alert(err.message || "Restore failed");
    } finally {
      setProcessing(null);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    setProcessing(id);
    try {
      await deleteFilePermanently(id);
      setFiles(files.filter(f => f.fileId !== id));
    } catch (err) {
      alert(err.message || "Delete failed");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={48} className="spin" style={{ color: 'var(--accent-cyan)' }} />
      </div>
    );
  }

  return (
    <motion.div className="dashboard" variants={pageVariants} initial="initial" animate="animate">
      
      {/* Header */}
      <div className="ph" style={{ marginBottom: 30 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-red)' }}>
            <Trash2 size={24} /> Trash
          </h1>
          <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>Files you have deleted are kept here until you restore or permanently delete them.</p>
        </div>
        <button className="ref-btn" onClick={fetchTrash} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 20 }}>{error}</div>}

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="v-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} color="var(--accent-red)" />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{files.length} items in Trash</span>
        </div>

        {files.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Trash2 size={48} style={{ opacity: 0.2, marginBottom: 16, display: 'inline-block' }} />
            <h3 style={{ fontSize: 18, color: 'var(--text-main)', marginBottom: 8 }}>Trash is empty</h3>
            <p style={{ fontSize: 14 }}>Deleted files will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>File Name</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>Size</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>Deleted On</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {files.map(f => (
                    <motion.tr 
                      key={f.fileId}
                      variants={fadeIn}
                      initial="initial"
                      animate="animate"
                      exit={{ opacity: 0, x: -20 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Database size={16} color="var(--text-muted)" />
                          {f.filename}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{fmtSize(f.fileSize)}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                        {f.deletedAt ? new Date(f.deletedAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button 
                            onClick={() => handleRestore(f.fileId)}
                            disabled={processing === f.fileId}
                            style={{ 
                              background: 'rgba(45, 212, 191, 0.1)', 
                              color: 'var(--accent-teal)', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: 6, 
                              fontSize: 12, 
                              fontWeight: 600, 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            {processing === f.fileId ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
                            Restore
                          </button>
                          <button 
                            onClick={() => handlePermanentDelete(f.fileId)}
                            disabled={processing === f.fileId}
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              color: 'var(--accent-red)', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: 6, 
                              fontSize: 12, 
                              fontWeight: 600, 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            {processing === f.fileId ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                            Delete Forever
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
