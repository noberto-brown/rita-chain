const { v4: uuidv4 } = require("uuid");
const { generateCertificatePdf } = require("../services/pdfService");
const { hashFile } = require("../utils/hash");
const { getOnChainCertificate, getTransactionDetails } = require("../services/contractService");
const db = require("../db"); // pg Pool instance, created in Phase 3 setup

/**
 * STEP 1 of issuance: generate the PDF and hash BEFORE any payment.
 * The contract call needs the hash as an argument, so this must
 * happen first. Nothing is written on-chain here.
 */
async function prepareCertificate(req, res) {
  try {
    const { name, dob, placeOfBirth } = req.body;
    if (!name || !dob || !placeOfBirth) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const certId = uuidv4();
    const pdfPath = await generateCertificatePdf({ certId, name, dob, placeOfBirth });
    const certHash = hashFile(pdfPath);

    // Store as a "pending" row — not yet confirmed on-chain.
    await db.query(
      `INSERT INTO certificates (cert_id, applicant_name, date_of_birth, place_of_birth, pdf_path, sha256_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [certId, name, dob, placeOfBirth, pdfPath, certHash]
    );

    res.json({ certId, certHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to prepare certificate" });
  }
}

/**
 * STEP 2 of issuance: called by the frontend after the citizen's
 * MetaMask transaction confirms. We independently re-read the
 * contract ourselves rather than trusting the frontend's word for it
 * — this is important: never trust the client to say "it worked".
 */
async function confirmCertificate(req, res) {
  try {
    const { certId, txHash } = req.body;

    const onChain = await getOnChainCertificate(certId);
    if (onChain.status !== "Valid") {
      return res.status(400).json({ error: "Certificate not confirmed on-chain yet" });
    }

    await db.query(
      `UPDATE certificates SET tx_hash = $1, issued_at = to_timestamp($2), status = 'issued' WHERE cert_id = $3`,
      [txHash, onChain.issuedAt, certId]
    );

    // Log the payment using data read from the transaction itself,
    // not from anything the frontend claims — same "never trust the
    // client" principle applied to money as we applied to certificate status.
    const txDetails = await getTransactionDetails(txHash);
    if (txDetails) {
      await db.query(
        `INSERT INTO payments (cert_id, type, wallet_address, tx_hash, amount_eth)
         VALUES ($1, 'issuance', $2, $3, $4)`,
        [certId, txDetails.from, txHash, txDetails.valueEth]
      );
    }

    res.json({ status: "issued", certId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to confirm certificate" });
  }
}

async function getCertificate(req, res) {
  const { id } = req.params;
  const result = await db.query(`SELECT * FROM certificates WHERE cert_id = $1`, [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
}

async function downloadCertificate(req, res) {
  const { id } = req.params;
  const result = await db.query(`SELECT pdf_path FROM certificates WHERE cert_id = $1`, [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.download(result.rows[0].pdf_path, `certificate-${id}.pdf`);
}

module.exports = { prepareCertificate, confirmCertificate, getCertificate, downloadCertificate };
