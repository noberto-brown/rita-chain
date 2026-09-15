const multer = require("multer");
const path = require("path");

// Uploaded files land in a temp folder, separate from the
// backend/storage/certificates folder used for genuinely issued PDFs.
// This keeps "files we generated" and "files a stranger uploaded"
// clearly separated on disk.
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap, generous for a text PDF
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are accepted"));
    }
    cb(null, true);
  },
});

module.exports = upload;
