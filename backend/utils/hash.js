const crypto = require("crypto");
const fs = require("fs");

/**
 * Computes the SHA-256 hash of a file's contents.
 * Returns a 0x-prefixed hex string, ready to be cast to bytes32
 * when passed to the smart contract.
 */
function hashFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  return "0x" + hash;
}

module.exports = { hashFile };
