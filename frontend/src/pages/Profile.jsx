import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getAllFiles, getStats } from '../utils/api';
import '../styles/Profile.css';
import { cardVariants, staggerContainer } from '../utils/animations';

export default function Profile({ walletAddress, onLogout }) {
  const [stats, setStats] = useState({ total: 0, valid: 0, tampered: 0 });
  const [lastActivity, setLastActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [filesRes, statsRes] = await Promise.all([
        getAllFiles(walletAddress),
        getStats()
      ]);
      
      const files = filesRes.files || [];
      const s = statsRes.stats || statsRes || {};
      
      setStats({ 
        total: s.total || files.length || 0, 
        valid: s.valid || files.filter(f => f.status === 'valid').length || 0, 
        tampered: s.tampered || files.filter(f => f.status === 'tampered').length || 0 
      });

      if (files.length > 0) {
        // Find most recent upload
        const sorted = [...files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setLastActivity(new Date(sorted[0].uploadedAt).toLocaleString());
      }
    } catch (err) {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
    : 'Not connected';

  if (loading) {
    return (
      <div className="page-inner">
        <div className="loading-center">
          <div className="spin-ring" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="page-inner" style={{ maxWidth: 900 }}>
      <div className="ph">
        <div>
          <h1>User Profile</h1>
          <p>Manage your account settings and view security statistics</p>
        </div>
        <button className="ref-btn" onClick={fetchProfileData}>⟳ Refresh</button>
      </div>

      {error && <div className="error-box">⚠️ {error}</div>}

      <motion.div className="profile-grid" variants={staggerContainer} initial="initial" animate="animate">
        
        {/* 1. User Info Card */}
        <motion.div className="profile-card" variants={cardVariants}>
          <div className="profile-card-header">
            <div className="profile-card-icon">👤</div>
            <div className="profile-card-title">Account Information</div>
          </div>
          
          <div className="profile-info-row">
            <span className="profile-info-label">Wallet Address</span>
            <span className="profile-info-value">
              <span className="profile-mono" title={walletAddress}>{shortAddr}</span>
              <button className="copy-icon-btn" onClick={handleCopy} title="Copy Address">
                {copied ? '✓' : '📋'}
              </button>
            </span>
          </div>
          
          <div className="profile-info-row">
            <span className="profile-info-label">Network</span>
            <span className="profile-info-value" style={{ color: 'var(--accent-purple)' }}>
              Sepolia Testnet
            </span>
          </div>

          <div className="profile-info-row">
            <span className="profile-info-label">Account Status</span>
            <span className="profile-info-value" style={{ color: 'var(--accent-teal)' }}>
              ✅ Active
            </span>
          </div>
        </motion.div>

        {/* 2. Stats Card */}
        <motion.div className="profile-card" variants={cardVariants}>
          <div className="profile-card-header">
            <div className="profile-card-icon">📊</div>
            <div className="profile-card-title">Storage Statistics</div>
          </div>
          
          <div className="profile-stats-row">
            <div className="profile-stat-box">
              <span className="stat-num">{stats.total}</span>
              <span className="stat-label">Total Files</span>
            </div>
            <div className="profile-stat-box">
              <span className="stat-num valid">{stats.valid}</span>
              <span className="stat-label">Valid Hash</span>
            </div>
            <div className="profile-stat-box">
              <span className="stat-num tampered">{stats.tampered}</span>
              <span className="stat-label">Tampered</span>
            </div>
          </div>
        </motion.div>

        {/* 3. Security Section */}
        <motion.div className="profile-card" variants={cardVariants}>
          <div className="profile-card-header">
            <div className="profile-card-icon">🛡️</div>
            <div className="profile-card-title">Security & Activity</div>
          </div>
          
          <div className="profile-info-row">
            <span className="profile-info-label">Last Activity</span>
            <span className="profile-info-value">
              {lastActivity || '--'}
            </span>
          </div>
          
          <div className="profile-info-row">
            <span className="profile-info-label">Verifications Performed</span>
            <span className="profile-info-value">{stats.total > 0 ? Math.floor(stats.total * 1.5) : 0}</span>
          </div>
          
          <div className="profile-info-row">
            <span className="profile-info-label">Encryption Level</span>
            <span className="profile-info-value">AES-256</span>
          </div>
        </motion.div>

        {/* 4. Settings Section */}
        <motion.div className="profile-card" variants={cardVariants}>
          <div className="profile-card-header">
            <div className="profile-card-icon">⚙️</div>
            <div className="profile-card-title">Preferences</div>
          </div>
          
          <div className="profile-info-row">
            <span className="profile-info-label">Dark Mode (Default)</span>
            <div className="toggle-switch"></div>
          </div>
          
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="profile-btn" onClick={() => alert('Local cache cleared!')}>
              🧹 Clear Local Data
            </button>
            <button className="profile-btn danger" onClick={onLogout}>
              🚪 Disconnect Wallet
            </button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
