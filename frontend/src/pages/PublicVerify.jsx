import { useState, useEffect } from 'react';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function PublicVerify() {
  const [file, setFile]       = useState(null);
  const [fileId, setFileId]   = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [drag, setDrag]       = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('fileId');
    if (id) setFileId(id);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleVerify = async () => {
    if (!file || !fileId.trim()) {
      setError('File aani File ID dono required aahеt');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileId', fileId.trim());

      const res = await fetch(`${BASE_URL}/verify`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verify failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setFileId('');
    setResult(null);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* Logo / Brand */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(55,138,221,0.15)',
            border: '1px solid rgba(55,138,221,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#378ADD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>
            CryptoVault
          </span>
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 500, color: '#fff',
          margin: '0 0 8px', letterSpacing: '-0.02em',
        }}>
          Public File Verification
        </h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
          Login shivay file chi blockchain integrity verify kara
        </p>
      </div>

      {/* Main card */}
      <div style={{
        width: '100%', maxWidth: 500,
        background: '#141414',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 16, overflow: 'hidden',
      }}>

        {!result ? (
          <div style={{ padding: '28px 28px 24px' }}>

            {/* File drop zone */}
            <div style={{
              fontSize: 11, fontWeight: 500, color: '#666',
              textTransform: 'uppercase', letterSpacing: '.05em',
              marginBottom: 8,
            }}>
              Step 1 — File select kara
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onClick={() => document.getElementById('pv-input').click()}
              style={{
                border: `1.5px dashed ${drag ? '#378ADD' : file ? '#639922' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 10,
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: drag ? 'rgba(55,138,221,0.05)' : file ? 'rgba(99,153,34,0.05)' : 'transparent',
                transition: 'all 0.15s',
                marginBottom: 16,
              }}
            >
              <input
                id="pv-input" type="file"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <div style={{ fontSize: 13, color: '#639922', fontWeight: 500 }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    {Math.round(file.size / 1024)} KB · Click to change
                  </div>
                </div>
              ) : (
                <div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ marginBottom: 8 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div style={{ fontSize: 13, color: '#888' }}>
                    Drag & drop ya click kara
                  </div>
                </div>
              )}
            </div>

            {/* File ID input */}
            <div style={{
              fontSize: 11, fontWeight: 500, color: '#666',
              textTransform: 'uppercase', letterSpacing: '.05em',
              marginBottom: 8,
            }}>
              Step 2 — File ID ghala
            </div>
            <input
              value={fileId}
              onChange={e => setFileId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="FILE-XXXXXX1234567890"
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: 8, fontSize: 13,
                border: '0.5px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.03)',
                color: '#fff', outline: 'none',
                fontFamily: 'monospace',
                marginBottom: 16,
              }}
            />

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: '#FCEBEB', border: '0.5px solid #F09595',
                fontSize: 12, color: '#791F1F',
              }}>
                {error}
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={loading || !file || !fileId.trim()}
              style={{
                width: '100%', padding: '12px',
                borderRadius: 10, border: 'none',
                background: loading || !file || !fileId.trim()
                  ? '#333' : '#378ADD',
                color: loading || !file || !fileId.trim() ? '#666' : '#fff',
                fontSize: 14, fontWeight: 500,
                cursor: loading || !file || !fileId.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Verifying...' : 'Verify on Blockchain'}
            </button>

            {/* Info strip */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 20,
              marginTop: 20, paddingTop: 16,
              borderTop: '0.5px solid rgba(255,255,255,0.06)',
            }}>
              {[
                { label: 'No login required' },
                { label: 'Blockchain verified' },
                { label: 'Instant result' },
              ].map((item, i) => (
                <div key={i} style={{
                  fontSize: 11, color: '#555',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#378ADD', display: 'inline-block',
                  }}/>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* Result */
          <div style={{ padding: '28px' }}>
            <div style={{
              background: result.isMatch ? '#EAF3DE' : '#FCEBEB',
              border: `1px solid ${result.isMatch ? '#97C459' : '#F09595'}`,
              borderRadius: 12, padding: '20px',
              textAlign: 'center', marginBottom: 20,
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>
                {result.isMatch ? '✓' : '✗'}
              </div>
              <div style={{
                fontSize: 18, fontWeight: 600,
                color: result.isMatch ? '#27500A' : '#791F1F',
                marginBottom: 6,
              }}>
                {result.isMatch
                  ? 'File is Authentic'
                  : 'Tamper Detected!'}
              </div>
              <div style={{
                fontSize: 12,
                color: result.isMatch ? '#3B6D11' : '#A32D2D',
              }}>
                {result.isMatch
                  ? 'Blockchain seal matched — file has not been modified'
                  : 'Hash mismatch — file has been altered since sealing'}
              </div>
            </div>

            {/* Details */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '14px 16px',
              marginBottom: 16,
            }}>
              {[
                { label: 'Filename',  value: result.filename },
                { label: 'File ID',   value: result.fileId },
                { label: 'TX Hash',   value: result.txHash?.slice(0,24)+'...' },
                { label: 'Verified',  value: new Date(result.verifiedAt).toLocaleString() },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, padding: '5px 0',
                  borderBottom: i < 3 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <span style={{ color: '#666' }}>{row.label}</span>
                  <span style={{ color: '#ccc', fontFamily: 'monospace', fontSize: 11 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Etherscan link */}
            {result.txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                target="_blank" rel="noreferrer"
                style={{
                  display: 'block', textAlign: 'center',
                  fontSize: 12, color: '#378ADD',
                  textDecoration: 'none', marginBottom: 14,
                }}
              >
                View transaction on Etherscan →
              </a>
            )}

            <button onClick={reset} style={{
              width: '100%', padding: '10px',
              borderRadius: 8, fontSize: 13,
              border: '0.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: '#888',
              cursor: 'pointer',
            }}>
              Verify another file
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, fontSize: 12, color: '#444' }}>
        Powered by Ethereum Sepolia · CryptoVault 2026
      </div>
    </div>
  );
}
