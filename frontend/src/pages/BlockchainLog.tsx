export default function BlockchainLog() {
  const logs = [
    { tx: '0x8b2...12e', method: 'SealFile', block: '19456721', time: '5m ago', status: 'Confirmed' },
    { tx: '0x3a4...9f0', method: 'VerifyProof', block: '19456718', time: '12m ago', status: 'Confirmed' },
    { tx: '0x7c1...8b4', method: 'SealFile', block: '19456702', time: '45m ago', status: 'Confirmed' },
    { tx: '0x2d3...e67', method: 'UpdateMetadata', block: '19456685', time: '1h ago', status: 'Confirmed' },
  ];

  return (
    <div className="page-container">
      <div className="card">
        <h2>Blockchain Transaction Log</h2>
        <p className="subtitle">Real-time immutable history of all sealing and verification events.</p>

        <div className="log-list">
          {logs.map((log, i) => (
            <div key={i} className="log-item">
              <div className="log-tx-info">
                <span className="log-method">{log.method}</span>
                <span className="log-hash">{log.tx}</span>
              </div>
              <div className="log-meta">
                <span className="log-block">Block #{log.block}</span>
                <span className="log-time">{log.time}</span>
                <span className="log-status confirmed">{log.status}</span>
              </div>
            </div>
          ))}
        </div>
        
        <button className="btn-outline">View on Explorer</button>
      </div>
    </div>
  );
}
