import { useState } from 'react';

type TxType = 'seal' | 'verify' | 'alert' | 'revoke';
type TxFilter = 'all' | TxType;

interface Transaction {
  _id: string;
  type: TxType;
  icon: string;
  action: string;
  file: string;
  hash: string;
  block: string;
  gas: string;
  time: string;
}

const TYPE_COLOR: Record<TxType, string> = {
  seal: 'var(--accent)',
  verify: 'var(--green)',
  alert: 'var(--red)',
  revoke: 'var(--yellow)',
};

const TYPE_ICON: Record<TxType, string> = {
  seal: '🔒',
  verify: '✅',
  alert: '⚠️',
  revoke: '🚫',
};

export default function BlockchainLog() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [transactions, setTransactions] = useState<Transaction[]>([]); // MongoDB + Blockchain se aayega
  const [filter, setFilter] = useState<TxFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = transactions.filter(tx => filter === 'all' || tx.type === filter);

  const count = (t: TxType) => transactions.filter(tx => tx.type === t).length;

  const stats = [
    { label: 'Total TXs', value: transactions.length.toString(), sub: 'On Sepolia', color: 'var(--accent)', cls: 'blue' },
    { label: 'Seals', value: count('seal').toString(), sub: 'sealBackup() calls', color: 'var(--green)', cls: 'green' },
    { label: 'Verifications', value: count('verify').toString(), sub: 'verifyBackup() calls', color: '#a78bfa', cls: 'purple' },
    { label: 'Tamper Alerts', value: count('alert').toString(), sub: 'Detected events', color: 'var(--red)', cls: 'red' },
  ];

  return (
    <div className="page-container">

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.cls}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Contract Info */}
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">Smart Contract Info</span>
          <span className="section-badge">Ethereum Sepolia</span>
        </div>
        <div className="contract-info-grid">
          {[
            { label: 'Contract Address', value: 'Deploy ' },
            { label: 'Network', value: 'Ethereum Sepolia Testnet' },
            { label: 'Compiler', value: 'Solidity 0.8.19' },
          ].map((item, i) => (
            <div key={i} className="contract-info-item">
              <div className="contract-info-label">{item.label}</div>
              <div className="contract-info-value">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TX Log */}
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">Transaction History</span>
          <div className="tx-filter-tabs">
            {(['all', 'seal', 'verify', 'alert', 'revoke'] as TxFilter[]).map(f => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'} sm`}
                onClick={() => setFilter(f)}
                style={{ fontSize: 11, textTransform: 'uppercase' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 12 }}>⛓️</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No transactions yet</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Upload a file to create your first blockchain transaction
            </div>
          </div>
        ) : (
          <div className="tx-list">
            {filtered.map(tx => (
              <div key={tx._id}>
                <div
                  className="tx-item"
                  style={{
                    cursor: 'pointer',
                    borderColor: expanded === tx._id ? TYPE_COLOR[tx.type] : 'var(--border)',
                    borderRadius: expanded === tx._id ? '10px 10px 0 0' : '10px',
                  }}
                  onClick={() => setExpanded(expanded === tx._id ? null : tx._id)}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                    background: `${TYPE_COLOR[tx.type]}18`,
                    border: `1px solid ${TYPE_COLOR[tx.type]}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>
                    {TYPE_ICON[tx.type]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{tx.action}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {tx.file} · Block #{tx.block} · {tx.time}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 2 }}>
                      {tx.hash} ↗
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                      Gas: {tx.gas}
                    </div>
                  </div>
                  <span className="status-badge status-valid" style={{ marginLeft: 8 }}>● CONFIRMED</span>
                </div>

                {expanded === tx._id && (
                  <div className="tx-expanded">
                    {[
                      { label: 'Block Number', value: `#${tx.block}` },
                      { label: 'Gas Used', value: tx.gas },
                      { label: 'Network', value: 'Sepolia Testnet' },
                      { label: 'Function', value: tx.action },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="tx-expanded-label">{item.label}</div>
                        <div className="tx-expanded-value">{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}