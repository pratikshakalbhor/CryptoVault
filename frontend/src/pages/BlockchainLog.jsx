import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../styles/BlockchainLog.css';
import { pageVariants, cardVariants, staggerContainer, fadeIn } from '../utils/animations';
import { getStatsFromBlockchain, getFileFromBlockchain, getAddressUrl } from '../utils/blockchain';

export default function BlockchainLog({ walletAddress }) {
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileIdInput, setFileIdInput] = useState('');
  const [fileData, setFileData] = useState(null);
  const [fetching, setFetching] = useState(false);

  const fetchBlockchainStats = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await getStatsFromBlockchain();
      setBlockchainStats(result);
    } catch (err) {
      setError('Blockchain connect error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockchainStats();
  }, [fetchBlockchainStats]);

  const fetchFileFromChain = async () => {
    if (!fileIdInput.trim()) return;
    setFetching(true); setFileData(null);
    try {
      const data = await getFileFromBlockchain(fileIdInput.trim());
      setFileData(data);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setFetching(false);
    }
  };

  const stats = [
    { label: 'Total Files Sealed', value: blockchainStats?.totalFiles ?? '—', sub: 'On Sepolia', color: 'var(--accent)', cls: 'blue' },
    { label: 'Total Verifications', value: blockchainStats?.totalVerifications ?? '—', sub: 'verifyFile() calls', color: 'var(--green)', cls: 'green' },
    { label: 'Tamper Detected', value: blockchainStats?.totalTampered ?? '—', sub: 'Hash mismatches', color: 'var(--red)', cls: 'red' },
    { label: 'Total Revoked', value: blockchainStats?.totalRevoked ?? '—', sub: 'revokeFile() calls', color: '#a78bfa', cls: 'purple' },
  ];

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Stats from Blockchain */}
      <motion.div className="stats-grid" variants={staggerContainer} initial="initial" animate="animate">
        {stats.map((s, i) => (
          <motion.div key={i} className={`stat-card ${s.cls}`} variants={cardVariants}
            whileHover={{ y: -4 }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>
              {loading ? '...' : s.value}
            </div>
            <div className="stat-sub">{s.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={fadeIn} initial="initial" animate="animate"
          style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 10, padding: '14px 18px', fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          ⚠️ {error}
          <button className="btn btn-outline sm" onClick={fetchBlockchainStats}>Retry</button>
        </motion.div>
      )}

      {/* Contract Info */}
      <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate">
        <div className="section-header">
          <span className="section-title">Smart Contract Info</span>
          <span className="section-badge">Ethereum Sepolia</span>
        </div>
        <div className="contract-info-grid">
          {[
            { label: 'Contract Address', value: process.env.REACT_APP_CONTRACT_ADDRESS || 'Not set in .env' },
            { label: 'Network', value: 'Ethereum Sepolia Testnet' },
            { label: 'Compiler', value: 'Solidity ^0.8.19' },
          ].map((item, i) => (
            <div key={i} className="contract-info-item">
              <div className="contract-info-label">{item.label}</div>
              <div className="contract-info-value">
                {i === 0 ? (
                  <a href={getAddressUrl(item.value)}
                    target="_blank" rel="noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                    {item.value} ↗
                  </a>
                ) : item.value}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Fetch File from Blockchain */}
      <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate">
        <div className="section-header">
          <span className="section-title">🔍 Lookup File on Blockchain</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Enter File ID (e.g. FILE-ABC123...)"
            value={fileIdInput}
            onChange={e => setFileIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchFileFromChain()}
            style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 13 }}
          />
          <motion.button className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={fetchFileFromChain} disabled={fetching}>
            {fetching ? '⏳ Fetching...' : '🔍 Lookup'}
          </motion.button>
        </div>

        {/* File Result from Blockchain */}
        {fileData && (
          <motion.div variants={fadeIn} initial="initial" animate="animate"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>
              ✅ File Found on Blockchain
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'File ID', value: fileData.fileId },
                { label: 'Filename', value: fileData.filename },
                { label: 'Hash', value: fileData.fileHash },
                { label: 'Owner', value: fileData.owner },
                { label: 'Timestamp', value: fileData.timestamp },
                { label: 'Revoked', value: fileData.isRevoked ? '⚠️ Yes' : '✅ No' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--surface)', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text)', wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Functions Reference */}
      <motion.div className="section-card" variants={cardVariants} initial="initial" animate="animate">
        <div className="section-title" style={{ marginBottom: 16 }}>Contract Functions</div>
        <div className="tx-list">
          {[
            { icon: '🔒', fn: 'sealFile()', desc: 'File hash permanently store karto', type: 'write', color: 'var(--accent)' },
            { icon: '✅', fn: 'verifyFile()', desc: 'Hash compare + tamper detect karto', type: 'write', color: 'var(--green)' },
            { icon: '👁️', fn: 'quickVerify()', desc: 'Read-only hash comparison (no gas)', type: 'read', color: 'var(--yellow)' },
            { icon: '🚫', fn: 'revokeFile()', desc: 'File record revoke karto', type: 'write', color: 'var(--red)' },
            { icon: '📊', fn: 'getStats()', desc: 'Total files, verifications, tampered', type: 'read', color: '#a78bfa' },
            { icon: '📄', fn: 'getFile()', desc: 'Single file record fetch karto', type: 'read', color: 'var(--accent)' },
          ].map((item, i) => (
            <motion.div key={i} className="tx-item" whileHover={{ borderColor: item.color }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${item.color}18`, border: `1px solid ${item.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)', color: item.color }}>{item.fn}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.desc}</div>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 20, background: item.type === 'read' ? 'rgba(0,255,157,0.1)' : 'rgba(0,212,255,0.1)', color: item.type === 'read' ? 'var(--green)' : 'var(--accent)', border: `1px solid ${item.type === 'read' ? 'rgba(0,255,157,0.2)' : 'rgba(0,212,255,0.2)'}` }}>
                {item.type.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}