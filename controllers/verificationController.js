const { hashFile } = require("../utils/hash");
const { extractCertId } = require("../services/pdfExtractService");
const { getOnChainCertificate, getTransactionDetails } = require("../services/contractService");
const db = require("../db");
const fs = require("fs");

// In-memory store mapping a short-lived "verification session" to the
// extracted certId + uploaded hash, so we don't need a DB table just
// for this transient step. A class-project-appropriate simplification —
// in production this would expire entries and probably live in Redis.
const pendingVerifications = new Map();

/**
 * STEP 1: receive the uploaded PDF, extract its claimed certId, and
 * hash the file exactly as it was uploaded (not the original on file,
 * since this file might be an altered copy — that's the whole point
 * of verification).
 */
async function prepareVerification(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedPath = req.file.path;
    const certId = await extractCertId(uploadedPath);
    const uploadedHash = hashFile(uploadedPath);

    if (!certId) {
      // Can't even identify the certificate — treat as not found
      // rather than erroring, since from the citizen's perspective
      // this IS one of the three defined outcomes.
      fs.unlinkSync(uploadedPath);
      return res.json({ result: "not_found", certId: null });
    }

    const sessionId = `${certId}-${Date.now()}`;
    pendingVerifications.set(sessionId, { certId, uploadedHash, uploadedPath });

    res.json({ sessionId, certId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process uploaded file" });
  }
}

/**
 * STEP 2: called after the citizen has paid payVerificationFee() on-chain.
 * We re-derive the certId + uploadedHash from the session rather than
 * trusting whatever the frontend sends back — the frontend only ever
 * passes back the sessionId and txHash.
 */
async function confirmVerification(req, res) {
  try {
    const { sessionId, txHash } = req.body;
    const session = pendingVerifications.get(sessionId);
    if (!session) {
      return res.status(400).json({ error: "Verification session not found or expired" });
    }

    const { certId, uploadedHash, uploadedPath } = session;
    const onChain = await getOnChainCertificate(certId);

    let result;
    if (onChain.status === "NonExistent") {
      result = "not_found";
    } else if (onChain.certHash.toLowerCase() === uploadedHash.toLowerCase()) {
      result = "authentic";
    } else {
      result = "altered";
    }

    // Log the payment using data read from the transaction itself.
    // Guarded in its own try/catch: if certId was never issued through
    // this system (e.g. a forged upload with a made-up ID), it won't
    // exist in the local certificates table, and the payments FK
    // constraint would reject the insert. That's fine — the payment
    // still happened on-chain regardless, we just can't attach it to
    // a local certificate row, so we log a warning instead of failing
    // the whole verification response over a foreign-key mismatch.
    if (txHash) {
      try {
        const txDetails = await getTransactionDetails(txHash);
        if (txDetails) {
          await db.query(
            `INSERT INTO payments (cert_id, type, wallet_address, tx_hash, amount_eth)
             VALUES ($1, 'verification', $2, $3, $4)`,
            [certId, txDetails.from, txHash, txDetails.valueEth]
          );
        }
      } catch (logErr) {
        console.warn("Could not log verification payment (certId not in local DB):", logErr.message);
      }
    }

    // Clean up: temp upload no longer needed, session is single-use.
    fs.unlinkSync(uploadedPath);
    pendingVerifications.delete(sessionId);

    res.json({ result, certId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to confirm verification" });
  }
}

module.exports = { prepareVerification, confirmVerification };
