import { useState } from 'react';

interface UploadProps {
  onNotify: (msg: string, type: string) => void;
}

export default function Upload({ onNotify }: UploadProps) {
  const [isSealing, setIsSealing] = useState(false);

  const handleSeal = () => {
    setIsSealing(true);
    onNotify('Initiating blockchain transaction...', 'info');
    setTimeout(() => {
      onNotify('File sealed and anchored to blockchain!', 'success');
      setIsSealing(false);
    }, 3000);
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2>Upload & Seal</h2>
        <p className="subtitle">Upload your file to generate a cryptographic proof and store it on the blockchain.</p>

        <div className="upload-section">
          <div className="upload-box">
            <span className="upload-icon">↑</span>
            <p>Drag and drop files here or click to browse</p>
            <input type="file" className="file-input" />
          </div>
        </div>

        <div className="seal-actions">
          <div className="options">
            <label className="checkbox-container">
              <input type="checkbox" defaultChecked />
              <span className="checkmark"></span>
              Encrypt metadata before storing
            </label>
            <label className="checkbox-container">
              <input type="checkbox" defaultChecked />
              <span className="checkmark"></span>
              Enable public verification
            </label>
          </div>

          <button 
            className={`btn-primary ${isSealing ? 'loading' : ''}`} 
            onClick={handleSeal}
            disabled={isSealing}
          >
            {isSealing ? 'Sealing...' : 'Seal on Blockchain'}
          </button>
        </div>
      </div>
    </div>
  );
}
