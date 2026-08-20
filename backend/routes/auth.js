import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../db.js";
import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";

const router =
  express.Router();

const loginAttempts =
  new Map();

const MAX_ATTEMPTS = 5;
const BLOCK_TIME =
  15 * 60 * 1000;

function getClientKey(req) {
  return String(
    req.ip ||
      req.socket
        ?.remoteAddress ||
      "unknown"
  );
}

function loginRateLimit(
  req,
  res,
  next
) {
  const key =
    getClientKey(req);

  const now =
    Date.now();

  const record =
    loginAttempts.get(key);

  if (
    record &&
    record.blockedUntil >
      now
  ) {
    const seconds =
      Math.ceil(
        (
          record.blockedUntil -
          now
        ) / 1000
      );

    return res.status(429).json({
      success: false,
      message:
        `Too many login attempts. Try again in ${seconds} seconds.`
    });
  }

  if (
    record &&
    record.blockedUntil <=
      now
  ) {
    loginAttempts.delete(
      key
    );
  }

  req.loginRateKey =
    key;

  return next();
}

function recordFailedLogin(
  key
) {
  const now =
    Date.now();

  const current =
    loginAttempts.get(key) ||
    {
      attempts: 0,
      blockedUntil: 0
    };

  current.attempts += 1;

  if (
    current.attempts >=
    MAX_ATTEMPTS
  ) {
    current.blockedUntil =
      now +
      BLOCK_TIME;

    current.attempts = 0;
  }

  loginAttempts.set(
    key,
    current
  );
}

function clearLoginAttempts(
  key
) {
  loginAttempts.delete(
    key
  );
}

function createToken(
  user
) {
  return jwt.sign(
    {
      id:
        Number(user.id),
      token_version:
        Number(
          user.token_version ||
            0
        )
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
      jwtid:
        crypto.randomUUID()
    }
  );
}

router.post(
  "/auth/login",
  loginRateLimit,
  async (req, res) => {
    try {
      const email =
        String(
          req.body.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body.password ||
            ""
        );

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required"
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            email,
            password_hash,
            role,
            must_change_password,
            is_active,
            token_version
          FROM public.dashboard_users
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [email]
        );

      if (
        result.rows.length ===
        0
      ) {
        recordFailedLogin(
          req.loginRateKey
        );

        return res.status(401).json({
          success: false,
          message:
            "И-мэйл эсвэл нууц үг буруу байна"
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
          message:
            "Хэрэглэгч идэвхгүй байна"
        });
      }

      const validPassword =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (
        !validPassword
      ) {
        recordFailedLogin(
          req.loginRateKey
        );

        return res.status(401).json({
          success: false,
          message:
            "И-мэйл эсвэл нууц үг буруу байна"
        });
      }

      clearLoginAttempts(
        req.loginRateKey
      );

      const token =
        createToken(user);

      return res.json({
        success: true,
        token,
        user: {
          id:
            Number(
              user.id
            ),
          email:
            user.email,
          role:
            user.role,
          must_change_password:
            Boolean(
              user.must_change_password
            )
        }
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    }
  }
);

router.get(
  "/auth/me",
  requireAuth,
  async (req, res) => {
    return res.json({
      success: true,
      user: {
        id:
          req.user.id,
        email:
          req.user.email,
        role:
          req.user.role,
        must_change_password:
          req.user
            .must_change_password
      }
    });
  }
);

router.post(
  "/auth/logout",
  requireAuth,
  async (req, res) => {
    try {
      await pool.query(
        `
        UPDATE public.dashboard_users
        SET
          token_version =
            token_version + 1,
          updated_at = NOW()
        WHERE id = $1
        `,
        [req.user.id]
      );

      return res.json({
        success: true
      });
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    }
  }
);

router.post(
  "/auth/change-password",
  requireAuth,
  async (req, res) => {
    try {
      const currentPassword =
        String(
          req.body
            .current_password ||
            ""
        );

      const newPassword =
        String(
          req.body
            .new_password ||
            ""
        );

      const confirmPassword =
        String(
          req.body
            .confirm_password ||
            ""
        );

      if (
        !currentPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Одоогийн нууц үгээ оруулна уу"
        });
      }

      if (
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Шинэ нууц үгээ оруулна уу"
        });
      }

      if (
        newPassword.length <
        10
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Нууц үг хамгийн багадаа 10 тэмдэгт байна"
        });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Нууц үг таарахгүй байна"
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            email,
            password_hash,
            role,
            must_change_password,
            is_active,
            token_version
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [req.user.id]
        );

      if (
        result.rows.length ===
        0
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
          message:
            "Хэрэглэгч идэвхгүй байна"
        });
      }

      const currentValid =
        await bcrypt.compare(
          currentPassword,
          user.password_hash
        );

      if (
        !currentValid
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Одоогийн нууц үг буруу байна"
        });
      }

      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password_hash
        );

      if (
        samePassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Шинэ нууц үг одоогийн нууц үгтэй ижил байж болохгүй"
        });
      }

      const hash =
        await bcrypt.hash(
          newPassword,
          12
        );

      const update =
        await pool.query(
          `
          UPDATE public.dashboard_users
          SET
            password_hash = $1,
            must_change_password = false,
            token_version =
              token_version + 1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            email,
            role,
            must_change_password,
            is_active,
            token_version
          `,
          [
            hash,
            req.user.id
          ]
        );

      const updatedUser =
        update.rows[0];

      const token =
        createToken(
          updatedUser
        );

      return res.json({
        success: true,
        token,
        user: {
          id:
            Number(
              updatedUser.id
            ),
          email:
            updatedUser.email,
          role:
            updatedUser.role,
          must_change_password:
            false
        }
      });
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    }
  }
);

