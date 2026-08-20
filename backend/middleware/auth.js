import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authorization =
    req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
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

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}

export function requireAdmin(req, res, next) {
  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }

  next();
}