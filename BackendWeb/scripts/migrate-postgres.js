/* eslint-disable no-console */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function buildConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "password";
  const db = process.env.DB_NAME || "lapstore_db";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}

function sanitizePgDumpSql(raw) {
  return String(raw || "")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (t.startsWith("\\")) return false;
      if (/^DROP DATABASE\b/i.test(t)) return false;
      if (/^CREATE DATABASE\b/i.test(t)) return false;
      if (/^ALTER DATABASE\b/i.test(t)) return false;
      if (/^\\connect\b/i.test(t)) return false;
      if (/^\\restrict\b/i.test(t)) return false;
      if (/^\\unrestrict\b/i.test(t)) return false;
      return true;
    })
    .join("\n");
}

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function run() {
  const schemaPath = path.resolve(__dirname, "..", "schema.sql");
  const sqlRaw = fs.readFileSync(schemaPath, "utf8");
  const sql = sanitizePgDumpSql(sqlRaw);
  const statements = splitStatements(sql);

  const client = new Client({
    connectionString: buildConnectionString(),
    ssl: process.env.NODE_ENV === "production" ? { require: true, rejectUnauthorized: false } : false,
  });

  await client.connect();
  try {
    await client.query("BEGIN");
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query("COMMIT");
    console.log(`Migration completed. Executed ${statements.length} statements.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
