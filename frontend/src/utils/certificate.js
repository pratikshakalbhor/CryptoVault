import { jsPDF } from 'jspdf';

export const generateCertificate = (file) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const W = 210;
  const pageH = 297;

  // Background
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, W, pageH, 'F');

  // Border
  doc.setDrawColor(0, 212, 255);
  doc.setLineWidth(1);
  doc.rect(8, 8, W - 16, pageH - 16);
  doc.setDrawColor(0, 212, 255, 0.3);
  doc.setLineWidth(0.3);
  doc.rect(11, 11, W - 22, pageH - 22);

  // Header bg
  doc.setFillColor(0, 212, 255, 0.08);
  doc.rect(8, 8, W - 16, 50, 'F');

  // Title
  doc.setTextColor(0, 212, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DIGITAL INTEGRITY CERTIFICATE', W / 2, 28, { align: 'center' });

  doc.setTextColor(150, 150, 170);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Blockchain-Verified File Authentication', W / 2, 36, { align: 'center' });

  doc.setTextColor(100, 100, 120);
  doc.setFontSize(9);
  doc.text('CryptoVault · Powered by Ethereum Sepolia', W / 2, 44, { align: 'center' });

  // Verified badge area
  doc.setFillColor(0, 255, 157, 0.08);
  doc.roundedRect(W / 2 - 35, 58, 70, 18, 3, 3, 'F');
  doc.setDrawColor(0, 255, 157);
  doc.setLineWidth(0.5);
  doc.roundedRect(W / 2 - 35, 58, 70, 18, 3, 3);
  doc.setTextColor(0, 255, 157);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INTEGRITY VERIFIED', W / 2, 69, { align: 'center' });

  // Section helper
  const section = (title, y) => {
    doc.setFillColor(0, 212, 255, 0.05);
    doc.rect(15, y, W - 30, 7, 'F');
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 18, y + 5);
    return y + 12;
  };

  const row = (label, value, y, valueColor = [200, 200, 220]) => {
    doc.setTextColor(120, 120, 140);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 18, y);
    doc.setTextColor(...valueColor);
    doc.setFont('helvetica', 'bold');
    // Long values wrap
    const lines = doc.splitTextToSize(value || '—', W - 80);
    doc.text(lines, 75, y);
    return y + (lines.length * 5) + 2;
  };

  let y = 88;

  // File Details
  y = section('File Information', y);
  y = row('File Name', file.filename, y);
  y = row('File ID', file.fileId, y);
  y = row('File Size', `${Math.round((file.fileSize || 0) / 1024)} KB`, y);
  y = row('Upload Date', new Date(file.uploadedAt).toLocaleString(), y);
  y += 4;

  // Cryptographic proof
  y = section('Cryptographic Proof', y);
  y = row('SHA-256 Hash', file.originalHash, y, [0, 212, 255]);
  y = row('Algorithm', 'SHA-256 + AES-256-GCM', y);
  y += 4;

  // Blockchain record
  y = section('Blockchain Record', y);
  y = row('Network', 'Ethereum Sepolia Testnet', y, [127, 119, 221]);
  y = row('TX Hash', file.txHash || 'Pending', y, [127, 119, 221]);
  y = row('Contract', '0x97bdb0a922a3C3021E80df7bf64DcC25366227EF', y);
  y = row('Status', file.status?.toUpperCase() || 'VALID', y, [0, 255, 157]);
  y += 4;

  // Owner
  y = section('Owner Information', y);
  y = row('Wallet Address', file.walletAddress, y, [239, 159, 39]);
  y = row('Verification', 'MetaMask Cryptographic Signature', y);
  y += 4;

  // Verification URL
  y = section('Public Verification', y);
  const verifyUrl = `${window.location.origin}/verify-public?fileId=${file.fileId}`;
  row('Verify URL', verifyUrl, y, [0, 212, 255]);

  // Footer
  doc.setDrawColor(0, 212, 255, 0.2);
  doc.setLineWidth(0.3);
  doc.line(15, pageH - 30, W - 15, pageH - 30);

  doc.setTextColor(80, 80, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated: ${new Date().toLocaleString()} · CryptoVault Blockchain Integrity System`,
    W / 2, pageH - 22, { align: 'center' }
  );
  doc.text(
    'This certificate is cryptographically secured. Verify authenticity at ' + window.location.origin,
    W / 2, pageH - 16, { align: 'center' }
  );

  // Save
  doc.save(`CryptoVault_Certificate_${file.fileId}.pdf`);
};
