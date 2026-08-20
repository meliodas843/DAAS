import jwt from "jsonwebtoken";
import pool from "../db.js";

export async function requireAuth(
  req,
  res,
  next
) {
  const authorization =
    req.headers.authorization ||
    "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required"
    });
  }

  const token =
    authorization.slice(7);

  try {
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const result =
      await pool.query(
        `
        SELECT
          id,
          email,
          role,
          must_change_password,
          is_active,
          token_version
        FROM public.dashboard_users
        WHERE id = $1
        LIMIT 1
        `,
        [decoded.id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid session"
      });
    }

    const user =
      result.rows[0];

    if (
      !Boolean(
        user.is_active
      )
    ) {
      return res.status(403).json({
        success: false,
        code:
          "ACCOUNT_DISABLED",
        message:
          "Хэрэглэгч идэвхгүй байна"
      });
    }

    if (
      Number(
        decoded.token_version ??
          0
      ) !==
      Number(
        user.token_version ??
          0
      )
    ) {
      return res.status(401).json({
        success: false,
        code:
          "SESSION_INVALIDATED",
        message:
          "Session expired"
      });
    }

    req.user = {
      id: Number(user.id),
      email: user.email,
      role: user.role,
      must_change_password:
        Boolean(
          user.must_change_password
        ),
      is_active:
        Boolean(
          user.is_active
        ),
      token_version:
        Number(
          user.token_version ||
            0
        )
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token"
    });
  }
}

export function requirePasswordChanged(
  req,
  res,
  next
) {
  if (
    req.user
      ?.must_change_password ===
    true
  ) {
    return res.status(403).json({
      success: false,
      code:
        "PASSWORD_CHANGE_REQUIRED",
      message:
        "Нууц үгээ шинэчилнэ үү"
    });
  }

  return next();
}

export function requireAdmin(
  req,
  res,
  next
) {
  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Admin access required"
    });
  }

  return next();
}

export function requireFinancialAccess(
  req,
  res,
  next
) {
  if (
    !req.user ||
    ![
      "admin",
      "viewer"
    ].includes(
      req.user.role
    )
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Financial data access denied"
    });
  }

  return next();
}