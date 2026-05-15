// ─────────────────────────────────────────
// api.js — Go Backend API calls
// Base URL: http://localhost:5000
// ─────────────────────────────────────────
import axios from 'axios';

const BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/api\/?$/, '');

// ── Binary Download Helper — URL.createObjectURL ──
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────
// 1. UPLOAD FILE
// ─────────────────────────────────────────
export const uploadFile = async (file, wallet, expiry, parentId, note, fileHash) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("wallet", (wallet || "").toLowerCase());
  if (expiry) formData.append("expiryDate", expiry);
  if (parentId) formData.append("parentFileId", parentId);
  if (note) formData.append("versionNote", note);
  if (fileHash) formData.append("fileHash", fileHash);

  const res = await axios.post(`${BASE_URL}/api/upload`, formData);
  return res.data;
};

// ─────────────────────────────────────────
// 2. VERIFY FILE
// ─────────────────────────────────────────
export const verifyFile = async (file, fileId, wallet) => {
  const formData = new FormData();
  formData.append("file", file);
  if (fileId) formData.append("fileId", fileId);
  if (wallet) formData.append("wallet", wallet.toLowerCase());

  const res = await axios.post(`${BASE_URL}/api/verify`, formData);
  return res.data;
};

// ─────────────────────────────────────────
// 3. GET ALL FILES
// ─────────────────────────────────────────
export const getAllFiles = async (walletAddress, isBlockchain = false) => {
  if (!walletAddress) return { files: [], count: 0 };
  const wallet = walletAddress.toLowerCase();
  let query = `?wallet=${wallet}`;
  if (isBlockchain) query += "&blockchain=true";
  
  const res = await axios.get(`${BASE_URL}/api/files${query}`);
  return res.data;
};

export const getFileById = async (fileId) => {
  const res = await axios.get(`${BASE_URL}/api/files/${fileId}`);
  return res.data;
};

export const getFileVersions = async (fileId) => {
  const res = await axios.get(`${BASE_URL}/api/files/${fileId}/versions`);
  return res.data;
};

// ─────────────────────────────────────────
// 4. ARCHIVE & RESTORE
// ─────────────────────────────────────────
export const archiveFile = async (fileId, wallet) => {
  const res = await axios.put(`${BASE_URL}/api/files/${fileId}/archive`, { wallet: wallet?.toLowerCase() });
  return res.data;
};

export const getArchivedFiles = async (walletAddress) => {
  const wallet = (walletAddress || "").toLowerCase();
  const query = wallet ? `?wallet=${wallet}` : "";
  const res = await axios.get(`${BASE_URL}/api/files/archive/all${query}`);
  return res.data;
};

export const restoreFromArchive = async (fileId, wallet) => {
  const res = await axios.post(`${BASE_URL}/api/files/${fileId}/restore-archive`, { wallet: wallet?.toLowerCase() });
  return res.data;
};

// ─────────────────────────────────────────
// 5. RESTORE FILE (Proper Binary Download — no corruption)
// ─────────────────────────────────────────
export const restoreFile = async (fileId, filename = 'restored_file', wallet) => {
  try {
    // Use DownloadOriginal which serves raw binary bytes from local backup or IPFS
    const response = await axios.get(`${BASE_URL}/api/files/${fileId}/download`, {
      responseType: 'blob',
      params: { wallet: wallet?.toLowerCase() },
    });

    // Extract real filename from Content-Disposition if available
    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^";\n]+)"?/i);
    const realFilename = match ? match[1] : filename;

    // Preserve MIME type from response header
    const mimeType = response.headers['content-type'] || 'application/octet-stream';

    // Create Blob with the correct MIME type (preserves binary integrity)
    const blob = new Blob([response.data], { type: mimeType });
    downloadBlob(blob, realFilename);

    return { success: true, message: 'File restored and downloaded', filename: realFilename };
  } catch (err) {
    console.error('Restore error:', err);
    // If server returned a JSON error inside a blob, parse it
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || parsed.message || 'Restoration failed');
      } catch (parseErr) {
        // not JSON
      }
    }
    throw new Error(err.response?.data?.error || err.message || 'Restoration failed');
  }
};

// ─────────────────────────────────────────
// 6. GET STATS
// ─────────────────────────────────────────
export const getStats = async (walletAddress) => {
  const wallet = (walletAddress || "").toLowerCase();
  const query = wallet ? `?wallet=${wallet}` : "";
  const res = await axios.get(`${BASE_URL}/api/stats${query}`);
  return res.data;
};

// ─────────────────────────────────────────
// 7. EXTRAS
// ─────────────────────────────────────────
export const downloadCertificate = async (fileId) => {
  const res = await axios.get(`${BASE_URL}/api/files/${fileId}/certificate`, { responseType: 'blob' });
  downloadBlob(res.data, `Certificate_${fileId}.pdf`);
};

export const getAuditLogs = async (walletAddress) => {
  const wallet = (walletAddress || "").toLowerCase();
  const query = wallet ? `?wallet=${wallet}` : "";
  const res = await axios.get(`${BASE_URL}/api/audit-logs${query}`);
  return res.data;
};

export const healthCheck = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/`);
    return res.status === 200;
  } catch {
    return false;
  }
};