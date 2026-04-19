// ─────────────────────────────────────────
// api.js — Go Backend API calls
// Base URL: http://localhost:5000
// ─────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ── Helper — Safe JSON parse with error handling ──
const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    // If it starts with '<', it's likely HTML error
    if (text.trim().startsWith('<')) {
      throw new Error('Backend returned HTML (likely an error page). Check server logs.');
    }
    throw err;
  }
};

// ── Helper — fetch with error handling ──
const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}/api${url}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });

    const text = await response.text();
    const data = safeJsonParse(text);

    if (!response.ok) {
      throw new Error(data.error || `HTTP Error: ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw new Error(err.message || "Network error — Is Go backend running?");
  }
};

// ─────────────────────────────────────────
// 1. UPLOAD FILE
// POST /api/upload
// ─────────────────────────────────────────
export const uploadFile = async (
  file,
  wallet,
  expiry,
  parentId,
  note
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("walletAddress", wallet || "");

  if (expiry) formData.append("expiryDate", expiry);
  if (parentId) formData.append("parentFileId", parentId);
  if (note) formData.append("versionNote", note);

  try {
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    const data = safeJsonParse(text);

    if (!res.ok) {
      throw new Error(data.error || `Upload failed: ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error('Upload error:', err);
    throw new Error(err.message || "Upload failed");
  }
};

// ─────────────────────────────────────────
// 2. VERIFY FILE
// POST /api/verify
// ─────────────────────────────────────────
export const verifyFile = async (file, fileId) => {
  const formData = new FormData();
  formData.append("file", file);
  if (fileId) formData.append("fileId", fileId);

  try {
    const response = await fetch(`${BASE_URL}/api/verify`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    const data = safeJsonParse(text);

    if (!response.ok) {
      throw new Error(data.error || `Verify failed: ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error('Verify error:', err);
    throw new Error(err.message || "Verify failed");
  }
};

// ─────────────────────────────────────────
// 3. GET ALL FILES
// GET /api/files?wallet=0x...
// ─────────────────────────────────────────
export const getAllFiles = async (walletAddress) => {
  const query = walletAddress ? `?wallet=${walletAddress}` : "";
  return apiFetch(`/files${query}`);
};

// ─────────────────────────────────────────
// 4. GET SINGLE FILE
// GET /api/files/:id
// ─────────────────────────────────────────
export const getFileById = async (fileId) => {
  return apiFetch(`/files/${fileId}`);
};

// ─────────────────────────────────────────
// 4.5 GET FILE VERSIONS
// GET /api/files/:id/versions
// ─────────────────────────────────────────
export const getFileVersions = async (fileId) => {
  return apiFetch(`/files/${fileId}/versions`);
};

// ─────────────────────────────────────────
// 5. REVOKE FILE
// PUT /api/files/:id/revoke
// ─────────────────────────────────────────
export const revokeFile = async (fileId) => {
  return apiFetch(`/files/${fileId}/revoke`, { method: "PUT" });
};

// ─────────────────────────────────────────
// 5.5 DOWNLOAD CERTIFICATE (PDF)
// GET /api/files/:id/certificate
// ─────────────────────────────────────────
export const downloadCertificate = async (fileId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/files/${fileId}/certificate`);
    if (!response.ok) throw new Error("Certificate generation failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_${fileId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    throw new Error(err.message || "Failed to download certificate");
  }
};

// ─────────────────────────────────────────
// 5.6 PUBLIC VERIFY
// GET /api/public/verify/:publicId
// ─────────────────────────────────────────
export const publicVerifyFile = async (publicId) => {
  return apiFetch(`/public/verify/${publicId}`);
};

// ─────────────────────────────────────────
// Access Control API
export const updateVisibility = async (fileId, visibility, sharedWith = []) => {
  return apiFetch(`/files/${fileId}/visibility`, {
    method: "PUT",
    body: JSON.stringify({ visibility, sharedWith }),
  });
};

// ─────────────────────────────────────────
// 6. GET STATS
// GET /api/stats
// ─────────────────────────────────────────
export const getStats = async () => {
  return apiFetch("/stats");
};

// ─────────────────────────────────────────
// 7. HEALTH CHECK
// GET /
// ─────────────────────────────────────────
export const healthCheck = async () => {
  try {
    const response = await fetch(`${BASE_URL}/`);
    return response.ok;
  } catch {
    return false;
  }
};