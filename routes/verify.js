const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const { prepareVerification, confirmVerification } = require("../controllers/verificationController");

router.post("/prepare", upload.single("certificate"), prepareVerification);
router.post("/confirm", confirmVerification);

module.exports = router;
