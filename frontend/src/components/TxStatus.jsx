import { motion } from 'framer-motion';
import { getTxUrl } from '../utils/blockchain';

// ── Transaction Status Component ──
export default function TxStatus({ txHash, status, blockNumber, gasUsed }) {

  if (!txHash) return null;

  const statusConfig = {
    pending:  { color: 'var(--yellow)', icon: '⏳', label: 'Pending...' },
    success:  { color: 'var(--green)',  icon: '✅', label: 'Confirmed' },
    failed:   { color: 'var(--red)',    icon: '❌', label: 'Failed'    },
  };

  const cfg = statusConfig[status] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--surface2)',
        border: `1px solid ${cfg.color}33`,
        borderRadius: 10,
        padding: '14px 18px',
        marginTop: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: cfg.color }}>
            Blockchain Transaction {cfg.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            Ethereum Sepolia Testnet
          </div>
        </div>
      </div>

      {/* TX Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* TX Hash */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', width: 80, flexShrink: 0 }}>
            TX Hash
          </span>
          <a
            href={getTxUrl(txHash)}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)', textDecoration: 'none', wordBreak: 'break-all' }}
            onClick={e => e.stopPropagation()}
          >
            {txHash} ↗
          </a>
        </div>

        {/* Block Number */}
        {blockNumber && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', width: 80, flexShrink: 0 }}>
              Block
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
              #{blockNumber}
            </span>
          </div>
        )}

        {/* Gas Used */}
        {gasUsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', width: 80, flexShrink: 0 }}>
              Gas Used
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
              {Number(gasUsed).toLocaleString()} units
            </span>
          </div>
        )}

      </div>

      {/* View on Etherscan button */}
      <motion.a
        href={getTxUrl(txHash)}
        target="_blank"
        rel="noreferrer"
        className="btn btn-outline sm"
        style={{ display: 'inline-flex', marginTop: 12, textDecoration: 'none', fontSize: 11 }}
        whileHover={{ scale: 1.02 }}
      >
        View on Etherscan ↗
      </motion.a>
    </motion.div>
  );
}