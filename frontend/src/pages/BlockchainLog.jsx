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
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {error}
          </span>
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
          <span className="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Lookup File on Blockchain
          </span>
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
            {fetching
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Fetching...</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Lookup</>}
          </motion.button>
        </div>

        {/* File Result from Blockchain */}
        {fileData && (
          <motion.div variants={fadeIn} initial="initial" animate="animate"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent)', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              File Found on Blockchain
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'File ID', value: fileData.fileId },
                { label: 'Filename', value: fileData.filename },
                { label: 'Hash', value: fileData.fileHash },
                { label: 'Owner', value: fileData.owner },
                { label: 'Timestamp', value: fileData.timestamp },
                { label: 'Revoked', value: fileData.isRevoked
                  ? <span style={{color:'var(--red)', display:'inline-flex', alignItems:'center', gap:4}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Yes</span>
                  : <span style={{color:'var(--green)', display:'inline-flex', alignItems:'center', gap:4}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>No</span> },
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
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, fn: 'sealFile()', desc: 'Stores file hash permanently on-chain', type: 'write', color: 'var(--accent)' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, fn: 'verifyFile()', desc: 'Hash compare + tamper detection', type: 'write', color: 'var(--green)' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, fn: 'quickVerify()', desc: 'Read-only hash comparison (no gas)', type: 'read', color: 'var(--yellow)' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, fn: 'revokeFile()', desc: 'Revokes a file record on-chain', type: 'write', color: 'var(--red)' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, fn: 'getStats()', desc: 'Total files, verifications, tampered', type: 'read', color: '#a78bfa' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, fn: 'getFile()', desc: 'Fetch a single file record', type: 'read', color: 'var(--accent)' },
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