// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CryptoVault {

    address public owner;
    mapping(address => bool) public authorizedUploaders;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedUploaders[msg.sender] || msg.sender == owner,
            "Not authorized to upload"
        );
        _;
    }

    struct FileRecord {
        string  fileId;
        string  filename;
        string  fileHash;
        string  ipfsCID;
        string  encryptedHash;
        string  mongoDbRef;
        string  cloudinaryUrl;
        uint256 fileSize;
        uint256 timestamp;
        address owner;
        bool    exists;
        bool    isRevoked;
    }

    struct VerificationLog {
        string  fileId;
        string  verifiedHash;
        bool    isMatch;
        uint256 timestamp;
        address verifiedBy;
    }

    struct AccessLog {
        string  fileId;
        address accessor;
        string  action;
        uint256 timestamp;
    }

    mapping(string => FileRecord)    private files;
    mapping(address => string[])     private ownerFiles;
    mapping(string => address[])     public  sharedAccess;   // fileId => granted addresses
    string[]                         private allFileIds;
    VerificationLog[]                private verificationLogs;
    AccessLog[]                      private accessLogs;

    uint256 public totalFiles;
    uint256 public totalVerifications;
    uint256 public totalTamperDetected;
    uint256 public totalRevoked;

    event FileSealed(string indexed fileId, string filename, string fileHash, address owner, uint256 timestamp);
    event FileVerified(string indexed fileId, bool isMatch, address verifiedBy, uint256 timestamp);
    event TamperDetected(string indexed fileId, string expectedHash, string receivedHash, uint256 timestamp);
    event FileRevoked(string indexed fileId, address revokedBy, uint256 timestamp);

    constructor() {
        owner = msg.sender;
        authorizedUploaders[msg.sender] = true;
    }

    function addUploader(address _uploader) public onlyOwner {
        authorizedUploaders[_uploader] = true;
    }

    function removeUploader(address _uploader) public onlyOwner {
        require(_uploader != owner, "Cannot remove owner");
        authorizedUploaders[_uploader] = false;
    }

    function sealFile(
        string memory _fileId,
        string memory _filename,
        string memory _fileHash,
        string memory _ipfsCID,
        string memory _encryptedHash,
        string memory _mongoDbRef,
        string memory _cloudinaryUrl,
        uint256 _fileSize
    ) public {
        // [DEMO MODE] Removed 'onlyAuthorized' modifier to allow any connected wallet to seal documents.
        require(_fileSize > 0, "Invalid file size"); // ← add kara
        require(_fileSize <= 100 * 1024 * 1024, "File too large"); // 100MB limit
        require(!files[_fileId].exists, "File already sealed");
        require(bytes(_fileId).length > 0, "File ID required");
        require(bytes(_fileHash).length > 0, "File hash required");

        files[_fileId] = FileRecord({
            fileId: _fileId, filename: _filename, fileHash: _fileHash,
            ipfsCID: _ipfsCID, encryptedHash: _encryptedHash, mongoDbRef: _mongoDbRef,
            cloudinaryUrl: _cloudinaryUrl, fileSize: _fileSize,
            timestamp: block.timestamp, owner: msg.sender,
            exists: true, isRevoked: false
        });

        ownerFiles[msg.sender].push(_fileId);
        allFileIds.push(_fileId);
        totalFiles++;
        accessLogs.push(AccessLog(_fileId, msg.sender, "upload", block.timestamp));
        emit FileSealed(_fileId, _filename, _fileHash, msg.sender, block.timestamp);
    }

    function verifyFile(string memory _fileId, string memory _currentHash)
        public returns (bool isMatch)
    {
        require(files[_fileId].exists, "File not found");
        require(!files[_fileId].isRevoked, "File revoked");

        isMatch = keccak256(abi.encodePacked(files[_fileId].fileHash)) ==
                  keccak256(abi.encodePacked(_currentHash));

        verificationLogs.push(VerificationLog(_fileId, _currentHash, isMatch, block.timestamp, msg.sender));
        accessLogs.push(AccessLog(_fileId, msg.sender, "verify", block.timestamp));
        totalVerifications++;
        emit FileVerified(_fileId, isMatch, msg.sender, block.timestamp);

        if (!isMatch) {
            totalTamperDetected++;
            emit TamperDetected(_fileId, files[_fileId].fileHash, _currentHash, block.timestamp);
        }
        return isMatch;
    }

    function revokeFile(string memory _fileId) public {
        require(files[_fileId].exists, "File not found");
        require(msg.sender == files[_fileId].owner || msg.sender == owner, "Not allowed");
        require(!files[_fileId].isRevoked, "Already revoked");
        files[_fileId].isRevoked = true;
        totalRevoked++;
        accessLogs.push(AccessLog(_fileId, msg.sender, "revoke", block.timestamp));
        emit FileRevoked(_fileId, msg.sender, block.timestamp);
    }

    function getFile(string memory _fileId) public view
        returns (string memory, string memory, string memory, string memory, uint256, uint256, address, bool)
    {
        require(files[_fileId].exists, "File not found");
        FileRecord memory f = files[_fileId];
        return (f.fileId, f.filename, f.fileHash, f.ipfsCID, f.fileSize, f.timestamp, f.owner, f.isRevoked);
    }

    function quickVerify(string memory _fileId, string memory _currentHash)
        public view returns (bool)
    {
        require(files[_fileId].exists, "File not found");
        return keccak256(abi.encodePacked(files[_fileId].fileHash)) ==
               keccak256(abi.encodePacked(_currentHash));
    }

    function getOwnerFiles(address _owner) public view returns (string[] memory) {
        return ownerFiles[_owner];
    }

    function getStats() public view returns (uint256, uint256, uint256, uint256) {
        return (totalFiles, totalVerifications, totalTamperDetected, totalRevoked);
    }

    function getOwner() public view returns (address) { return owner; }

    function getVerificationLogs(string memory _fileId)
        public view returns (VerificationLog[] memory)
    {
        uint count = 0;
        for (uint i = 0; i < verificationLogs.length; i++) {
            if (keccak256(bytes(verificationLogs[i].fileId)) == keccak256(bytes(_fileId))) {
                count++;
            }
        }
        VerificationLog[] memory logs = new VerificationLog[](count);
        uint j = 0;
        for (uint i = 0; i < verificationLogs.length; i++) {
            if (keccak256(bytes(verificationLogs[i].fileId)) == keccak256(bytes(_fileId))) {
                logs[j++] = verificationLogs[i];
            }
        }
        return logs;
    }
}
