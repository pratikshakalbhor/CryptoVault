const { ethers } = require('ethers');
const fs = require('fs');

async function check() {
    const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
    const contractAddress = '0x7D2F8c82Dd4f16725E19987dD5532Ea9e01E247f';
    const abi = ["function owner() view returns (address)", "function authorizedUploaders(address) view returns (bool)", "function getFile(string) view returns (string, string, string, string, uint256, uint256, address, bool)"];
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const owner = await contract.owner();
    console.log('OWNER:', owner);
    
    const auth = await contract.authorizedUploaders('0xd05De6dd20B362571BbaF63ad50bee542125Ac09');
    console.log('IS_AUTH:', auth);

    try {
        await contract.getFile('FILE-17775233675');
        console.log('EXISTS: TRUE');
    } catch (e) {
        console.log('EXISTS: FALSE');
    }
}
check();
