import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const requiredEnvironmentVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET"
];

for (const key of requiredEnvironmentVariables) {
  const value = process.env[key];

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }
}

if (String(process.env.JWT_SECRET).length < 64) {
  throw new Error(
    "JWT_SECRET must be at least 64 characters"
  );
}

const port = Number(process.env.DB_PORT);

if (!Number.isInteger(port)) {
  throw new Error(
    "DB_PORT must be a valid integer"
  );
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false
        }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

pool.on("error", (error) => {
  console.error(
    "PostgreSQL pool error:",
    error
  );
});

export default pool;