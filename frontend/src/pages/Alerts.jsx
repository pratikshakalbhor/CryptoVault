import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllFiles } from '../utils/api';
import '../styles/Alerts.css';
import { cardVariants, staggerContainer, fadeIn } from '../utils/animations';

export default function Alerts({ walletAddress, onNavigate }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filesRes = await getAllFiles(walletAddress);
      
      const files = filesRes.files || [];
      
      let generatedAlerts = [];
      let alertIdCounter = 1;

      // 1. Check for tampered files
      files.forEach(f => {
        if (f.status === 'tampered') {
          generatedAlerts.push({
            id: `alert-${alertIdCounter++}`,
            type: 'danger',
            title: 'File Tampering Detected',
            message: `The file "${f.filename || f.name}" has been modified or its hash does not match the blockchain record.`,
            time: f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : 'Unknown time',
            action: { label: 'Verify Now', onClick: () => onNavigate('verify', f) }
          });
        }
      });

      // 2. Storage warning (e.g. > 50 files)
      if (files.length >= 50) {
        generatedAlerts.push({
          id: `alert-${alertIdCounter++}`,
          type: 'warning',
          title: 'Storage Warning',
          message: `You have uploaded ${files.length} files. Consider cleaning up old files to maintain optimal performance.`,
          time: 'Just now',
          action: { label: 'Go to My Files', onClick: () => onNavigate('my-files') }
        });
      }

      // 3. Expiry / Info alerts
      const now = new Date();
      files.forEach(f => {
        if (f.expiryDate) {
          const exp = new Date(f.expiryDate);
          if (exp < now) {
            generatedAlerts.push({
              id: `alert-${alertIdCounter++}`,
              type: 'info',
              title: 'File Expired',
              message: `The file "${f.filename || f.name}" reached its expiration date on ${exp.toLocaleDateString()}.`,
              time: exp.toLocaleString(),
            });
          } else {
            const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7 && diffDays > 0) {
              generatedAlerts.push({
                id: `alert-${alertIdCounter++}`,
                type: 'warning',
                title: 'File Expiring Soon',
                message: `The file "${f.filename || f.name}" will expire in ${diffDays} day(s).`,
                time: 'Just now',
                action: { label: 'View File', onClick: () => onNavigate('file-details', f) }
              });
            }
          }
        }
      });

      // 4. If no issues, show success
      if (generatedAlerts.length === 0) {
        generatedAlerts.push({
          id: `alert-${alertIdCounter++}`,
          type: 'success',
          title: 'All Secure',
          message: 'No security issues detected. Your files are safely encrypted and verified on the blockchain.',
          time: 'Just now',
          action: { label: 'Go to Dashboard', onClick: () => onNavigate('dashboard') }
        });
      }

      // Sort by type priority: danger > warning > info > success (roughly)
      const priority = { danger: 1, warning: 2, info: 3, success: 4 };
      generatedAlerts.sort((a, b) => priority[a.type] - priority[b.type]);

      setAlerts(generatedAlerts);
    } catch (err) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, onNavigate]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'danger': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '🔔';
    }
  };

  const filteredAlerts = filter === 'All' 
    ? alerts 
    : alerts.filter(a => {
        if (filter === 'Critical') return a.type === 'danger';
        if (filter === 'Warning') return a.type === 'warning';
        if (filter === 'Info') return a.type === 'info';
        if (filter === 'Success') return a.type === 'success';
        return true;
      });

  return (
    <div className="page-inner">
      <div className="alerts-header">
        <div>
          <h1>Security Alerts</h1>
          <p>Monitor your file integrity and storage notifications</p>
        </div>
        <button className="ref-btn" onClick={fetchAlerts}>
          {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

      <div className="alerts-filter-tabs">
        {['All', 'Critical', 'Warning', 'Info', 'Success'].map(tab => (
          <button 
            key={tab} 
            className={`alert-tab ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spin-ring" />
          Loading alerts...
        </div>
      ) : (
        <motion.div className="alerts-list" variants={staggerContainer} initial="initial" animate="animate">
          <AnimatePresence>
            {filteredAlerts.length === 0 ? (
              <motion.div className="empty" variants={fadeIn} initial="initial" animate="animate" exit="exit">
                No alerts found for this category.
              </motion.div>
            ) : (
              filteredAlerts.map(alert => (
                <motion.div 
                  key={alert.id} 
                  className={`alert-card ${alert.type}`}
                  variants={cardVariants}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  layout
                >
                  <div className="alert-content">
                    <div className="alert-icon">{getIcon(alert.type)}</div>
                    <div className="alert-text">
                      <h3>{alert.title}</h3>
                      <p>{alert.message}</p>
                      <div className="alert-time">{alert.time}</div>
                    </div>
                  </div>
                  <div className="alert-actions">
                    <button className="alert-dismiss" onClick={() => dismissAlert(alert.id)}>✕</button>
                    {alert.action && (
                      <button className="alert-btn" onClick={alert.action.onClick}>
                        {alert.action.label}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
