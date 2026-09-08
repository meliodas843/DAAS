import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";
import {
  fileURLToPath,
} from "url";

const {
  Pool,
} = pg;

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

dotenv.config({
  path:
    path.join(
      __dirname,
      ".env"
    ),
});

function requireEnv(
  key
) {
  const value =
    process.env[key];

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }

  return value;
}

const DB_HOST =
  requireEnv(
    "DB_HOST"
  );

const DB_PORT =
  Number(
    requireEnv(
      "DB_PORT"
    )
  );

const DB_NAME =
  requireEnv(
    "DB_NAME"
  );

const DB_USER =
  requireEnv(
    "DB_USER"
  );

const DB_PASSWORD =
  requireEnv(
    "DB_PASSWORD"
  );

const JWT_SECRET =
  requireEnv(
    "JWT_SECRET"
  );

if (
  !Number.isInteger(
    DB_PORT
  ) ||
  DB_PORT <= 0 ||
  DB_PORT > 65535
) {
  throw new Error(
    "DB_PORT must be a valid port number"
  );
}

if (
  JWT_SECRET.length <
  64
) {
  throw new Error(
    "JWT_SECRET must contain at least 64 characters"
  );
}

function getSslConfig() {
  if (
    process.env.DB_SSL !==
    "true"
  ) {
    return false;
  }

  const caPath =
    requireEnv(
      "DB_SSL_CA_PATH"
    );

  const absoluteCaPath =
    path.isAbsolute(
      caPath
    )
      ? caPath
      : path.resolve(
          __dirname,
          caPath
        );

  if (
    !fs.existsSync(
      absoluteCaPath
    )
  ) {
    throw new Error(
      `Database CA certificate not found: ${absoluteCaPath}`
    );
  }

  return {
    rejectUnauthorized:
      true,

    ca:
      fs.readFileSync(
        absoluteCaPath,
        "utf8"
      ),
  };
}

const pool =
  new Pool({
    host:
      DB_HOST,

    port:
      DB_PORT,

    database:
      DB_NAME,

    user:
      DB_USER,

    password:
      DB_PASSWORD,

    ssl:
      getSslConfig(),

    max:
      10,

    idleTimeoutMillis:
      30000,

    connectionTimeoutMillis:
      10000,

    application_name:
      "daas-dashboard",
  });

pool.on(
  "error",
  (error) => {
    console.error(
      "Unexpected PostgreSQL pool error:",
      error
    );
  }
);

export default pool;