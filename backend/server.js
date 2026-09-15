const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const certificateRoutes = require("./routes/certificates");
const verifyRoutes = require("./routes/verify");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/certificates", certificateRoutes);
app.use("/api/verify", verifyRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await db.initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to initialize database schema", err);
    process.exit(1);
  }
})();
