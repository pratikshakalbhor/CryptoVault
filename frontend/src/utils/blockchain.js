import { ethers } from 'ethers';
import abi from './abi.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export const sealFileOnChain = async (fileData) => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Ethers v6 syntax
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

        // Map backend returned data to smart contract arguments
        // CryptoVault.sol expects: sealFile(fileId, filename, fileHash, encryptedHash, mongoDbRef, cloudinaryUrl, fileSize)
        
        const fileId = fileData.fileId || fileData.id || `file_${Date.now()}`;
        const filename = fileData.filename || fileData.name || 'Unknown';
        const fileHash = fileData.hash || fileData.fileHash || '';
        const encryptedHash = fileData.encryptedHash || 'encrypted_hash';
        const mongoDbRef = fileData.mongoDbRef || 'mongo_ref';
        const cloudinaryUrl = fileData.cloudinaryUrl || fileData.ipfsURL || fileData.cloudURL || '';
        const fileSize = fileData.fileSize || fileData.size || 0;

        // Call the smart contract (prompts MetaMask)
        const tx = await contract.sealFile(
            fileId,
            filename,
            fileHash,
            encryptedHash,
            mongoDbRef,
            cloudinaryUrl,
            fileSize
        );

        // Wait for connection to include block
        const receipt = await tx.wait();
        
        // Return real transaction hash
        return receipt.hash || tx.hash;
        
    } catch (error) {
        console.error("Blockchain error:", error);
        
        // Check for user cancelling transaction or not authorized errors
        if (error.code === 4001 || error.code === "ACTION_REJECTED" || error.message?.includes("User denied") || error.message?.includes("Not authorized") || error.message?.includes("rejected")) {
            throw new Error("Not authorized: Transaction was rejected by user or permissions failed.");
        }
        
        throw new Error(error.reason || error.message || "Smart contract transaction failed");
    }
};