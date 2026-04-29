import { ethers } from 'ethers';
import abi from './abi.json';

const SEPOLIA_CHAIN_ID = 11155111;
// Fallback: hardcoded address if env var not injected at build-time
const HARDCODED_ADDRESS = '0x7D2F8c82Dd4f16725E19987dD5532Ea9e01E247f';

// ─── Helper: Get a fresh provider + signer every call (avoid stale state) ───
const getContractInstance = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  // Validate contract address (env var OR hardcoded fallback)
  // Check for both REACT_APP_ (CRA) and VITE_ (Vite) prefixes
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || import.meta?.env?.VITE_CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS || HARDCODED_ADDRESS;
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid CONTRACT_ADDRESS: "${contractAddress}". Check .env file.`);
  }

  // Request wallet access
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  // Fresh provider + signer (ethers v6 BrowserProvider)
  console.log("Using BrowserProvider for contract instance");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network  = await provider.getNetwork();

  // ─── Sepolia Network Guard ───
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    try {
      // Auto-prompt MetaMask to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
      });
    } catch (switchErr) {
      // Chain not added in MetaMask — add it automatically
      if (switchErr.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      } else {
        throw new Error('Please switch MetaMask to the Sepolia Testnet to continue.');
      }
    }
    // Re-create provider after network switch
    const newProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await newProvider.getSigner();
    return new ethers.Contract(contractAddress, abi, signer);
  }

  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, abi, signer);
};

// ─── Check if an error is a user rejection ───
const isUserRejection = (err) => {
  return (
    err.code === 4001 ||
    err.code === 'ACTION_REJECTED' ||
    err.info?.error?.code === 4001 ||
    err.message?.toLowerCase().includes('user rejected') ||
    err.message?.toLowerCase().includes('user denied') ||
    err.message?.toLowerCase().includes('rejected')
  );
};

// ─────────────────────────────────────────────────────────────────
// sealFileOnChain — Atomic: upload hash → MetaMask tx → wait
// Returns: { txHash, status: 'success' | 'rejected' | 'failed' }
// ─────────────────────────────────────────────────────────────────
export const sealFileOnChain = async (fileData) => {
  const contract = await getContractInstance();

  // Map backend response fields to contract arguments
  const fileId        = String(fileData.fileId || fileData.id || `file_${Date.now()}`);
  const filename      = String(fileData.filename || fileData.name || 'Unknown');
  const fileHash      = String(fileData.hash || fileData.fileHash || '');
  const encryptedHash = String(fileData.encryptedHash || 'N/A');
  const mongoDbRef    = String(fileData.mongoDbRef || fileData.fileId || 'N/A');
  const cloudinaryUrl = String(fileData.cloudURL || fileData.ipfsURL || fileData.cloudinaryUrl || '');
  const fileSize      = Number(fileData.fileSize || fileData.size || 0);

  if (!fileHash) {
    throw new Error('File hash is empty — cannot seal on blockchain.');
  }

  try {
    // Prompt MetaMask — user signs transaction
    const tx = await contract.sealFile(
      fileId,
      filename,
      fileHash,
      fileData.ipfsCID || '',
      encryptedHash,
      mongoDbRef,
      cloudinaryUrl,
      fileSize
    );

    console.log('⏳ TX submitted:', tx.hash, '— waiting for confirmation...');

    // Wait for block inclusion
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      throw new Error('Transaction was mined but reverted on-chain (status=0).');
    }

    console.log('✅ TX confirmed:', receipt.hash);
    return { txHash: receipt.hash || tx.hash, status: 'success' };

  } catch (err) {
    if (isUserRejection(err)) {
      // Bubble up as a structured rejection — Upload.jsx handles this gracefully
      const rejection = new Error('Transaction rejected by user.');
      rejection.code = 'USER_REJECTED';
      throw rejection;
    }
    // Re-throw other errors (out of gas, contract revert, etc.)
    throw new Error(err.reason || err.message || 'Smart contract transaction failed.');
  }
};

// ─────────────────────────────────────────────────────────────────
// getFileFromChain — Read-only: fetch sealed file data
// ─────────────────────────────────────────────────────────────────
export const getFileFromChain = async (fileId) => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || import.meta?.env?.VITE_CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS || HARDCODED_ADDRESS;
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    throw new Error('Invalid CONTRACT_ADDRESS');
  }

  // Use a public RPC for read-only calls (no MetaMask needed)
  if (window.ethereum) {
    console.log("Using BrowserProvider for read-only call");
  } else {
    console.log("Using JsonRpcProvider (Fallback) for read-only call");
  }
  
  const rpcUrl = process.env.REACT_APP_RPC_URL || import.meta?.env?.VITE_RPC_URL || process.env.VITE_RPC_URL || 'https://rpc.sepolia.org';
  const provider = window.ethereum
    ? new ethers.BrowserProvider(window.ethereum)
    : new ethers.JsonRpcProvider(rpcUrl);

  const contract = new ethers.Contract(contractAddress, abi, provider);
  return contract.getFile(fileId);
};

export const getTxUrl = (txHash) => {
  if (!txHash) return '';
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};