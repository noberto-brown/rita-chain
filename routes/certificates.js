const express = require("express");
const router = express.Router();
const {
  prepareCertificate,
  confirmCertificate,
  getCertificate,
  downloadCertificate,
} = require("../controllers/certificateController");

router.post("/prepare", prepareCertificate);
router.post("/confirm", confirmCertificate);
router.get("/:id", getCertificate);
router.get("/:id/download", downloadCertificate);

module.exports = router;
