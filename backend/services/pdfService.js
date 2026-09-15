const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const CERT_DIR = path.join(__dirname, "..", "storage", "certificates");

// Ensure the storage directory exists before we ever try to write to it.
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

/**
 * Generates a birth certificate PDF from applicant data and writes it
 * to local storage. Returns the file path so the caller can hash it
 * and later serve it for download.
 *
 * certId is embedded as plain text in the PDF so that during
 * verification, the backend can extract it back out of an uploaded
 * certificate (Phase 8).
 */
function generateCertificatePdf({ certId, name, dob, placeOfBirth }) {
  const filePath = path.join(CERT_DIR, `${certId}.pdf`);
  const doc = new PDFDocument({ size: "A4", margin: 60 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(20).text("Certificate of Birth", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(12).text(`Certificate ID: ${certId}`);
  doc.moveDown();
  doc.text(`Full name: ${name}`);
  doc.text(`Date of birth: ${dob}`);
  doc.text(`Place of birth: ${placeOfBirth}`);
  doc.moveDown(2);

  doc.fontSize(10).fillColor("gray").text(
    "This certificate is registered on the Ethereum Sepolia test network. " +
    "Its authenticity can be verified using the certificate ID above.",
    { align: "left" }
  );

  doc.end();

  // Return a promise so the caller can await the file being fully written
  // before hashing it — hashing a half-written file would produce a
  // hash that never matches on re-verification.
  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
}

module.exports = { generateCertificatePdf, CERT_DIR };
