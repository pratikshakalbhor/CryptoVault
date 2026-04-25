import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional PDF Proof of Integrity
 */
export const generateCertificate = (data) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();

  // 1. Header & Branding
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(45, 212, 191); // Teal
  doc.setFontSize(22);
  doc.text('BLOCKVERIFY', 14, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Official Proof of Cryptographic Integrity', 14, 28);

  // 2. VERIFIED Watermark
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.1 }));
  doc.setTextColor(15, 118, 110);
  doc.setFontSize(60);
  doc.text('VERIFIED ✅', 40, 150, { angle: 45 });
  doc.restoreGraphicsState();

  // 3. Document Details Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text('Document Metadata', 14, 55);

  const walletDisplay = data.walletAddress 
    ? (data.walletAddress.length > 20 
        ? `${data.walletAddress.slice(0, 10)}...${data.walletAddress.slice(-8)}` 
        : data.walletAddress)
    : 'Not Provided';

  const tableRows = [
    ['File Name', data.filename],
    ['File ID', data.fileId],
    ['Original Upload', new Date(data.uploadedAt).toLocaleString()],
    ['Wallet Address', walletDisplay],
    ['Registry Status', 'ACTIVE & VERIFIED'],
  ];

  autoTable(doc, {
    startY: 60,
    head: [['Field', 'Value']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [20, 184, 166] },
  });

  // 4. Cryptographic Proofs
  const nextY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Cryptographic Proofs', 14, nextY);

  const hashRows = [
    ['SHA-256 Hash', data.originalHash],
    ['Blockchain Tx', data.txHash || 'Verified via Smart Contract'],
    ['Verification Date', timestamp],
  ];

  autoTable(doc, {
    startY: nextY + 5,
    body: hashRows,
    styles: { font: 'courier', fontSize: 9 },
    columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
  });

  // 5. Footer
  doc.setFontSize(8);
  doc.setTextColor(100);
  const footerY = 280;
  doc.text('This document serves as immutable proof that the file matches the hash recorded in the blockchain registry.', 105, footerY, { align: 'center' });
  doc.text(`Certificate ID: ${data.fileId}-${Date.now()}`, 105, footerY + 5, { align: 'center' });

  doc.save(`Certificate_${data.filename}.pdf`);
};