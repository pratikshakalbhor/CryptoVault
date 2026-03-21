import { useState } from 'react';
import '../styles/Files.css';
import StatusBadge from '../components/StatusBadge';

type StatusType = 'valid' | 'tampered' | 'pending';
type FilterType  = 'all' | StatusType;

interface FileRecord {
  _id: string;
  name: string;
  type: string;
  size: string;
  hash: string;
  txHash: string;
  timestamp: string;
  status: StatusType;
  encrypted: boolean;
}

interface FilesProps { onNavigate: (page: string) => void; }

export default function Files({ onNavigate }: FilesProps) {
  const [files]        = useState<FileRecord[]>([]); // MongoDB se aayega
  const [filter,       setFilter]       = useState<FilterType>('all');
  const [search,       setSearch]       = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const filtered = files.filter(f => {
    const matchFilter = filter === 'all' || f.status === filter;
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = (s: FilterType) =>
    s === 'all' ? files.length : files.filter(f => f.status === s).length;

  return (
    <div className="page-container">

      {/* Controls */}
      <div className="files-controls">
        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {(['all', 'valid', 'tampered', 'pending'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'} sm`}
              onClick={() => setFilter(f)}
              style={{ fontSize: 11, textTransform: 'uppercase' }}
            >
              {f} ({count(f)})
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('upload')}>+ Upload New</button>
      </div>

      {/* Table */}
      <div className="files-section">
        <div className="files-header">
          <span className="section-title">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No files found</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Upload your first file to see it here
            </div>
            <button className="btn btn-primary" onClick={() => onNavigate('upload')}>
              🔒 Upload & Seal
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th><th>Type</th><th>Size</th><th>SHA-256 Hash</th>
                <th>TX Hash</th><th>Uploaded</th><th>Enc</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr
                  key={f._id}
                  onClick={() => setSelectedFile(selectedFile === f._id ? null : f._id)}
                  style={{ cursor: 'pointer', background: selectedFile === f._id ? 'rgba(0,212,255,0.04)' : 'transparent' }}
                >
                  <td><span style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</span></td>
                  <td><span className={`file-type-badge badge-${f.type}`}>{f.type.toUpperCase()}</span></td>
                  <td><span className="mono-text">{f.size}</span></td>
                  <td><span className="hash-text">{f.hash.substring(0, 14)}...</span></td>
                  <td><span className="tx-link">{f.txHash.substring(0, 12)}... ↗</span></td>
                  <td><span className="mono-text">{f.timestamp}</span></td>
                  <td>{f.encrypted ? '🔐' : '—'}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td>
                    <button
                      className="btn btn-outline sm"
                      onClick={e => { e.stopPropagation(); onNavigate('verify'); }}
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* File Detail Panel */}
      {selectedFile && (() => {
        const f = files.find(x => x._id === selectedFile);
        if (!f) return null;
        return (
          <div className="section-card">
            <div className="section-header">
              <span className="section-title">File Details — {f.name}</span>
              <button className="btn btn-outline sm" onClick={() => setSelectedFile(null)}>✕ Close</button>
            </div>
            <div className="file-detail-grid">
              {[
                { label: 'Full SHA-256 Hash', value: f.hash },
                { label: 'Blockchain TX Hash', value: f.txHash },
                { label: 'Upload Timestamp',  value: f.timestamp },
                { label: 'File Size',         value: f.size },
                { label: 'File Type',         value: f.type.toUpperCase() },
                { label: 'Encrypted',         value: f.encrypted ? 'Yes — AES-256' : 'No' },
              ].map((item, i) => (
                <div key={i} className="file-detail-item">
                  <div className="file-detail-label">{item.label}</div>
                  <div className="file-detail-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

    </div>
  );
}