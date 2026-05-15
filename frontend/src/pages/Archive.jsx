import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getArchivedFiles, restoreFromArchive } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  RefreshCw, FileText, Search, 
  Database, ArrowLeftRight
} from 'lucide-react';

export default function Archive({ walletAddress }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadArchived = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getArchivedFiles(walletAddress);
      setFiles(data.files || []);
    } catch (err) {
      toast.error("Failed to load archive");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) loadArchived();
  }, [walletAddress, loadArchived]);

  const handleRestore = async (id) => {
    try {
      await restoreFromArchive(id, walletAddress);
      toast.success("Asset restored to vault");
      loadArchived();
    } catch (err) {
      toast.error("Restoration failed");
    }
  };

  const filtered = files.filter(f => 
    (f.fileName || f.filename || '').toLowerCase().includes(search.toLowerCase()) ||
    f.fileId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-inner">
        <header className="ph" style={{ marginBottom: 32 }}>
          <div>
            <h1>Forensic Archive</h1>
            <p>Immutable cold storage for retired or investigation assets</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            padding: '10px 18px', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              placeholder="Search archive ledger..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13, width: 200 }}
            />
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 80 }}>
              <RefreshCw size={40} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: 20 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Accessing encrypted cold storage records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1', textAlign: 'center', padding: 100, 
              background: 'rgba(255,255,255,0.01)', border: '1.5px dashed var(--border)', borderRadius: 24 
            }}>
              <Database size={48} color="var(--border-light)" style={{ marginBottom: 24 }} />
              <h3 style={{ color: 'var(--text-secondary)', fontSize: 18, fontWeight: 700 }}>Archive is Empty</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>No assets have been transferred to immutable cold storage.</p>
            </div>
          ) : (
            filtered.map(file => (
              <motion.div
                layout key={file.fileId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card glass-card"
                style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                  onClick={() => navigate(`/files/${file.fileId}`)}
                >
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 12, 
                    background: 'rgba(148,163,184,0.05)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                  }}>
                    <FileText size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.fileName || file.filename}
                    </h4>
                    <div style={{ fontSize: 10, color: 'var(--accent-purple)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                      ID: {file.fileId.slice(0, 12)}...
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.2)', padding: '14px 18px', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>ARCHIVED ON</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{new Date(file.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>INTEGRITY STATUS</span>
                    <span style={{ color: 'var(--accent-teal)', fontWeight: 800, letterSpacing: '0.05em' }}>SECURED</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => handleRestore(file.fileId)}
                    className="btn btn-teal btn-full"
                    style={{ height: 44, fontSize: 12, fontWeight: 800 }}>
                    <ArrowLeftRight size={14} /> <span>RESTORE TO VAULT</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
