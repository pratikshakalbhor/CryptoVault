import { ethers } from "ethers";

const ABI = [
  "function registerFile(string calldata fileHash) external",
  "function verifyFile(string calldata fileHash) external view returns (bool valid, address owner, uint256 timestamp)",
  "function fileExists(string calldata fileHash) external view returns (bool)"
];

// Fallback address in case .env is not loaded
const FALLBACK_ADDRESS = "0x0E89b6130955fE7007915D89DC44F2f60291732f";

const getContract = async (withSigner = false) => {
  if (!window.ethereum) throw new Error("MetaMask not found!");

  // Use priority: REACT_APP_CONTRACT_ADDRESS > REACT_APP_FILE_REGISTRY_ADDRESS > REACT_APP_CRYPTO_VAULT_ADDRESS > FALLBACK
  const contractAddress = 
    process.env.REACT_APP_CONTRACT_ADDRESS || 
    process.env.REACT_APP_FILE_REGISTRY_ADDRESS || 
    process.env.REACT_APP_CRYPTO_VAULT_ADDRESS ||
    FALLBACK_ADDRESS;

  console.log("Resolving contract address:", {
    env: process.env.REACT_APP_CONTRACT_ADDRESS,
    registry: process.env.REACT_APP_FILE_REGISTRY_ADDRESS,
    vault: process.env.REACT_APP_CRYPTO_VAULT_ADDRESS,
    resolved: contractAddress
  });

  if (!contractAddress || contractAddress === "undefined" || contractAddress === "null") {
    throw new Error("Contract address is missing or invalid. Please check your .env file and restart the dev server.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  
  if (withSigner) {
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    console.log("Using contract:", contractAddress, "with signer:", address);
    return new ethers.Contract(contractAddress, ABI, signer);
  }
  
  return new ethers.Contract(contractAddress, ABI, provider);
};

export const sealFileOnBlockchain = async (fileData) => {
  try {
    const contract = await getContract(true);
    console.log("Calling registerFile with hash:", fileData.fileHash);

    const tx = await contract.registerFile(fileData.fileHash);
    console.log("TX sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("TX confirmed:", receipt.hash);

    return {
      success:     true,
      txHash:      receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    console.error("Blockchain error:", err);
    throw new Error(parseError(err));
  }
};

export const verifyFileOnChain = async (fileHash) => {
  try {
    const contract = await getContract(false);
    const [valid, owner, timestamp] = await contract.verifyFile(fileHash);
    return {
      success: true,
      valid,
      owner,
      timestamp: timestamp > 0
        ? new Date(Number(timestamp) * 1000).toLocaleString()
        : null,
    };
  } catch (err) {
    console.error("Verify chain error:", err);
    return { success: false, valid: false };
  }
};

export const getTxUrl = (txHash) =>
  `https://sepolia.etherscan.io/tx/${txHash}`;

export const getAddressUrl = (addr) =>
  `https://sepolia.etherscan.io/address/${addr}`;

const parseError = (err) => {
  if (err.code === 4001)                           return "Transaction rejected by user";
  if (err.code === "INSUFFICIENT_FUNDS")           return "Insufficient ETH for gas";
  if (err.message?.includes("Already registered")) return "File already on blockchain";
  if (err.message?.includes("CONTRACT_ADDRESS"))   return "Contract address not set in .env";
  return err.reason || err.message || "Transaction failed";
};