// ─────────────────────────────────────────
// api.js — Go Backend API calls
// Base URL: http://localhost:5000/api
// ─────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Helper — fetch with error handling ──
const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP Error: ${response.status}`);
    }

    return data;
  } catch (err) {
    throw new Error(err.message || 'Network error — Go backend running aahe ka?');
  }
};

// ─────────────────────────────────────────
// 1. UPLOAD FILE
// POST /api/upload
// ─────────────────────────────────────────
export const uploadFile = async (file, walletAddress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('walletAddress', walletAddress);

  try {
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Content-Type set karu naka — browser automatically sets multipart
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Upload failed');
  }
};

// ─────────────────────────────────────────
// 2. VERIFY FILE
// POST /api/verify
// ─────────────────────────────────────────
export const verifyFile = async (file, fileId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileId', fileId);

  try {
    const response = await fetch(`${BASE_URL}/verify`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Verify failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Verify failed');
  }
};

// ─────────────────────────────────────────
// 3. GET ALL FILES
// GET /api/files?wallet=0x...
// ─────────────────────────────────────────
export const getAllFiles = async (walletAddress) => {
  return apiFetch(`/files?wallet=${walletAddress}`);
};

// ─────────────────────────────────────────
// 4. GET SINGLE FILE
// GET /api/files/:id
// ─────────────────────────────────────────
export const getFileById = async (fileId) => {
  return apiFetch(`/files/${fileId}`);
};

// ─────────────────────────────────────────
// 5. REVOKE FILE
// PUT /api/files/:id/revoke
// ─────────────────────────────────────────
export const revokeFile = async (fileId) => {
  return apiFetch(`/files/${fileId}/revoke`, { method: 'PUT' });
};

// ─────────────────────────────────────────
// 6. GET STATS
// GET /api/stats
// ─────────────────────────────────────────
export const getStats = async () => {
  return apiFetch('/stats');
};

// ─────────────────────────────────────────
// 7. HEALTH CHECK
// GET /
// ─────────────────────────────────────────
export const healthCheck = async () => {
  try {
    const response = await fetch('http://localhost:5000/');
    return response.ok;
  } catch {
    return false;
  }
};