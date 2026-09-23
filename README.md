# RITA Chain

## Blockchain-based Birth Certificate Issuance and Verification System

RITA Chain is an educational full-stack application for issuing and verifying digital birth certificates. It combines a React web interface, an Express API, PostgreSQL storage, PDF generation, SHA-256 hashing, and an Ethereum Sepolia smart contract.

The system is divided into two independently runnable parts:

- **`backend/`**: Node.js and Express REST API. It manages applications, PDF files, PostgreSQL records, certificate hashes, payment records, and communication with the deployed smart contract.
- **`frontend/`**: React and Vite web application. It provides the user interface, connects to MetaMask, submits applications, handles payment transactions, and displays issuance and verification results.

## Main Workflows

### Certificate issuance

1. A citizen completes the birth certificate application form.
2. The user connects MetaMask and switches to the Ethereum Sepolia test network.
3. The user pays the configured issuance fee through the smart contract.
4. The backend generates a PDF certificate and calculates its SHA-256 hash.
5. Certificate details and the hash are recorded in PostgreSQL and on the blockchain.
6. The generated PDF can be downloaded from the application.

### Certificate verification

1. A user uploads a birth certificate PDF.
2. The backend extracts the certificate information and calculates the uploaded file's SHA-256 hash.
3. The user connects MetaMask and pays the verification fee on Sepolia.
4. The backend compares the uploaded certificate hash with the blockchain record.
5. The frontend reports whether the certificate is authentic, altered, or not found.

## Technology Stack

- **Frontend:** React, Vite, React Router, Tailwind CSS, Ethers.js
- **Backend:** Node.js, Express, Ethers.js, Multer, PDFKit, `pdf-parse`
- **Database:** PostgreSQL
- **Blockchain:** Ethereum Sepolia testnet and Solidity smart contract
- **Wallet:** MetaMask

## Repository Structure

```text
rita-chain/
├── backend/
│   ├── contracts/       Solidity smart contract source
│   ├── controllers/     Issuance and verification request handlers
│   ├── routes/          Express API routes
│   ├── services/        Smart contract, PDF, and PDF extraction services
│   ├── config/          Upload configuration and contract ABI
│   ├── schema.sql       PostgreSQL table definitions
│   └── server.js        Backend entry point
└── frontend/
	└── src/
		├── components/  Reusable form, wallet, and payment components
		├── context/     MetaMask wallet state
		├── pages/       Home, application, issuance, and verification screens
		└── App.jsx      Client-side routes
```

## Prerequisites

Install or have access to the following before starting:

- Node.js 18 or newer and npm
- PostgreSQL 14 or newer
- A MetaMask browser extension
- A Sepolia testnet account with Sepolia ETH for gas and application payments
- A deployed `BirthCertificate.sol` contract on Sepolia
- An Ethereum provider RPC URL for Sepolia, such as Infura or Alchemy

The contract address and ABI must match the deployed contract. The backend and frontend each use their own environment variable for the contract address.

## Setup After Cloning

### 1. Clone the repository

```bash
git clone <repository-url>
cd rita-chain
```

### 2. Create the PostgreSQL database

Create a PostgreSQL user and database, for example:

```bash
sudo -u postgres psql
```

```sql
CREATE USER birth_cert_user WITH PASSWORD 'choose_a_password';
CREATE DATABASE birth_cert_db OWNER birth_cert_user;
\q
```

The backend automatically creates the application tables when it starts by executing `backend/schema.sql`.

### 3. Deploy the smart contract and update the ABI

Deploy `backend/contracts/BirthCertificate.sol` to the Sepolia testnet using your chosen Solidity toolchain, such as Remix, Hardhat, or another compatible deployment tool. Record the deployed contract address and export or copy the ABI generated from the same compilation and deployment.

Replace the contents of both existing ABI files with that generated ABI:

```text
backend/config/contractABI.json
frontend/src/config/contractABI.json
```

The two files must contain the ABI for the same deployed contract. The ABI must include the functions used by the application, including `issueCertificate`, `payVerificationFee`, and `getCertificate`. Do not use an ABI from a different contract version.

Use the deployed address in both the backend and frontend environment files in the next steps:

- `CONTRACT_ADDRESS` in `backend/.env`
- `VITE_CONTRACT_ADDRESS` in `frontend/.env`

### 4. Configure the backend

```bash
cd backend
cp .env-example .env
```

Edit `backend/.env`:

```env
DB_USER=birth_cert_user
DB_PASSWORD=choose_a_password
DB_NAME=birth_cert_db
DB_HOST=localhost
DB_PORT=5432
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<your-project-id>
CONTRACT_ADDRESS=0xYourDeployedContractAddress
PRIVATE_KEY=0xYourBackendWalletPrivateKey
```

`PRIVATE_KEY` is used by the backend for blockchain operations. Use a dedicated testnet wallet and never commit `.env` or expose this key publicly.

Install dependencies and start the API:

```bash
npm install
npm start
```

The backend runs at `http://localhost:4000` by default. Confirm it is running with:

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{"status":"ok"}
```

### 5. Configure and start the frontend

Open a second terminal at the repository root:

```bash
cd frontend
cp .env-example .env
```

Edit `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_API_URL=http://localhost:4000
```

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## API Routes

The backend provides the following route groups:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check whether the API is running |
| `POST` | `/api/certificates/prepare` | Prepare a certificate application |
| `POST` | `/api/certificates/confirm` | Confirm issuance payment and complete issuance |
| `GET` | `/api/certificates/:id` | Retrieve certificate details |
| `GET` | `/api/certificates/:id/download` | Download an issued certificate PDF |
| `POST` | `/api/verify/prepare` | Upload and prepare a certificate for verification |
| `POST` | `/api/verify/confirm` | Confirm verification payment and return the result |

## Useful Development Commands

Run these commands from `frontend/`:

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build locally
```

Run this command from `backend/`:

```bash
npm start         # Start the Express API with nodemon
```

## Important Notes

- This project is intended for learning and demonstration on the Sepolia testnet. It is not a production government certificate system.
- Do not use real personal data, real funds, or a wallet containing valuable assets.
- Keep private keys, RPC credentials, database passwords, generated certificate files, and environment files out of source control.
- MetaMask must be installed and connected to Sepolia before issuance or verification payments can be made.
