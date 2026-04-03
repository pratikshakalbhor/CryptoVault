import { motion } from 'framer-motion';
import '../styles/Landing.css';

export default function Landing({ onGetStarted }) {
  const features = [
    {
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      title: 'AES-256 Encryption',
      desc: 'Every file is encrypted with AES-256 on upload. Only you can decrypt it.'
    },
    {
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
      title: 'SHA-256 Hashing',
      desc: 'A unique digital fingerprint for every file. Change 1 byte — get a completely different hash.'
    },
    {
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>,
      title: 'Blockchain Seal',
      desc: 'The hash is permanently stored on the Ethereum blockchain. No one can alter it.'
    },
    {
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
      title: 'Integrity Verify',
      desc: 'Re-upload the same file — instantly get a VALID or TAMPERED result.'
    },
  ];

  const useCases = [
    {
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
      title: 'Hospitals', desc: 'Patient records stay tamper-proof'
    },
    {
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
      title: 'Banks', desc: 'Financial documents remain secure'
    },
    {
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
      title: 'Colleges', desc: 'Certificates can be verified anytime'
    },
    {
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
      title: 'Companies', desc: 'Employee data integrity guaranteed'
    },
  ];

  return (
    <div className="landing-page">
      <div className="grid-bg" />
      <motion.div className="orb orb-1" animate={{ y: [0,-30,0], scale:[1,1.05,1] }} transition={{ duration:8, repeat:Infinity }} />
      <motion.div className="orb orb-2" animate={{ y: [0,30,0],  scale:[1,1.08,1] }} transition={{ duration:7, repeat:Infinity, delay:2 }} />

      {/* Navbar */}
      <motion.nav className="landing-nav" initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}>
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <span className="landing-logo-text">CryptoVault</span>
        </div>
        <motion.button className="btn btn-primary" onClick={onGetStarted}
          whileHover={{ scale:1.04, boxShadow:'0 8px 24px rgba(0,212,255,0.3)' }} whileTap={{ scale:0.97 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:7,verticalAlign:'middle'}}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Connect Wallet
        </motion.button>
      </motion.nav>

      {/* Hero */}
      <div className="landing-hero">
        <motion.div className="hero-content" initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <motion.div className="hero-badge" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>
            Powered by Ethereum Blockchain
          </motion.div>
          <h1 className="hero-title">
            Give Your Cloud Files<br />
            <span className="hero-accent">Blockchain Security</span>
          </h1>
          <p className="hero-desc">
            Encrypt your important files with AES-256, generate a SHA-256 hash,
            and permanently seal them on the Ethereum blockchain.
            Any tampering is detected instantly.
          </p>
          <div className="hero-actions">
            <motion.button className="btn btn-primary btn-lg" onClick={onGetStarted}
              whileHover={{ scale:1.04, boxShadow:'0 12px 32px rgba(0,212,255,0.4)' }} whileTap={{ scale:0.97 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:7,verticalAlign:'middle'}}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              Connect Wallet — Get Started
            </motion.button>
            <motion.a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer"
              className="btn btn-outline btn-lg" whileHover={{ scale:1.02 }}>
              View on Etherscan ↗
            </motion.a>
          </div>
          <motion.div className="hero-stats" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}>
            {[
              { value:'AES-256', label:'Encryption' },
              { value:'SHA-256', label:'Hashing' },
              { value:'Sepolia', label:'Testnet' },
              { value:'100%',    label:'Tamper-proof' },
            ].map((s,i) => (
              <div key={i} className="hero-stat">
                <div className="hero-stat-value">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero Card */}
        <motion.div className="hero-visual" initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }}>
          <div className="hero-card">
            <div className="hero-card-header">
              <span className="hero-card-dot green" /><span className="hero-card-dot yellow" /><span className="hero-card-dot red" />
              <span style={{ marginLeft:8, fontSize:12, fontFamily:'var(--font-mono)', color:'var(--muted)' }}>CryptoVault</span>
            </div>
            {[
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, name:'patient_records.pdf',  status:'valid',    hash:'a7f3c2d9...' },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>, name:'financial_data.xlsx',  status:'valid',    hash:'b8e4d1a6...' },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, name:'contracts_v2.docx',    status:'tampered', hash:'MISMATCH'   },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, name:'employee_data.csv',    status:'valid',    hash:'d0a6f3c8...' },
            ].map((f,i) => (
              <motion.div key={i} className="hero-file-row"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4 + i*0.1 }}>
                <span style={{ fontSize:16 }}>{f.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{f.name}</div>
                  <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--muted)' }}>{f.hash}</div>
                </div>
                <span className={`status-badge status-${f.status}`} style={{ fontSize:10 }}>
                  {f.status === 'valid' ? '● VALID' : '⚠ TAMPERED'}
                </span>
              </motion.div>
            ))}
            <motion.div className="hero-tx" animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:2, repeat:Infinity }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5,verticalAlign:'middle'}}><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>
              TX: 0x3a4b5c6d... confirmed
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:5,verticalAlign:'middle'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <motion.section className="landing-section"
        initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
        <div className="section-label">How It Works</div>
        <h2 className="section-title-lg">3-Layer Security System</h2>
        <div className="features-grid">
          {features.map((f,i) => (
            <motion.div key={i} className="feature-card"
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.1 }}
              whileHover={{ y:-6, boxShadow:'0 20px 40px rgba(0,212,255,0.1)' }}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Real Problem */}
      <motion.section className="landing-section problem-section"
        initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
        <div className="section-label">Real Problem</div>
        <h2 className="section-title-lg">These Problems Are Real</h2>
        <div className="problem-box">
          {[
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title:'Silent Data Corruption', desc:'Data sitting on servers for years gets corrupted silently — and no one notices.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, title:'Insider Threats', desc:'A cloud provider employee can access the database and alter data without a trace.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title:'AIIMS Delhi 2023', desc:'40 million patient records hacked. Altered blood reports could have cost lives.' },
          ].map((p,i) => (
            <motion.div key={i} className="problem-item"
              initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.1 }}>
              <span className="problem-icon">{p.icon}</span>
              <div>
                <div className="problem-title">{p.title}</div>
                <div className="problem-desc">{p.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="solution-tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          CryptoVault Solution: <strong>"Trust but Verify"</strong>
        </div>
      </motion.section>

      {/* Use Cases */}
      <motion.section className="landing-section"
        initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
        <div className="section-label">Use Cases</div>
        <h2 className="section-title-lg">Who Can Use This?</h2>
        <div className="usecase-grid">
          {useCases.map((u,i) => (
            <motion.div key={i} className="usecase-card"
              initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }}
              viewport={{ once:true }} transition={{ delay:i*0.1 }}
              whileHover={{ scale:1.04 }}>
              <div className="usecase-icon">{u.icon}</div>
              <div className="usecase-title">{u.title}</div>
              <div className="usecase-desc">{u.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section className="landing-cta"
        initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
        <h2 className="cta-title">Get Started Now</h2>
        <p className="cta-desc">Connect your MetaMask wallet and give your files blockchain-grade security</p>
        <motion.button className="btn btn-primary btn-lg" onClick={onGetStarted}
          whileHover={{ scale:1.06, boxShadow:'0 16px 40px rgba(0,212,255,0.4)' }} whileTap={{ scale:0.97 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:7,verticalAlign:'middle'}}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Connect Wallet — Start Free
        </motion.button>
      </motion.section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-logo">
          <div className="landing-logo-icon" style={{ width:28, height:28, fontSize:14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <span className="landing-logo-text" style={{ fontSize:14 }}>CryptoVault</span>
        </div>
        <div style={{ fontSize:12, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>
          Powered by Ethereum Sepolia · AES-256 · SHA-256
        </div>
      </footer>
    </div>
  );
}