/* global BigInt */
// ─────────────────────────────────────────
// blockchain.js — ethers.js Smart Contract connect
// ─────────────────────────────────────────
import { ethers } from 'ethers';
import ABI from './abi.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

// Debug: Verify if environment variables are loading correctly
console.log('DEBUG: REACT_APP_CONTRACT_ADDRESS =', CONTRACT_ADDRESS);
console.log('DEBUG: REACT_APP_API_URL =', process.env.REACT_APP_API_URL);

// ── Provider + Signer get karto ──
const getProviderAndSigner = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found! Please install MetaMask.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
};

// ── Contract instance banvto ──
const getContract = async (withSigner = true) => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS not set in .env file!');
  }

  const { provider, signer } = await getProviderAndSigner();
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    withSigner ? signer : provider
  );
};

// ─────────────────────────────────────────
// 1. SEAL FILE on Blockchain
// sealFile(fileId, filename, fileHash, ...)
// ─────────────────────────────────────────
export const sealFileOnBlockchain = async (fileData) => {
  try {
    const contract = await getContract();

    const tx = await contract.sealFile(
      fileData.fileId,
      fileData.filename,
      fileData.fileHash,
      fileData.fileHash,   // encryptedHash
      fileData.fileId,     // mongoDbRef
      fileData.cloudUrl || '',
      BigInt(fileData.fileSize || 0)
    );

    // Transaction confirm hoeparyant wait karto
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (err) {
    throw new Error(parseContractError(err));
  }
};

// ─────────────────────────────────────────
// 2. VERIFY FILE on Blockchain
// verifyFile(fileId, currentHash)
// ─────────────────────────────────────────
export const verifyFileOnBlockchain = async (fileId, currentHash) => {
  try {
    const contract = await getContract();

    const tx = await contract.verifyFile(fileId, currentHash);
    const receipt = await tx.wait();

    // Event madhe result milto
    const event = receipt.logs
      .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find(e => e?.name === 'FileVerified');

    return {
      success: true,
      isMatch: event?.args?.isMatch ?? false,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    throw new Error(parseContractError(err));
  }
};

// ─────────────────────────────────────────
// 3. QUICK VERIFY — View function (no gas)
// quickVerify(fileId, currentHash)
// ─────────────────────────────────────────
export const quickVerifyOnBlockchain = async (fileId, currentHash) => {
  try {
    const contract = await getContract(false); // Read-only
    const isMatch = await contract.quickVerify(fileId, currentHash);
    return { success: true, isMatch };
  } catch (err) {
    throw new Error(parseContractError(err));
  }
};

// ─────────────────────────────────────────
// 4. GET FILE from Blockchain
// getFile(fileId)
// ─────────────────────────────────────────
export const getFileFromBlockchain = async (fileId) => {
  try {
    const contract = await getContract(false);
    const result = await contract.getFile(fileId);

    return {
      success: true,
      fileId: result[0],
      filename: result[1],
      fileHash: result[2],
      fileSize: result[3].toString(),
      timestamp: new Date(Number(result[4]) * 1000).toLocaleString(),
      owner: result[5],
      isRevoked: result[6],
    };
  } catch (err) {
    throw new Error(parseContractError(err));
  }
};

// ─────────────────────────────────────────
// 5. REVOKE FILE on Blockchain
// revokeFile(fileId)
// ─────────────────────────────────────────
export const revokeFileOnBlockchain = async (fileId) => {
  try {
    const contract = await getContract();
    const tx = await contract.revokeFile(fileId);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    throw new Error(parseContractError(err));
  }
};

// ─────────────────────────────────────────
// 6. GET STATS from Blockchain
// getStats()
// ─────────────────────────────────────────
export const getStatsFromBlockchain = async () => {
  try {
    const contract = await getContract(false);
    const result = await contract.getStats();

    return {
      success: true,
      totalFiles: Number(result[0]),
      totalVerifications: Number(result[1]),
      totalTampered: Number(result[2]),
      totalRevoked: Number(result[3]),
    };
  } catch (err) {
    throw new Error(parseContractError(err));
  }
};

// ─────────────────────────────────────────
// 7. GET TX STATUS — Etherscan link
// ─────────────────────────────────────────
export const getTxUrl = (txHash) => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};

export const getAddressUrl = (address) => {
  return `https://sepolia.etherscan.io/address/${address}`;
};

// ─────────────────────────────────────────
// 8. LISTEN TO EVENTS
// ─────────────────────────────────────────
export const listenToEvents = async (onFileSealed, onTamperDetected) => {
  try {
    const contract = await getContract(false);

    contract.on('FileSealed', (fileId, filename, fileHash, owner, timestamp) => {
      onFileSealed?.({
        fileId, filename, fileHash, owner,
        timestamp: new Date(Number(timestamp) * 1000).toLocaleString()
      });
    });

    contract.on('TamperDetected', (fileId, expectedHash, receivedHash, timestamp) => {
      onTamperDetected?.({
        fileId, expectedHash, receivedHash,
        timestamp: new Date(Number(timestamp) * 1000).toLocaleString()
      });
    });

    return () => contract.removeAllListeners();
  } catch (err) {
    console.error('Event listener error:', err);
  }
};

// ─────────────────────────────────────────
// Helper — Error message clean karto
// ─────────────────────────────────────────
const parseContractError = (err) => {
  if (err.code === 4001) return 'Transaction rejected by user';
  if (err.code === 'INSUFFICIENT_FUNDS') return 'Insufficient ETH for gas fees';
  if (err.message?.includes('File already sealed')) return 'File already sealed on blockchain';
  if (err.message?.includes('File not found')) return 'File not found on blockchain';
  if (err.message?.includes('Already revoked')) return 'File already revoked';
  if (err.message?.includes('Not authorized')) return 'Not authorized to perform this action';
  return err.reason || err.message || 'Transaction failed';
};