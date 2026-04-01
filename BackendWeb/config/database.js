const { Pool } = require("pg");

function buildConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "password";
  const db = process.env.DB_NAME || "lapstore_db";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}

function sanitizeConnectionString(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return value;
  try {
    const parsed = new URL(value);
    // Let pg client ssl option control TLS behavior.
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("uselibpqcompat");
    return parsed.toString();
  } catch (_) {
    return value;
  }
}

/** PostgreSQL folds unquoted identifiers to lowercase, breaking camelCase keys node-pg returns (e.g. discountType → discounttype). Quote camelCase SELECT aliases only. */
function quoteCamelCaseSelectAliases(sql) {
  return String(sql || "").replace(
    /\bAS\s+([a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)+)\b/g,
    (match, alias) => `AS "${alias}"`
  );
}

function normalizeSql(sql) {
  let out = String(sql || "");
  out = out.replace(/`([^`]+)`/g, "\"$1\"");
  out = out.replace(/\bIFNULL\s*\(/gi, "COALESCE(");
  out = out.replace(/\bCURDATE\s*\(\s*\)/gi, "CURRENT_DATE");
  out = out.replace(/DATE_SUB\s*\(\s*CURRENT_DATE\s*,\s*INTERVAL\s+\?\s+DAY\s*\)/gi, "CURRENT_DATE - (? * INTERVAL '1 DAY')");
  out = out.replace(/DATE_SUB\s*\(\s*CURRENT_DATE\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi, "CURRENT_DATE - INTERVAL '$1 DAY'");
  out = out.replace(
    /GROUP_CONCAT\s*\(\s*DISTINCT\s+(.+?)\s+ORDER\s+BY\s+.+?\s+SEPARATOR\s+'([^']*)'\s*\)/gis,
    "STRING_AGG($1::text, '$2')"
  );
  out = out.replace(
    /GROUP_CONCAT\s*\(\s*DISTINCT\s+(.+?)\s+SEPARATOR\s+'([^']*)'\s*\)/gis,
    "STRING_AGG($1::text, '$2')"
  );
  out = out.replace(
    /INSERT INTO\s+app_settings\s*\(\s*["`]?key["`]?\s*,\s*["`]?value["`]?\s*\)\s*VALUES\s*\(\s*'pricing'\s*,\s*CAST\(\?\s+AS\s+JSON\)\s*\)\s*ON DUPLICATE KEY UPDATE\s+["`]?value["`]?\s*=\s*CAST\(\?\s+AS\s+JSON\)/i,
    "INSERT INTO app_settings (\"key\", \"value\") VALUES ('pricing', CAST(? AS JSONB)) ON CONFLICT (\"key\") DO UPDATE SET \"value\" = EXCLUDED.\"value\""
  );
  out = quoteCamelCaseSelectAliases(out);
  return out;
}

function bindQuestionParams(sql, params = []) {
  let idx = 0;
  let result = "";
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      result += ch;
      continue;
    }
    if (ch === "\"" && !inSingle) {
      inDouble = !inDouble;
      result += ch;
      continue;
    }
    if (ch === "?" && !inSingle && !inDouble) {
      idx += 1;
      result += `$${idx}`;
      continue;
    }
    result += ch;
  }
  return { text: result, values: params };
}

function mapPgError(err) {
  if (err && err.code === "23505") {
    err.code = "ER_DUP_ENTRY";
    err.sqlMessage = err.detail || err.message;
  }
  return err;
}

function toMysqlLikeResult(pgResult, rows) {
  const command = String(pgResult?.command || "").toUpperCase();
  if (command === "SELECT" || command === "SHOW" || command === "WITH") return [rows];
  const info = {
    affectedRows: Number(pgResult?.rowCount || 0),
    insertId: rows?.[0]?.id ?? 0,
  };
  return [info];
}

async function runQuery(client, rawSql, params = []) {
  const normalized = normalizeSql(rawSql);
  const { text, values } = bindQuestionParams(normalized, params);
  const isInsert = /^\s*insert\s+/i.test(text);
  const hasReturning = /\breturning\b/i.test(text);
  try {
    if (isInsert && !hasReturning) {
      const withReturning = `${text} RETURNING id`;
      const res = await client.__nativeQuery(withReturning, values);
      return toMysqlLikeResult(res, res.rows || []);
    }
    const res = await client.__nativeQuery(text, values);
    return toMysqlLikeResult(res, res.rows || []);
  } catch (error) {
    if (isInsert && !hasReturning) {
      try {
        const res = await client.__nativeQuery(text, values);
        return toMysqlLikeResult(res, res.rows || []);
      } catch (fallbackErr) {
        throw mapPgError(fallbackErr);
      }
    }
    throw mapPgError(error);
  }
}

// Handle SSL configuration for Render and other production environments
const getPoolConfig = () => {
  let connectionString = process.env.DATABASE_URL;
  const config = {};

  if (process.env.NODE_ENV === 'production') {
    // For Render and production environments with libpq compatibility
    // Using uselibpqcompat=true for forward compatibility with pg v9.0.0
    if (connectionString) {
      // Add libpq compatibility and SSL mode parameters if not already present
      if (!connectionString.includes('sslmode') && !connectionString.includes('uselibpqcompat')) {
        connectionString += '?uselibpqcompat=true&sslmode=require';
      } else if (!connectionString.includes('uselibpqcompat')) {
        connectionString += connectionString.includes('?') ? '&uselibpqcompat=true' : '?uselibpqcompat=true';
      }
    }
    
    config.connectionString = connectionString;
    config.ssl = {
      rejectUnauthorized: false,
    };
  } else {
    // Development environment
    config.connectionString = connectionString;
    config.ssl = false;
  }

  return config;
};

const pool = new Pool(getPoolConfig());

pool
  .connect()
  .then((client) => {
    console.log("Connected to PostgreSQL database successfully");
    client.release();
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

pool.__nativeQuery = pool.query.bind(pool);
pool.query = async (sql, params = []) => runQuery(pool, sql, params);

pool.getConnection = async () => {
  const client = await pool.connect();
  client.__nativeQuery = client.query.bind(client);
  return {
    query: (sql, params = []) => runQuery(client, sql, params),
    beginTransaction: () => client.query("BEGIN"),
    commit: () => client.query("COMMIT"),
    rollback: () => client.query("ROLLBACK"),
    release: () => client.release(),
  };
};

module.exports = pool;