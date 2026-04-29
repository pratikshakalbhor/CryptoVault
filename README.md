# 🔐 FileProof (ChainLock)

> **Decentralized File Integrity System with Blockchain Auditing**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue.svg)](https://soliditylang.org/)
[![Go](https://img.shields.io/badge/Go-1.21-cyan.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple.svg)](https://sepolia.etherscan.io/)

---

## 📌 Problem Statement

Cloud storage files can be **silently corrupted or tampered** without anyone knowing:

| Problem | Description |
|---------|-------------|
| 🦠 **Bit Rot** | Hardware failures corrupt files over time — undetected. |
| 👤 **Insider Threats** | Cloud employees or attackers can modify database records silently. |
| 🔓 **No Proof** | Traditional databases cannot cryptographically prove data was never changed. |
| ⚖️ **Legal Risk** | No immutable audit trail for legal and regulatory compliance. |

> *"Wrong Data is more dangerous than No Data."*

---

## ✅ Solution — "Trust but Verify"

FileProof uses a **Triple-Check Verification System** (Local vs. DB vs. Blockchain):

1. **Local Hash Generation**: Client/Backend generates a strict SHA-256 fingerprint of the file.
2. **Database Record**: Metadata is securely stored in MongoDB.
3. **Blockchain Seal**: The hash is permanently logged on the Ethereum Sepolia Testnet via our smart contract.

### New & Advanced Features

*   🔍 **Heuristic Audit System**: If a file is flagged as `TAMPERED`, the backend performs a heuristic check by comparing the current uploaded file size against the originally stored size. A Detailed Audit Report explains if data was appended, removed, or bit-flipped.
*   🗑️ **Trash & Restore Engine**: Files can be safely soft-deleted to a Trash Bin. They are immediately hidden from dashboards and can be fully restored or permanently wiped via dedicated API routes.
*   📄 **PDF Verification Certificates**: Instantly generate and download a cryptographic PDF certificate proving a file's authenticity.
*   🔗 **Public Sharing & QR Codes**: Share verified files with external users through a beautifully designed public verification portal and scannable QR codes.
*   ⏱️ **File Expiry**: Set an expiration date for files, after which they are flagged to prevent outdated verification.

---

## 🏗️ Architecture

```text
👤 User (MetaMask Wallet)
         ↓
🖥️  React Frontend (Vite + JSX + Framer Motion)
         ↓                        ↓
⚙️  Go Backend (Gin/Fiber)   ⛓️  Smart Contract (Ethereum)
         ↓                        ↓
🍃  MongoDB Atlas            📜  FileRegistry.sol (Sepolia)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React (Vite) + Tailwind CSS | User Interface & Glassmorphic Dark UI |
| **Animations** | Framer Motion | Smooth UI transitions & Micro-animations |
| **Backend** | Go (Golang) + Gin | Concurrent, high-performance REST API |
| **Database** | MongoDB Atlas | Fast, NoSQL metadata storage |
| **Blockchain** | Solidity + Ethereum Sepolia | Immutable Hash Storage & Ledger |
| **Web3** | ethers.js v6 | Frontend-to-Blockchain interactions |
| **Wallet** | MetaMask | User Authentication & Transaction signing |

---

## 📁 Project Structure

```text
ChainLock/
├── 📁 frontend/                     # React Vite Application
│   ├── src/
│   │   ├── pages/                   # App Views (Dashboard, Upload, Verify, Trash, etc.)
│   │   ├── components/              # Reusable UI (Sidebar, Topbar, Modals)
│   │   ├── utils/                   # API bindings, ethers.js config, animation variants
│   │   └── index.css                # Global Tailwind styles & Glassmorphic tokens
│   └── package.json
│
├── 📁 go-backend/                   # Go API Server
│   ├── main.go                      # Application Entry Point
│   ├── database/db.go               # MongoDB Connection Manager
│   ├── handlers/                    # REST API Controllers (Upload, Verify, Trash)
│   ├── models/file.go               # BSON/JSON Data Models
│   └── routes/routes.go             # Gin Router Configuration
│
└── 📁 contracts/                    # Solidity Smart Contracts
    ├── FileRegistry.sol             # Ethereum Logic
    └── abi.json                     # Contract ABI
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| Go | v1.21+ |
| MetaMask | Latest |
| MongoDB Atlas | Free tier |

### 1. Clone Repository

```bash
git clone https://github.com/pratikshakalbhor/ChainLock.git
cd ChainLock
```

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
# App starts on http://localhost:3000
```

### 3. Go Backend Setup

*Note: Ensure `CGO_ENABLED=0` is set if running on Windows with certain MinGW configurations.*

```bash
cd go-backend
```

Create `go-backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
PORT=5000
PINATA_API_KEY=your_key  # Optional: For IPFS backups
```

```bash
$env:CGO_ENABLED="0"  # For Windows PowerShell
go mod tidy
go run main.go
# Server starts on http://localhost:5000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload file, generate SHA-256 hash, and store metadata |
| `POST` | `/api/verify` | Verify integrity & return Heuristic Audit if tampered |
| `GET`  | `/api/files` | Get all active files (excludes trash) |
| `GET`  | `/api/files/trash/all`| Get all soft-deleted files |
| `DELETE`| `/api/files/:id` | Soft delete (Move to Trash) |
| `POST` | `/api/files/:id/restore`| Restore file from Trash |
| `DELETE`| `/api/files/:id/permanent`| Permanently delete a file |
| `GET`  | `/api/files/:id/certificate`| Download PDF verification certificate |
| `GET`  | `/api/stats` | Get Dashboard analytics (Valid vs. Tampered) |

---

## 🛡️ Security & Integrity

*   **Cryptographic Fingerprinting**: SHA-256 hashes mean even a single bit-flip radically changes the fingerprint.
*   **Tamper Heuristics**: Our Go backend calculates the byte-level discrepancy between the original and tampered files to detect unauthorized insertions or deletions.
*   **Immutability**: Once a transaction is confirmed on Sepolia, the proof is mathematically irreversible.
*   **Soft Deletions**: Accidental deletions are protected via a robust Trash/Restore system.

---

## 👨‍💻 Developed By

**Pratiksha Kalbhor**
- GitHub: [@pratikshakalbhor](https://github.com/pratikshakalbhor)
- Project: FileProof (ChainLock)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
