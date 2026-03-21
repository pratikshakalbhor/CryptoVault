import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Login.css';
import { scalePop, cardVariants, staggerContainer, fadeIn } from '../utils/animations';

interface LoginProps { onConnected: (address: string) => void; }
type WalletStatus = 'idle' | 'connecting' | 'connected' | 'error';

const WALLETS = [
  { id: 'metamask',      name: 'MetaMask',       desc: 'Connect using browser extension', icon: '🦊', popular: true  },
  { id: 'coinbase',      name: 'Coinbase Wallet', desc: 'Connect using Coinbase Wallet',   icon: '🔵', popular: false },
  { id: 'walletconnect', name: 'WalletConnect',   desc: 'Scan QR with any wallet',         icon: '🔗', popular: false },
];

export default function Login({ onConnected }: LoginProps) {
  const [status,           setStatus]           = useState<WalletStatus>('idle');
  const [connectingWallet, setConnectingWallet] = useState('');
  const [error,            setError]            = useState('');
  const [address,          setAddress]          = useState('');

  const connectMetaMask = async () => {
    setStatus('connecting'); setConnectingWallet('MetaMask'); setError('');
    try {
      if (!window.ethereum) throw new Error('MetaMask not installed! Please install MetaMask extension.');
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts.length) throw new Error('No accounts found. Please unlock MetaMask.');
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] }); }
        catch { await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0xaa36a7', chainName: 'Sepolia Testnet', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.sepolia.org'], blockExplorerUrls: ['https://sepolia.etherscan.io'] }] }); }
      }
      setAddress(accounts[0]); setStatus('connected');
      setTimeout(() => onConnected(accounts[0]), 1500);
    } catch (err: any) { setError(err.message || 'Connection failed.'); setStatus('error'); }
  };

  const connectOther = async (name: string) => {
    setStatus('connecting'); setConnectingWallet(name);
    await new Promise(r => setTimeout(r, 1500));
    setError(`${name} coming soon! Please use MetaMask.`); setStatus('error');
  };

  const reset = () => { setStatus('idle'); setError(''); };

  return (
    <div className="login-page">
      <div className="grid-bg" />
      <motion.div className="login-orb login-orb-1" animate={{ y: [0,-30,0], scale:[1,1.05,1] }} transition={{ duration:8, repeat:Infinity, ease:'easeInOut' }} />
      <motion.div className="login-orb login-orb-2" animate={{ y: [0,30,0],  scale:[1,1.08,1] }} transition={{ duration:7, repeat:Infinity, ease:'easeInOut', delay:1.5 }} />
      <motion.div className="login-orb login-orb-3" animate={{ y: [0,-20,0], scale:[1,1.04,1] }} transition={{ duration:9, repeat:Infinity, ease:'easeInOut', delay:3 }} />

      <motion.div className="login-card" variants={cardVariants} initial="initial" animate="animate">

        {/* Logo */}
        <motion.div className="login-logo" variants={fadeIn} initial="initial" animate="animate">
          <motion.div className="login-logo-icon" whileHover={{ rotate:[0,-10,10,0], scale:1.1 }} transition={{ duration:0.4 }}>🔐</motion.div>
          <div>
            <div className="login-logo-text">CryptoVault</div>
            <div className="login-logo-sub">Integrity Verified</div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* IDLE */}
          {status === 'idle' && (
            <motion.div key="idle" variants={fadeIn} initial="initial" animate="animate" exit={{ opacity:0, y:-10 }}>
              <div className="login-heading">Connect Your Wallet</div>
              <div className="login-subheading">Connect your Web3 wallet to access CryptoVault. Your files stay encrypted and secure on blockchain.</div>
              <motion.div className="wallet-options" variants={staggerContainer} initial="initial" animate="animate">
                {WALLETS.map(w => (
                  <motion.button key={w.id} className={`wallet-btn ${w.id}`} variants={cardVariants}
                    whileHover={{ y:-3, boxShadow:'0 12px 32px rgba(0,212,255,0.15)' }} whileTap={{ scale:0.98 }}
                    onClick={() => w.id === 'metamask' ? connectMetaMask() : connectOther(w.name)}>
                    <div className="wallet-btn-icon">{w.icon}</div>
                    <div className="wallet-btn-info">
                      <div className="wallet-btn-name">{w.name}{w.popular && <span className="popular-badge" style={{ marginLeft:8 }}>Popular</span>}</div>
                      <div className="wallet-btn-desc">{w.desc}</div>
                    </div>
                    <motion.span className="wallet-btn-arrow" whileHover={{ x:4 }}>→</motion.span>
                  </motion.button>
                ))}
              </motion.div>
              <motion.div variants={fadeIn} initial="initial" animate="animate" transition={{ delay:0.4 }}>
                <div className="login-divider"><div className="login-divider-line" /><span className="login-divider-text">Secured by</span><div className="login-divider-line" /></div>
                <div className="security-info">
                  <span className="security-info-icon">🛡️</span>
                  <div className="security-info-text"><strong>Non-custodial</strong> — We never store your private keys. <strong>AES-256</strong> + <strong>Ethereum</strong> blockchain.</div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* CONNECTING */}
          {status === 'connecting' && (
            <motion.div key="connecting" variants={scalePop} initial="initial" animate="animate" className="connecting-state">
              <motion.div animate={{ rotate:360 }} transition={{ duration:0.75, repeat:Infinity, ease:'linear' }}
                style={{ width:48, height:48, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', margin:'0 auto 16px' }} />
              <div className="connecting-name">{connectingWallet === 'MetaMask' ? '🦊' : '🔗'} {connectingWallet}</div>
              <div className="connecting-desc">Check your wallet for connection request...</div>
            </motion.div>
          )}

          {/* CONNECTED */}
          {status === 'connected' && (
            <motion.div key="connected" variants={scalePop} initial="initial" animate="animate" className="connected-state">
              <motion.div className="connected-check" initial={{ scale:0, rotate:-180 }} animate={{ scale:1, rotate:0 }} transition={{ duration:0.5, ease:[0.16,1,0.3,1] as any }}>✓</motion.div>
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
                <div style={{ fontSize:18, fontWeight:800, color:'var(--green)', marginBottom:8 }}>Connected!</div>
                <div className="connected-address">{address.substring(0,6)}...{address.substring(address.length-4)}</div>
                <div style={{ fontSize:12, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>Redirecting to Dashboard...</div>
              </motion.div>
            </motion.div>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <motion.div key="error" variants={cardVariants} initial="initial" animate="animate">
              <div className="login-heading">Connection Failed</div>
              <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                style={{ background:'rgba(255,59,92,0.08)', border:'1px solid rgba(255,59,92,0.25)', borderRadius:12, padding:'16px 18px', marginBottom:24, fontSize:13, color:'var(--red)', fontFamily:'var(--font-mono)', lineHeight:1.6 }}>
                ⚠️ {error}
              </motion.div>
              {error.includes('not installed') && (
                <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginBottom:12, textDecoration:'none' }}>🦊 Install MetaMask</a>
              )}
              <motion.button className="btn btn-outline" style={{ width:'100%', justifyContent:'center' }} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={reset}>← Try Again</motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: any[] }) => Promise<any>; on: (event: string, handler: (...args: any[]) => void) => void; };
  }
}