import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, X, Shield } from 'lucide-react';
import { getAllFiles } from '../utils/api';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 }
};

export default function FileSelectionModal({ walletAddress, isOpen, onClose, onSelect }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllFiles(walletAddress);
      // Filter out archived files if necessary (backend already does this usually)
      setFiles(data.files || []);
    } catch (err) {
      console.error("Failed to load files for selection:", err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isOpen && walletAddress) {
      loadFiles();
    }
  }, [isOpen, walletAddress, loadFiles]);

  const filtered = files.filter(f => 
    (f.fileName || f.filename || '').toLowerCase().includes(search.toLowerCase()) ||
    f.fileId.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)'
    }}>
      <motion.div
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        style={{
          width: '100%', maxWidth: 550, maxHeight: '85vh',
          background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={20} color="#14b8a6" /> Select Vault Asset
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Choose a registered file to audit its integrity</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 5 }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '10px 16px'
          }}>
            <Search size={16} color="#64748b" />
            <input
              placeholder="Search by filename or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none', color: '#f8fafc',
                fontSize: 14, width: '100%', fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '0 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading vault assets...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No assets found in your vault</div>
          ) : (
            filtered.map(file => (
              <motion.div
                key={file.fileId}
                whileHover={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(20,184,166,0.3)' }}
                onClick={() => onSelect(file)}
                style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(20,184,166,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6'
                }}>
                  <FileText size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.fileName || file.filename}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: 'monospace' }}>{file.fileId}</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                  background: 'rgba(20,184,166,0.1)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.2)'
                }}>
                  SECURE
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
