import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowlistPath = path.resolve(
  __dirname,
  "../../config/ips.txt"
);

function loadAllowedIps() {
  try {
    return fs
      .readFileSync(allowlistPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !line.startsWith("#")
      );
  } catch (error) {
    console.error(
      "Failed to load IP allowlist:",
      error
    );
    return [];
  }
}

export function requireAllowedIp(
  req,
  res,
  next
) {
  const allowedIps = loadAllowedIps();

  const clientIp = String(
    req.ip || ""
  ).replace(/^::ffff:/, "");

  if (!allowedIps.includes(clientIp)) {
    console.warn(`Blocked IP: ${clientIp}`);

    return res.status(403).json({
      success: false,
      message: "IP address is not allowed",
    });
  }

  return next();
}
