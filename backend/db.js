import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "misheel1",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD ?? "    "
});

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

pool.on("error", (error) => {
  console.error("PostgreSQL error:", error);
});

export default pool;