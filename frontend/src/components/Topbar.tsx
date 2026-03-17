import '../styles/Topbar.css';

interface TopbarProps {
  pageTitle: string;
}

export default function Topbar({ pageTitle }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="page-title">{pageTitle}</div>
      <div className="topbar-right">
        <div className="wallet-badge">🦊 0x4a3b...8f2c</div>
        <div className="avatar">U</div>
      </div>
    </div>
  );
}