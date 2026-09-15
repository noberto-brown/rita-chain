const { ethers } = require("ethers");
require("dotenv").config();
const abi = require("../config/contractABI.json");

// The backend only ever READS from the contract in this project.
// Writing (issueCertificate, payVerificationFee) is done by the citizen's
// own wallet from the frontend — see Phase 7 design note on trustless payments.
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

const STATUS = { 0: "NonExistent", 1: "Valid", 2: "Revoked" };

/**
 * Reads a certificate record directly from the smart contract.
 * Used both to confirm a fresh issuance and, later in Phase 8,
 * to compare hashes during verification.
 */
async function getOnChainCertificate(certId) {
  const [certHash, issuer, issuedAt, status] = await contract.getCertificate(certId);
  return {
    certHash,
    issuer,
    issuedAt: Number(issuedAt),
    status: STATUS[status],
  };
}

/**
 * Fetches sender address and ETH value of a mined transaction.
 * Used to log an accurate payment record without trusting the
 * frontend to self-report the wallet address or amount paid.
 */
async function getTransactionDetails(txHash) {
  const tx = await provider.getTransaction(txHash);
  if (!tx) return null;
  return {
    from: tx.from,
    valueEth: ethers.formatEther(tx.value),
  };
}

module.exports = { getOnChainCertificate, getTransactionDetails };
