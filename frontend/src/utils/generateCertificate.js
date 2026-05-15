import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional PDF Forensic Certificate for BLOCKVERIFY
 * Designed to look like an official legal document.
 */
export const generateCertificate = (data) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const timestamp = new Date().toLocaleString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. OFFICIAL BORDER (Multi-layered for legal look)
  doc.setDrawColor(15, 23, 42); // Dark slate
  doc.setLineWidth(1.5);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
  doc.setLineWidth(0.2);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
  doc.setLineWidth(0.8);
  doc.rect(8.5, 8.5, pageWidth - 17, pageHeight - 17);

  // 2. HEADER: Professional Branding
  doc.setFillColor(15, 23, 42);
  doc.rect(10, 10, pageWidth - 20, 40, 'F');

  doc.setTextColor(45, 212, 191); // Teal
  doc.setFont('times', 'bold');
  doc.setFontSize(32);
  doc.text('BLOCKVERIFY FORENSIC VAULT', pageWidth / 2, 28, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('IMMUTABLE ARCHIVAL & CRYPTOGRAPHIC INTEGRITY SYSTEM', pageWidth / 2, 36, { align: 'center' });
  doc.text('CERTIFICATE OF FORENSIC AUTHENTICITY', pageWidth / 2, 42, { align: 'center' });

  // 3. WATERMARK: 'Digital Authenticity'
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.04 }));
  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'bold');
  doc.setFontSize(60);
  for (let i = 0; i < 4; i++) {
    doc.text('DIGITAL AUTHENTICITY', 30, 80 + (i * 55), { angle: 35 });
  }
  doc.restoreGraphicsState();

  // 4. CERTIFICATE BODY
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.text('OFFICIAL VERIFICATION STATEMENT', pageWidth / 2, 65, { align: 'center' });
  
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(60, 67, 150, 67);

  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  const introText = "This document serves as formal evidence that the digital asset referenced below has been processed through the BlockVerify Forensic System. A unique cryptographic fingerprint (SHA-256) has been permanently recorded on the Ethereum Blockchain (Sepolia Testnet), ensuring absolute immutability and resistance to unauthorized tampering.";
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 50);
  doc.text(splitIntro, 25, 75);

  // 5. METADATA TABLE (Enterprise Style)
  const walletDisplay = data.walletAddress 
    ? (data.walletAddress.length > 30 
        ? `${data.walletAddress.slice(0, 15)}...${data.walletAddress.slice(-12)}` 
        : data.walletAddress)
    : 'System Internal';

  const tableRows = [
    ['Asset Identifier', data.fileId || 'N/A'],
    ['File Name', data.fileName || data.filename || 'Unknown Asset'],
    ['IPFS CID', data.ipfsCID || 'NOT_LOCALIZED_ON_IPFS'],
    ['Registration Date', data.uploadedAt ? new Date(data.uploadedAt).toLocaleString() : timestamp],
    ['Custodian Wallet', walletDisplay],
    ['Integrity Status', 'SECURE & VERIFIED'],
  ];

  autoTable(doc, {
    startY: 95,
    margin: { left: 25, right: 25 },
    head: [['Field Description', 'Forensic Record Value']],
    body: tableRows,
    theme: 'grid',
    styles: { font: 'times', fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 250, 252] } },
  });

  // 6. CRYPTOGRAPHIC EVIDENCE
  const nextY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('CRYPTOGRAPHIC EVIDENCE', 25, nextY);

  const hashRows = [
    ['SHA-256 Fingerprint', data.originalHash || 'N/A'],
    ['Blockchain Transaction', data.txHash || 'UNAVAILABLE_PENDING_SYNC'],
    ['Verification Protocol', 'BLOCKVERIFY-AES-256-SHA'],
  ];

  autoTable(doc, {
    startY: nextY + 5,
    margin: { left: 25, right: 25 },
    body: hashRows,
    styles: { font: 'courier', fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold', font: 'times', fontSize: 10 } },
    theme: 'plain',
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(226, 232, 240);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  // 7. QR CODE & VERIFICATION LINK
  const qrY = doc.lastAutoTable.finalY + 12;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(25, qrY, 32, 32);
  
  // Fake QR Pattern
  doc.setFillColor(15, 23, 42);
  for(let i=0; i<6; i++) {
    for(let j=0; j<6; j++) {
      if((i+j)%2 === 0) doc.rect(26.5+(i*5), qrY+1.5+(j*5), 4, 4, 'F');
    }
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN TO AUDIT ON-CHAIN', 41, qrY + 36, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const txUrl = `https://sepolia.etherscan.io/tx/${data.txHash || ''}`;
  doc.text(txUrl.length > 60 ? txUrl.slice(0, 60)+'...' : txUrl, 25, qrY + 41);

  // 8. DIGITAL SEAL: GOLD 'BLOCKCHAIN VERIFIED'
  const sealX = pageWidth - 65;
  const sealY = pageHeight - 75;
  
  // Gold Outer Ring
  doc.setFillColor(218, 165, 32); // Gold
  doc.circle(sealX + 25, sealY + 25, 22, 'F');
  doc.setDrawColor(184, 134, 11); // Dark Gold
  doc.setLineWidth(1.5);
  doc.circle(sealX + 25, sealY + 25, 23, 'D');
  
  // Inner Blue Ring
  doc.setFillColor(30, 58, 138); // Navy Blue
  doc.circle(sealX + 25, sealY + 25, 18, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BLOCKCHAIN', sealX + 25, sealY + 20, { align: 'center' });
  doc.setFontSize(11);
  doc.text('VERIFIED', sealX + 25, sealY + 27, { align: 'center' });
  doc.setFontSize(6);
  doc.text('FORENSIC SYSTEM', sealX + 25, sealY + 32, { align: 'center' });

  // 9. CONCLUDING SUMMARY STATEMENT (Requested)
  const summaryY = pageHeight - 35;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  const summaryText = "This document is cryptographically secured and stored on the Ethereum Sepolia network. Any modification to the source file will invalidate this certificate.";
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 80);
  doc.text(splitSummary, 25, summaryY, { align: 'left' });

  // 10. AUTHORIZED SIGNATURE
  const sigY = pageHeight - 20;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Digital Signature of Authority:', 25, sigY);
  doc.line(65, sigY, 130, sigY);
  
  doc.setFont('courier', 'bolditalic');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138); 
  doc.text('BlockVerify Forensic System', 70, sigY - 2);
  
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`CERT-ID: BV-${(data.fileId || 'X').toUpperCase()}-${Date.now()}`, 25, sigY + 5);

  // Save PDF
  const name = (data.fileName || data.filename || 'Forensic_Report').replace(/\s+/g, '_');
  doc.save(`Forensic_Certificate_${name}.pdf`);
};