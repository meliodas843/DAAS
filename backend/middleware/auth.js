import jwt from "jsonwebtoken";

import pool from "../db.js";

export async function requireAuth(
  req,
  res,
  next
) {
  try {
    const authorization = String(
      req.headers.authorization || ""
    );

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        code: "NO_TOKEN",
        message: "Authentication required"
      });
    }

    const token = authorization
      .slice(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "NO_TOKEN",
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId = Number(decoded.id);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid session"
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        email,
        role,
        must_change_password,
        is_active,
        is_blocked,
        failed_login_attempts,
        token_version
      FROM public.dashboard_users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        code: "USER_REMOVED",
        message: "Хэрэглэгч олдсонгүй"
      });
    }

    const user = result.rows[0];

    if (!Boolean(user.is_active)) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_DISABLED",
        message: "Хэрэглэгч идэвхгүй байна"
      });
    }

    if (Boolean(user.is_blocked)) {
      return res.status(423).json({
        success: false,
        code: "ACCOUNT_BLOCKED",
        message: "Хэрэглэгч блоклогдсон байна"
      });
    }

    const tokenVersion = Number(
      decoded.token_version ?? 0
    );

    const databaseTokenVersion = Number(
      user.token_version ?? 0
    );

    if (
      tokenVersion !== databaseTokenVersion
    ) {
      return res.status(401).json({
        success: false,
        code: "SESSION_REVOKED",
        message: "Таны session хүчингүй болсон"
      });
    }

    req.user = {
      id: Number(user.id),

      email: user.email,

      role: String(
        user.role || "viewer"
      )
        .trim()
        .toLowerCase(),

      must_change_password: Boolean(
        user.must_change_password
      ),

      is_active: Boolean(
        user.is_active
      ),

      is_blocked: Boolean(
        user.is_blocked
      ),

      failed_login_attempts: Number(
        user.failed_login_attempts || 0
      ),

      token_version: databaseTokenVersion
    };

    return next();
  } catch (error) {
    if (
      error?.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Session хугацаа дууссан"
      });
    }

    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid session"
      });
    }

    console.error(
      "AUTH MIDDLEWARE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

export function requirePasswordChanged(
  req,
  res,
  next
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Authentication required"
    });
  }

  if (
    Boolean(
      req.user.must_change_password
    )
  ) {
    return res.status(403).json({
      success: false,
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "Нууц үгээ эхлээд солино уу"
    });
  }

  return next();
}

export function requireAdmin(
  req,
  res,
  next
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Authentication required"
    });
  }

  const role = String(
    req.user.role || ""
  )
    .trim()
    .toLowerCase();

  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      code: "ADMIN_REQUIRED",
      message: "Admin access required"
    });
  }

  return next();
}

export function requireFinancialAccess(
  req,
  res,
  next
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Authentication required"
    });
  }

  const role = String(
    req.user.role || ""
  )
    .trim()
    .toLowerCase();

  const allowedRoles = [
    "admin",
    "viewer"
  ];

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      code: "FINANCIAL_ACCESS_DENIED",
      message:
        "Санхүүгийн мэдээлэл харах эрхгүй байна"
    });
  }

  return next();
}