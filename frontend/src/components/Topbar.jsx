export default function Topbar({ walletAddress, title }) {
  const short = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  return (
    <header className="navbar">
      <div style={{ marginRight: 'auto', fontWeight: 600, fontSize: '15px' }}>
        {title}
      </div>
      <div className="sim-badge">
        <span className="dot" />
        Simulated Blockchain Mode
      </div>
      <div className="wallet-chip">
        <span style={{ color: 'var(--accent-teal)', fontSize: 9 }}>●</span>
        {short}
      </div>
    </header>
  );
}