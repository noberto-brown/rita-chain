const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// A single shared connection pool for the whole backend.
// Every controller imports this instead of creating its own
// connection — pooling avoids exhausting PostgreSQL's max
// connection limit under repeated requests.
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

async function initializeDatabase() {
  await pool.query(schemaSql);
}

pool.on('connect', (stream) => {
  console.log('someone connected!');
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error on idle client", err);
});

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
