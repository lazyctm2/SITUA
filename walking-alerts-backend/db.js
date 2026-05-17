const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "walking_alerts",
  password: process.env.DB_PASSWORD || undefined,
  port: Number(process.env.DB_PORT || 5432),
});

module.exports = pool;