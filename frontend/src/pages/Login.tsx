import { useState } from 'react';
import '../styles/Login.css';

interface LoginProps {
  onConnected: (address: string) => void;
}

type WalletStatus = 'idle' | 'connecting' | 'connected' | 'error';

const WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    desc: 'Connect using browser extension',
    icon: '🦊',
    popular: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    desc: 'Connect using Coinbase Wallet app',
    icon: '🔵',
    popular: false,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    desc: 'Scan QR with any wallet',
    icon: '🔗',
    popular: false,
  },
];

export default function Login({ onConnected }: LoginProps) {
  const [status,          setStatus]          = useState<WalletStatus>('idle');
  const [connectingWallet,setConnectingWallet] = useState<string>('');
  const [error,           setError]           = useState<string>('');
  const [address,         setAddress]         = useState<string>('');

  // ── Real MetaMask Connect ──
  const connectMetaMask = async () => {
    setStatus('connecting');
    setConnectingWallet('MetaMask');
    setError('');

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask not installed! Please install MetaMask extension.');
      }

      // Request account access
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Check network — switch to Sepolia if needed
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia
          });
        } catch {
          // Sepolia not added — add it
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
        }
      }

      const connectedAddress = accounts[0];
      setAddress(connectedAddress);
      setStatus('connected');

      // Auto-navigate after 1.5s
      setTimeout(() => onConnected(connectedAddress), 1500);

    } catch (err: any) {
      setError(err.message || 'Connection failed. Please try again.');
      setStatus('error');
    }
  };

  // ── Simulate for CoinBase / WalletConnect (placeholder) ──
  const connectOther = async (walletName: string) => {
    setStatus('connecting');
    setConnectingWallet(walletName);
    setError('');
    await new Promise(r => setTimeout(r, 2000));
    setError(`${walletName} integration coming soon! Please use MetaMask for now.`);
    setStatus('error');
  };

  const handleConnect = (walletId: string, walletName: string) => {
    if (walletId === 'metamask') connectMetaMask();
    else connectOther(walletName);
  };

  const reset = () => { setStatus('idle'); setError(''); setConnectingWallet(''); };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="grid-bg" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Card */}
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">🔐</div>
          <div>
            <div className="login-logo-text">CryptoVault</div>
            <div className="login-logo-sub">Integrity Verified</div>
          </div>
        </div>

        {/* ── IDLE STATE ── */}
        {status === 'idle' && (
          <>
            <div className="login-heading">Connect Your Wallet</div>
            <div className="login-subheading">
              Connect your Web3 wallet to access CryptoVault.{'\n'}
              Your files stay encrypted and secure on blockchain.
            </div>

            <div className="wallet-options">
              {WALLETS.map(wallet => (
                <button
                  key={wallet.id}
                  className={`wallet-btn ${wallet.id}`}
                  onClick={() => handleConnect(wallet.id, wallet.name)}
                >
                  <div className="wallet-btn-icon">{wallet.icon}</div>
                  <div className="wallet-btn-info">
                    <div className="wallet-btn-name">
                      {wallet.name}
                      {wallet.popular && (
                        <span className="popular-badge" style={{ marginLeft: 8 }}>Popular</span>
                      )}
                    </div>
                    <div className="wallet-btn-desc">{wallet.desc}</div>
                  </div>
                  <span className="wallet-btn-arrow">→</span>
                </button>
              ))}
            </div>

            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">Secured by</span>
              <div className="login-divider-line" />
            </div>

            <div className="security-info">
              <span className="security-info-icon">🛡️</span>
              <div className="security-info-text">
                <strong>Non-custodial</strong> — We never store your private keys.{' '}
                <strong>AES-256</strong> encryption + <strong>Ethereum</strong> blockchain
                ensures your files are always under your control.
              </div>
            </div>

            <div className="login-footer">
              By connecting, you agree to our Terms of Service.{'\n'}
              Your wallet address is used only for authentication.
            </div>
          </>
        )}

        {/* ── CONNECTING STATE ── */}
        {status === 'connecting' && (
          <>
            <div className="login-heading">Connecting...</div>
            <div className="connecting-state">
              <div className="connecting-spinner" />
              <div className="connecting-name">
                {connectingWallet === 'MetaMask' ? '🦊' : '🔗'} {connectingWallet}
              </div>
              <div className="connecting-desc">
                Check your wallet for connection request...
              </div>
            </div>
          </>
        )}

        {/* ── CONNECTED STATE ── */}
        {status === 'connected' && (
          <>
            <div className="login-heading">Connected! ✅</div>
            <div className="connected-state">
              <div className="connected-check">✓</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>Wallet Connected</div>
              <div className="connected-address">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                Redirecting to Dashboard...
              </div>
            </div>
          </>
        )}

        {/* ── ERROR STATE ── */}
        {status === 'error' && (
          <>
            <div className="login-heading">Connection Failed</div>
            <div style={{
              background: 'rgba(255,59,92,0.08)',
              border: '1px solid rgba(255,59,92,0.25)',
              borderRadius: 12,
              padding: '16px 18px',
              marginBottom: 24,
              fontSize: 13,
              color: 'var(--red)',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.6,
            }}>
              ⚠️ {error}
            </div>

            {/* MetaMask not installed help */}
            {error.includes('not installed') && (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 12, textDecoration: 'none' }}
              >
                🦊 Install MetaMask
              </a>
            )}

            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={reset}>
              ← Try Again
            </button>
          </>
        )}

      </div>
    </div>
  );
}

// ── TypeScript: window.ethereum type ──
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}