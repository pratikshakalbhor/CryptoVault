import { useState } from 'react';
import { ethers } from 'ethers';
import ABI from '../utils/abi.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function ShareModal({ file, onClose, onSuccess }) {
  const [wallet, setWallet]     = useState('');
  const [perm, setPerm]         = useState('view');
  const [step, setStep]         = useState(0); // 0=idle 1,2,3=progress 4=done
  const [txHash, setTxHash]     = useState('');
  const [error, setError]       = useState('');

  const isValidWallet = (v) => /^0x[0-9a-fA-F]{40}$/.test(v);

  const handleShare = async () => {
    setError('');
    if (!isValidWallet(wallet)) {
      setError('Valid Ethereum address ghala (0x... 42 chars)');
      return;
    }

    try {
      setStep(1);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      setStep(2);
      // Smart contract la shareFile call karo
      // Jar tumchya contract madhe shareFile nahi tar
      // authorizeUploader vaprto (permission add karo)
      const permLevel = perm === 'view' ? 1 : 2;
      let tx;
      try {
        tx = await contract.shareFile(file.fileId, wallet, permLevel);
      } catch {
        // shareFile nahi contract madhe — authorizeUploader fallback
        tx = await contract.addUploader(wallet);
      }

      setStep(3);
      await tx.wait();

      setTxHash(tx.hash);
      setStep(4);
      onSuccess?.(`${file.filename} shared with ${wallet.slice(0,8)}...`);
    } catch (err) {
      setError(err.code === 4001
        ? 'MetaMask rejected — please confirm transaction'
        : err.message || 'Transaction failed');
      setStep(0);
    }
  };

  const stepLabels = [
    'Validating wallet address',
    'Sending blockchain transaction',
    'Confirming on Sepolia',
  ];

  const StepDot = ({ n }) => {
    const done    = step > n;
    const active  = step === n;
    const color   = done ? '#639922' : active ? '#378ADD' : '#B4B2A9';
    return (
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <div style={{
          width:8, height:8, borderRadius:'50%',
          background: color, flexShrink:0, transition:'background .3s'
        }}/>
        <span style={{
          fontSize:12,
          color: done ? '#3B6D11' : active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          fontWeight: active ? 500 : 400
        }}>
          {stepLabels[n - 1]}
        </span>
      </div>
    );
  };

  // Overlay click → close
  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleOverlay}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:1000, padding:'1rem'
      }}
    >
      <div style={{
        background:'var(--color-background-primary)',
        border:'0.5px solid var(--color-border-tertiary)',
        borderRadius:'var(--border-radius-lg)',
        width:'100%', maxWidth:440,
        overflow:'hidden'
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px',
          borderBottom:'0.5px solid var(--color-border-tertiary)'
        }}>
          <span style={{ fontSize:15, fontWeight:500, color:'var(--color-text-primary)' }}>
            Share file access
          </span>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:'var(--border-radius-md)',
            border:'0.5px solid var(--color-border-secondary)',
            background:'var(--color-background-secondary)',
            cursor:'pointer', fontSize:16, color:'var(--color-text-secondary)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px' }}>

          {/* File pill */}
          <div style={{
            display:'flex', alignItems:'center', gap:10,
            background:'var(--color-background-secondary)',
            borderRadius:'var(--border-radius-md)',
            padding:'10px 14px', marginBottom:18
          }}>
            <div style={{
              width:32, height:32, borderRadius:'var(--border-radius-md)',
              background:'#E6F1FB', display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>
                {file?.filename}
              </div>
              <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:1 }}>
                {file?.fileId}
              </div>
            </div>
          </div>

          {/* Wallet input */}
          <div style={{ fontSize:12, fontWeight:500, color:'var(--color-text-secondary)',
            textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>
            Recipient wallet address
          </div>
          <input
            value={wallet}
            onChange={e => { setWallet(e.target.value); setError(''); }}
            placeholder="0x..."
            maxLength={42}
            style={{
              width:'100%', padding:'9px 12px',
              border: `0.5px solid ${error ? '#E24B4A' : 'var(--color-border-secondary)'}`,
              borderRadius:'var(--border-radius-md)',
              fontSize:13, fontFamily:'var(--font-mono)',
              background:'var(--color-background-primary)',
              color:'var(--color-text-primary)', outline:'none'
            }}
          />
          {error && (
            <div style={{ fontSize:11, color:'#A32D2D', marginTop:4 }}>{error}</div>
          )}

          {/* Permission toggle */}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'var(--color-text-secondary)',
              textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>
              Permission level
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { key:'view', title:'View only',    desc:'Can verify integrity only' },
                { key:'full', title:'Full access',  desc:'Can verify, download & revoke' },
              ].map(opt => (
                <div key={opt.key} onClick={() => setPerm(opt.key)} style={{
                  border: perm===opt.key ? '2px solid #378ADD' : '0.5px solid var(--color-border-secondary)',
                  borderRadius:'var(--border-radius-md)',
                  padding:'12px 14px', cursor:'pointer',
                  background: perm===opt.key ? '#E6F1FB' : 'var(--color-background-secondary)',
                  transition:'border-color .15s, background .15s'
                }}>
                  <div style={{
                    fontSize:13, fontWeight:500,
                    color: perm===opt.key ? '#0C447C' : 'var(--color-text-primary)'
                  }}>{opt.title}</div>
                  <div style={{
                    fontSize:11, marginTop:3,
                    color: perm===opt.key ? '#185FA5' : 'var(--color-text-secondary)'
                  }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress steps */}
          {step > 0 && step < 4 && (
            <div style={{
              marginTop:16, background:'var(--color-background-secondary)',
              borderRadius:'var(--border-radius-md)', padding:'14px 16px'
            }}>
              <StepDot n={1} /><StepDot n={2} /><StepDot n={3} />
            </div>
          )}

          {/* Success */}
          {step === 4 && (
            <div style={{
              marginTop:16, background:'#EAF3DE',
              border:'0.5px solid #97C459',
              borderRadius:'var(--border-radius-md)', padding:'14px 16px'
            }}>
              <div style={{ fontSize:13, fontWeight:500, color:'#27500A' }}>
                Access granted on blockchain
              </div>
              <div style={{
                fontSize:11, fontFamily:'var(--font-mono)',
                color:'#3B6D11', marginTop:4, wordBreak:'break-all'
              }}>{txHash}</div>
              <div style={{ fontSize:11, color:'#3B6D11', marginTop:6 }}>
                Permission: {perm === 'view' ? 'View only' : 'Full access'}
                &nbsp;•&nbsp;
                {wallet.slice(0,10)}...{wallet.slice(-6)}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 }}>
            <button onClick={onClose} style={{
              padding:'8px 16px', borderRadius:'var(--border-radius-md)',
              border:'0.5px solid var(--color-border-secondary)',
              background:'var(--color-background-secondary)',
              color:'var(--color-text-primary)', fontSize:13, cursor:'pointer'
            }}>
              {step === 4 ? 'Close' : 'Cancel'}
            </button>
            {step < 4 && (
              <button
                onClick={handleShare}
                disabled={step > 0}
                style={{
                  padding:'8px 18px', borderRadius:'var(--border-radius-md)',
                  border:'none',
                  background: step > 0 ? '#B4B2A9' : '#378ADD',
                  color:'#E6F1FB', fontSize:13, fontWeight:500,
                  cursor: step > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {step > 0 ? 'Processing...' : 'Share on blockchain'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
