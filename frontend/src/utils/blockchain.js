// ─────────────────────────────────────────
// blockchain.js — FileRegistry contract
// registerFile + verifyFile only
// ─────────────────────────────────────────
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

// Simple ABI — sirf 3 functions
const CONTRACT_ABI = [
  "function registerFile(string calldata fileHash) external",
  "function verifyFile(string calldata fileHash) external view returns (bool valid, address owner, uint256 timestamp)",
  "function getOwnerFiles(address owner) external view returns (string[] memory)",
  "event FileRegistered(string indexed fileHash, address indexed owner, uint256 timestamp)"
];

// ── Provider + Signer ──
const getProviderAndSigner = async () => {
  if (!window.ethereum) throw new Error('MetaMask not found!');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  return { provider, signer };
};

// ─────────────────────────────────────────
// 1. SEAL FILE — registerFile(hash)
// Upload page madhe call hoto
// ─────────────────────────────────────────
export const sealFileOnBlockchain = async (fileData) => {
  try {
    if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set in .env!');

    const { signer } = await getProviderAndSigner();
    const contract   = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // ✅ Sirf fileHash pathava — simple registerFile
    const tx      = await contract.registerFile(fileData.fileHash);
    const receipt = await tx.wait();

    return {
      success:     true,
      txHash:      receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed:     receipt.gasUsed.toString(),
    };
  } catch (err) {
    throw new Error(parseError(err));
  }
};

// ─────────────────────────────────────────
// 2. VERIFY FILE — view function (no gas)
// verifyFile(hash) → read-only
// ─────────────────────────────────────────
export const verifyFileOnChain = async (fileHash) => {
  try {
    if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set in .env!');

    const { provider } = await getProviderAndSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const [valid, owner, timestamp] = await contract.verifyFile(fileHash);

    return {
      success:   true,
      valid,
      owner,
      timestamp: timestamp > 0
        ? new Date(Number(timestamp) * 1000).toLocaleString()
        : null,
    };
  } catch (err) {
    throw new Error(parseError(err));
  }
};

// ─────────────────────────────────────────
// 3. GET OWNER FILES
// ─────────────────────────────────────────
export const getOwnerFilesOnChain = async (walletAddress) => {
  try {
    const { provider } = await getProviderAndSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const files    = await contract.getOwnerFiles(walletAddress);
    return { success: true, files };
  } catch (err) {
    throw new Error(parseError(err));
  }
};

// ─────────────────────────────────────────
// 4. Blockchain stats — BlockchainLog sathi
// ─────────────────────────────────────────
export const getStatsFromBlockchain = async () => {
  // FileRegistry.sol madhe getStats() nahi
  // MongoDB stats vaprto tyaasathi
  return {
    success:          true,
    totalFiles:       0,
    totalVerifications: 0,
    totalTampered:    0,
    totalRevoked:     0,
  };
};

// ─────────────────────────────────────────
// 5. TX URL helpers
// ─────────────────────────────────────────
export const getTxUrl = (txHash) =>
  `https://sepolia.etherscan.io/tx/${txHash}`;

export const getAddressUrl = (address) =>
  `https://sepolia.etherscan.io/address/${address}`;

// ─────────────────────────────────────────
// Backward compat — old code sathi
// ─────────────────────────────────────────
export const registerFileOnChain = async (signer, fileHash) => {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx       = await contract.registerFile(fileHash);
  const receipt  = await tx.wait();
  return receipt.hash;
};

export const getFileFromBlockchain = async (fileId) => {
  throw new Error('getFile not available in FileRegistry — use MongoDB');
};

// ─────────────────────────────────────────
// Helper — Error parse
// ─────────────────────────────────────────
const parseError = (err) => {
  if (err.code === 4001)                             return 'Transaction rejected by user';
  if (err.code === 'INSUFFICIENT_FUNDS')             return 'Insufficient ETH for gas';
  if (err.message?.includes('Already registered'))   return 'File already registered on blockchain';
  if (err.message?.includes('Invalid SHA-256'))      return 'Invalid file hash length';
  if (err.message?.includes('CONTRACT_ADDRESS'))     return 'Contract address not set — check .env file';
  return err.reason || err.message || 'Transaction failed';
};