router.get(
  "/users",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            email,
            role,
            must_change_password,
            is_active,
            created_at,
            updated_at
          FROM public.dashboard_users
          ORDER BY created_at DESC
          `
        );

      return res.json({
        success: true,
        users:
          result.rows.map(
            (user) => ({
              ...user,
              id:
                Number(
                  user.id
                ),
              must_change_password:
                Boolean(
                  user
                    .must_change_password
                ),
              is_active:
                Boolean(
                  user.is_active
                )
            })
          )
      });
    } catch (error) {
      console.error(
        "GET USERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    }
  }
);

router.post(
  "/users",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const email =
        String(
          req.body.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body.password ||
            ""
        );

      const role =
        req.body.role ===
        "admin"
          ? "admin"
          : "viewer";

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "И-мэйл болон түр нууц үг шаардлагатай"
        });
      }

      if (
        password.length <
        10
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Түр нууц үг хамгийн багадаа 10 тэмдэгт байна"
        });
      }

      const existing =
        await pool.query(
          `
          SELECT id
          FROM public.dashboard_users
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [email]
        );

      if (
        existing.rows.length >
        0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Энэ и-мэйл бүртгэлтэй байна"
        });
      }

      const hash =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await pool.query(
          `
          INSERT INTO public.dashboard_users (
            email,
            password_hash,
            role,
            is_verified,
            must_change_password,
            is_active,
            token_version,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            true,
            true,
            true,
            0,
            NOW(),
            NOW()
          )
          RETURNING
            id,
            email,
            role,
            must_change_password,
            is_active,
            created_at,
            updated_at
          `,
          [
            email,
            hash,
            role
          ]
        );

      return res.status(201).json({
        success: true,
        user:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "CREATE USER ERROR:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Энэ и-мэйл бүртгэлтэй байна"
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    }
  }
);

router.patch(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const userId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user id"
        });
      }

      if (
        userId ===
        Number(
          req.user.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Өөрийн эрх эсвэл төлөвийг өөрчлөх боломжгүй"
        });
      }

      const currentResult =
        await pool.query(
          `
          SELECT
            id,
            role,
            is_active
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [userId]
        );

      if (
        currentResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found"
        });
      }

      const current =
        currentResult.rows[0];

      if (
        current.role ===
          "admin" &&
        req.body.is_active ===
          false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Өөр админыг идэвхгүй болгох боломжгүй"
        });
      }

      const role =
        req.body.role ===
        undefined
          ? current.role
          : req.body.role ===
              "admin"
            ? "admin"
            : "viewer";

      const isActive =
        req.body.is_active ===
        undefined
          ? Boolean(
              current.is_active
            )
          : Boolean(
              req.body
                .is_active
            );

      const result =
        await pool.query(
          `
          UPDATE public.dashboard_users
          SET
            role = $1,
            is_active = $2,
            token_version =
              CASE
                WHEN role <> $1
                  OR is_active <> $2
                THEN token_version + 1
                ELSE token_version
              END,
            updated_at = NOW()
          WHERE id = $3
          RETURNING
            id,
            email,
            role,
            must_change_password,
            is_active,
            created_at,
            updated_at
          `,
          [
            role,
            isActive,
            userId
          ]
        );

      return res.json({
        success: true,
        user:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "UPDATE USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    }
  }
);

router.post(
  "/users/:id/reset-password",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const userId =
        Number(
          req.params.id
        );

      const password =
        String(
          req.body.password ||
            ""
        );

      if (
        !Number.isInteger(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user id"
        });
      }

      if (
        password.length <
        10
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Түр нууц үг хамгийн багадаа 10 тэмдэгт байна"
        });
      }

      const targetResult =
        await pool.query(
          `
          SELECT
            id,
            role
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [userId]
        );

      if (
        targetResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found"
        });
      }

      const target =
        targetResult.rows[0];

      if (
        target.role ===
          "admin" &&
        userId !==
          Number(
            req.user.id
          )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Өөр админы нууц үгийг шинэчлэх боломжгүй"
        });
      }

      const hash =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await pool.query(
          `
          UPDATE public.dashboard_users
          SET
            password_hash = $1,
            must_change_password = true,
            token_version =
              token_version + 1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            email,
            role,
            must_change_password,
            is_active,
            updated_at
          `,
          [
            hash,
            userId
          ]
        );

      return res.json({
        success: true,
        user:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    }
  }
);

export default router;