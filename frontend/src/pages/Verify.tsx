import { useState } from 'react';

interface VerifyProps {
  onNotify: (msg: string, type: string) => void;
}

export default function Verify({ onNotify }: VerifyProps) {
  const [fileHash, setFileHash] = useState('');

  const handleVerify = () => {
    if (!fileHash) {
      onNotify('Please enter a file hash or upload a file', 'error');
      return;
    }
    // Mock verification
    onNotify('Verifying file integrity...', 'info');
    setTimeout(() => {
      onNotify('File integrity verified! Matches blockchain record.', 'success');
    }, 2000);
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2>Verify File Integrity</h2>
        <p className="subtitle">Enter the file hash or upload a file to verify its authenticity on the blockchain.</p>
        
        <div className="form-group">
          <label>File Hash</label>
          <input 
            type="text" 
            placeholder="0x..." 
            value={fileHash} 
            onChange={(e) => setFileHash(e.target.value)} 
          />
        </div>

        <button className="btn-primary" onClick={handleVerify}>Verify Integrity</button>

        <div className="divider">OR</div>

        <div className="upload-zone">
          <div className="upload-icon">◎</div>
          <p>Drop file here to verify automatically</p>
          <button className="btn-secondary">Select File</button>
        </div>
      </div>
    </div>
  );
}
