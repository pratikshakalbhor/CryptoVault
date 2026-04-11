# 🔐 FileProof

> **Blockchain-Based Encrypted File Storage with Integrity Verification**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue.svg)](https://soliditylang.org/)
[![Go](https://img.shields.io/badge/Go-1.21-cyan.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple.svg)](https://sepolia.etherscan.io/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black.svg)](https://fileproof.vercel.app/)

---

## 🌐 Live Demo

**Frontend:** [fileproof.vercel.app](https://fileproof.vercel.app/)
**Smart Contract:** [View on Etherscan](https://sepolia.etherscan.io/)
**GitHub:** [github.com/pratikshakalbhor/ChainLock](https://github.com/pratikshakalbhor)

---

## 📌 Problem Statement

Cloud storage files can be **silently corrupted or tampered** without anyone knowing:

| Problem | Description |
|---------|-------------|
| 🦠 **Bit Rot** | Hardware failures corrupt files over time — undetected |
| 👤 **Insider Threats** | Cloud employees can modify database records silently |
| 🔓 **No Proof** | Traditional databases cannot prove data was never changed |
| ⚖️ **Legal Risk** | No immutable audit trail for compliance |

> **Real Incident:** AIIMS Delhi 2023 — 40 million patient records compromised.
> *"Wrong Data is more dangerous than No Data."*

---

## ✅ Solution — "Trust but Verify"

FileProof uses a **3-Layer Security System**:

```
Layer 1 → AES-256 Encryption    File encrypted before upload
Layer 2 → SHA-256 Hashing       Unique digital fingerprint generated
Layer 3 → Blockchain Seal       Hash permanently stored on Ethereum
```

### Verification Flow:
```
Re-upload same file
        ↓
New SHA-256 hash generated
        ↓
Compare with blockchain stored hash
        ↓
Match    → ✅ VALID    — File is authentic and unmodified
Mismatch → ⚠️ TAMPERED — File has been modified or corrupted
```

---

## 🏗️ Architecture

```
👤 User (MetaMask Wallet)
         ↓
🖥️  React Frontend (JSX + Framer Motion)
         ↓                        ↓
⚙️  Go Backend (Gin)         ⛓️  Ethereum Smart Contract
         ↓                        ↓
🍃  MongoDB Atlas            📜  CryptoVault.sol (Sepolia)
☁️  Cloudinary
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + JSX | User Interface |
| Animations | Framer Motion | Smooth UI transitions |
| Backend | Go + Gin Framework | REST API Server |
| Database | MongoDB Atlas | File Metadata Storage |
| Cloud Storage | Cloudinary | Encrypted File Storage |
| Blockchain | Solidity + Ethereum Sepolia | Immutable Hash Storage |
| Web3 | ethers.js v6 | Blockchain Interaction |
| Wallet | MetaMask | User Authentication |
| Hashing | SHA-256 (Go crypto) | File Fingerprinting |
| Encryption | AES-256-GCM | File Encryption |
| Deployment | Vercel | Live Hosting |
| CI/CD | GitHub Actions | Automated Testing |

---

## 📁 Project Structure

```
ChainLock/
├── 📁 frontend/                     React Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx          Home page (before login)
│   │   │   ├── Login.jsx            MetaMask wallet connect
│   │   │   ├── Dashboard.jsx        Stats + Integrity Score
│   │   │   ├── Upload.jsx           File upload + blockchain seal
│   │   │   ├── Verify.jsx           File integrity verification
│   │   │   ├── Files.jsx            File management + download
│   │   │   ├── BlockchainLog.jsx    Transaction history
│   │   │   ├── Profile.jsx          Wallet info + security score
│   │   │   └── NotFound.jsx         404 page
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          Navigation sidebar
│   │   │   ├── Topbar.jsx           Header with wallet info
│   │   │   ├── StatusBadge.jsx      Valid/Tampered/Pending badge
│   │   │   ├── TxStatus.jsx         Blockchain transaction status
│   │   │   └── Loading.jsx          Loading states
│   │   ├── utils/
│   │   │   ├── api.js               Go Backend API calls
│   │   │   ├── blockchain.js        ethers.js contract calls
│   │   │   └── animations.js        Framer Motion variants
│   │   ├── styles/                  CSS files for each page
│   │   └── contracts/
│   │       └── abi.json             Smart contract ABI
│   └── .env                         Environment variables
│
├── 📁 go-backend/                   Go API Server
│   ├── main.go                      Server entry point
│   ├── database/db.go               MongoDB connection
│   ├── handlers/
│   │   ├── upload.go                File upload handler
│   │   ├── verify.go                File verify handler
│   │   └── files.go                 File CRUD handlers
│   ├── models/file.go               MongoDB schema
│   ├── routes/routes.go             API routes
│   └── utils/
│       ├── hash.go                  SHA-256 utility
│       └── hash_test.go             Unit tests
│
└── 📁 contracts/                    Solidity Smart Contract
    ├── CryptoVault.sol              Main contract
    └── abi.json                     Contract ABI
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Download |
|------|---------|---------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| Go | v1.21+ | [golang.org](https://golang.org/) |
| MetaMask | Latest | [metamask.io](https://metamask.io/) |
| MongoDB Atlas | Free tier | [mongodb.com](https://mongodb.com/atlas) |

---

### 1. Clone Repository

```bash
git clone https://github.com/pratikshakalbhor/ChainLock.git
cd ChainLock
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_CONTRACT_ADDRESS=0x_your_deployed_contract_address
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
npm start
# Runs at http://localhost:3000
```

---

### 3. Go Backend Setup

```bash
cd go-backend
```

Create `go-backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
PORT=5000
```

```bash
go mod tidy
go run main.go
# Runs at http://localhost:5000
```

---

### 4. Smart Contract

Contract deployed on **Ethereum Sepolia Testnet**.

To redeploy:
```
1. Open https://remix.ethereum.org
2. Import contracts/CryptoVault.sol
3. Compiler: Solidity 0.8.19
4. Deploy with Injected Provider (MetaMask)
5. Copy address to frontend/.env
```

Get free Sepolia ETH: [sepoliafaucet.com](https://sepoliafaucet.com/)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/upload` | Upload file + generate SHA-256 hash |
| `POST` | `/api/verify` | Verify file integrity |
| `GET` | `/api/files?wallet=0x...` | Get all files by wallet address |
| `GET` | `/api/files/:id` | Get single file details |
| `PUT` | `/api/files/:id/revoke` | Revoke file record |
| `GET` | `/api/stats` | Get dashboard statistics |

---

## 📜 Smart Contract Functions

| Function | Type | Description |
|----------|------|-------------|
| `sealFile()` | write | Store file hash permanently on blockchain |
| `verifyFile()` | write | Compare hash + emit verification event |
| `quickVerify()` | read | View-only hash comparison (no gas fee) |
| `revokeFile()` | write | Revoke file record |
| `getFile()` | read | Fetch file details from blockchain |
| `getStats()` | read | Total files, verifications, tampered count |
| `addUploader()` | write | Add authorized uploader (owner only) |

---

## 🧪 Running Tests

```bash
cd go-backend

# Run all tests
go test ./... -v

# Run utils tests
go test ./utils/ -v

# Run with coverage
go test ./utils/ -v -cover
```

### Test Results:
```
=== RUN   TestGenerateSHA256FromBytes  ✅ PASS
=== RUN   TestHashConsistency          ✅ PASS
=== RUN   TestHashUniqueness           ✅ PASS
=== RUN   TestTamperDetection          ✅ PASS
=== RUN   TestEmptyHash                ✅ PASS

PASS ok cryptovault/utils 0.805s
```

---

## 🔄 How It Works

### Upload Flow:
```
1. User selects file on Upload page
2. Go Backend receives file via POST /api/upload
3. SHA-256 hash generated from file content
4. File metadata saved to MongoDB
5. ethers.js calls sealFile() on Smart Contract
6. MetaMask popup → User confirms transaction
7. TX Hash received → File is blockchain-sealed ✅
```

### Verify Flow:
```
1. User re-uploads same file on Verify page
2. Go Backend generates new SHA-256 hash
3. Original hash fetched from MongoDB
4. Hashes compared:
   Match    → ✅ VALID    (File is authentic)
   Mismatch → ⚠️ TAMPERED (File has been modified)
5. Result shown with both hashes for comparison
```

---

## 📊 Dashboard Features

| Feature | Description |
|---------|-------------|
| **Total Files** | Count of all sealed files |
| **Integrity Score** | % of valid files (animated circle graph) |
| **Valid Count** | Files passing integrity verification |
| **Tampered Count** | Files with hash mismatch detected |
| **Recent Activity** | Last 5 file operations with timestamps |
| **Quick Actions** | Upload, Verify, Blockchain Log buttons |

### Integrity Score:
| Score | Status | Indicator |
|-------|--------|-----------|
| 100% | Perfect | Green |
| 80-99% | Good | Blue |
| 50-79% | Warning | Yellow |
| < 50% | Critical | Red |

---

## 🎯 Real World Use Cases

| Sector | Use Case | Impact |
|--------|----------|--------|
| 🏥 Healthcare | Patient record integrity | Prevent wrong treatment |
| 🏦 Banking | Financial document verification | Audit compliance |
| 🎓 Education | Certificate authenticity | Prevent fake degrees |
| ⚖️ Legal | Contract tamper detection | Legal proof |
| 🏢 Corporate | Employee data integrity | GDPR compliance |
| 🏛️ Government | Public record verification | Transparency |

---

## 🔒 Security Features

- **AES-256-GCM** encryption before cloud upload
- **SHA-256** cryptographic hashing (collision resistant)
- **Ethereum blockchain** — immutable, decentralized record
- **MetaMask** wallet authentication (non-custodial)
- **Private keys never stored** — user retains full control
- **onlyAuthorized** modifier — access control on contract

---

## 🌐 Deployment

### Frontend — Vercel
```
1. vercel.com → New Project
2. Connect GitHub repo
3. Root Directory: frontend
4. Add environment variables
5. Deploy!
```

### Backend — Railway / Render
```
1. railway.app → New Project
2. Connect GitHub repo
3. Root Directory: go-backend
4. Add environment variables
5. Deploy!
```

---

## 🔁 CI/CD Pipeline

GitHub Actions runs on every push to main:

```
Job 1: Go Backend Tests      go test ./... -v
Job 2: Frontend Build        npm run build
Job 3: Contract Check        ABI + .sol file exists
Job 4: Code Quality          go vet ./...
```

---

## 👩💻 Developer

**Pratiksha Kalbhor**
- GitHub: [@pratikshakalbhor](https://github.com/pratikshakalbhor)
- Project: FileProof — ChainLock
- Subject: Blockchain Technology

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Ethereum Foundation](https://ethereum.org/) — Blockchain infrastructure
- [MongoDB Atlas](https://mongodb.com/atlas) — Cloud database
- [Gin Framework](https://gin-gonic.com/) — Go web framework
- [Framer Motion](https://framer.com/motion/) — React animations
- [ethers.js](https://ethers.org/) — Ethereum library

---

> 
