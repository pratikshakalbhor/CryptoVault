import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

const ABI = [
  "function registerFile(string calldata fileHash) external",
  "function verifyFile(string calldata fileHash) external view returns (bool valid, address owner, uint256 ts)",
  "function fileExists(string calldata fileHash) external view returns (bool)"
];

export const getTxUrl     = (h) => `https://sepolia.etherscan.io/tx/${h}`;
export const getAddressUrl = (a) => `https://sepolia.etherscan.io/address/${a}`;

const normalizeHash = (h = '') =>
  h.replace(/^0x/, '').toLowerCase().trim();

const getContract = async (needSigner = false) => {
  if (!window.ethereum) throw new Error('MetaMask not found!');
  const provider = new ethers.BrowserProvider(window.ethereum);
  if (needSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
};

// ✅ MAIN SEAL FUNCTION — always triggers MetaMask for NEW files
export const sealFileOnBlockchain = async (fileData) => {
  if (!window.ethereum) throw new Error('MetaMask not installed!');
  if (!CONTRACT_ADDRESS)  throw new Error('CONTRACT_ADDRESS not set in .env');

  const hash = normalizeHash(fileData.fileHash || fileData.hash || '');
  if (!hash || hash.length !== 64) throw new Error('Invalid SHA-256 hash');

  console.log('🦊 Requesting MetaMask signature for hash:', hash.slice(0, 16) + '...');

  // Force fresh MetaMask connection
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  const contract = await getContract(true);

  console.log('⛓️ Calling registerFile on contract:', CONTRACT_ADDRESS);
  const tx      = await contract.registerFile(hash);
  console.log('📤 TX sent:', tx.hash);

  const receipt = await tx.wait();
  console.log('✅ TX confirmed:', receipt.hash);

  return {
    success:     true,
    txHash:      receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed:     receipt.gasUsed?.toString() || '0',
  };
};

export const verifyFileOnChain = async (fileHash) => {
  try {
    const contract = await getContract(false);
    const hash     = normalizeHash(fileHash);
    const [valid, owner, timestamp] = await contract.verifyFile(hash);
    return {
      success: true, valid, owner,
      timestamp: Number(timestamp) > 0
        ? new Date(Number(timestamp) * 1000).toLocaleString()
        : null,
    };
  } catch {
    return { success: false, valid: false };
  }
};