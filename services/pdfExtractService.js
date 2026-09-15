const {PDFParse} = require("pdf-parse");

/**
 * Extracts the certificate ID embedded in the PDF text, written there
 * during generation in Phase 7 (generateCertificatePdf). If the PDF
 * has been tampered with so heavily that this text itself is missing
 * or altered, extraction will fail — which itself is a meaningful
 * signal (treated as "does not exist" upstream, since we can't even
 * identify which certificate is being claimed).
 */
async function extractCertId(filePath) {
  const parser = new PDFParse({url: filePath});
  const data = await parser.getText();

  const match = data.text.match(/Certificate ID:\s*([a-f0-9-]{36})/i);
  if (!match) {
    return null;
  }
  return match[1];
}

module.exports = { extractCertId };
