import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../db.js";

import {
  requireAuth,
} from "../middleware/auth.js";

const router =
  express.Router();

const MAX_FAILED_ATTEMPTS =
  5;

const PASSWORD_MESSAGE =
  "Нууц үг хамгийн багадаа 10 тэмдэгт, том үсэг, жижиг үсэг, тоо болон тусгай тэмдэг агуулсан байна";

const COOKIE_NAME =
  "auth_token";

const COOKIE_MAX_AGE =
  8 *
  60 *
  60 *
  1000;

function getCookieOptions() {
  const production =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly:
      true,

    secure:
      production,

    sameSite:
      production
        ? "strict"
        : "lax",

    maxAge:
      COOKIE_MAX_AGE,

    path:
      "/",
  };
}

function getClearCookieOptions() {
  const options =
    getCookieOptions();

  return {
    httpOnly:
      options.httpOnly,

    secure:
      options.secure,

    sameSite:
      options.sameSite,

    path:
      options.path,
  };
}

function isStrongPassword(
  password
) {
  const value =
    String(
      password || ""
    );

  return (
    value.length >=
      10 &&
    /\p{Lu}/u.test(
      value
    ) &&
    /\p{Ll}/u.test(
      value
    ) &&
    /\d/.test(
      value
    ) &&
    /[^\p{L}\d\s]/u.test(
      value
    )
  );
}

function normalizeUser(
  row
) {
  return {
    id:
      Number(
        row.id
      ),

    email:
      row.email,

    role:
      String(
        row.role ||
        "viewer"
      )
        .trim()
        .toLowerCase(),

    must_change_password:
      Boolean(
        row.must_change_password
      ),

    is_active:
      Boolean(
        row.is_active
      ),

    is_blocked:
      Boolean(
        row.is_blocked
      ),

    failed_login_attempts:
      Number(
        row.failed_login_attempts ||
        0
      ),
  };
}

function createToken(
  user
) {
  return jwt.sign(
    {
      id:
        Number(
          user.id
        ),

      token_version:
        Number(
          user.token_version ||
          0
        ),
    },

    process.env.JWT_SECRET,

    {
      expiresIn:
        process.env.JWT_EXPIRES_IN ||
        "8h",
    }
  );
}

router.post(
  "/auth/login",

  async (
    req,
    res
  ) => {
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
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "И-мэйл болон нууц үгээ оруулна уу",
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
              is_blocked,
              failed_login_attempts,
              blocked_at,
              token_version

            FROM public.dashboard_users

            WHERE LOWER(email) = $1

            LIMIT 1
          `,
          [
            email,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            code:
              "INVALID_CREDENTIALS",

            message:
              "И-мэйл эсвэл нууц үг буруу байна",
          });
      }

      const user =
        result.rows[0];

      if (
        !Boolean(
          user.is_active
        )
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            code:
              "ACCOUNT_DISABLED",

            message:
              "Хэрэглэгч идэвхгүй байна",
          });
      }

      if (
        Boolean(
          user.is_blocked
        )
      ) {
        return res
          .status(423)
          .json({
            success:
              false,

            code:
              "ACCOUNT_BLOCKED",

            message:
              "Хэрэглэгч блоклогдсон байна",
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
        const failedAttempts =
          Number(
            user.failed_login_attempts ||
            0
          ) + 1;

        const shouldBlock =
          failedAttempts >=
          MAX_FAILED_ATTEMPTS;

        await pool.query(
          `
            UPDATE public.dashboard_users

            SET
              failed_login_attempts = $1,

              is_blocked = $2,

              blocked_at =
                CASE
                  WHEN $2 = true
                    THEN NOW()
                  ELSE blocked_at
                END,

              token_version =
                CASE
                  WHEN $2 = true
                    THEN
                      COALESCE(
                        token_version,
                        0
                      ) + 1
                  ELSE
                    COALESCE(
                      token_version,
                      0
                    )
                END,

              updated_at =
                NOW()

            WHERE id = $3
          `,
          [
            failedAttempts,
            shouldBlock,
            Number(
              user.id
            ),
          ]
        );

        if (
          shouldBlock
        ) {
          res.clearCookie(
            COOKIE_NAME,
            getClearCookieOptions()
          );

          return res
            .status(423)
            .json({
              success:
                false,

              code:
                "ACCOUNT_BLOCKED",

              message:
                "5 удаа нууц үг буруу оруулсан тул хэрэглэгч блоклогдлоо",
            });
        }

        const remainingAttempts =
          MAX_FAILED_ATTEMPTS -
          failedAttempts;

        return res
          .status(401)
          .json({
            success:
              false,

            code:
              "INVALID_CREDENTIALS",

            remaining_attempts:
              remainingAttempts,

            message:
              `И-мэйл эсвэл нууц үг буруу байна. Үлдсэн оролдлого: ${remainingAttempts}`,
          });
      }

      await pool.query(
        `
          UPDATE public.dashboard_users

          SET
            failed_login_attempts = 0,
            is_blocked = false,
            blocked_at = NULL,
            updated_at = NOW()

          WHERE id = $1
        `,
        [
          Number(
            user.id
          ),
        ]
      );

      const refreshedResult =
        await pool.query(
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
          [
            Number(
              user.id
            ),
          ]
        );

      const refreshed =
        refreshedResult.rows[0];

      if (!refreshed) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Хэрэглэгч олдсонгүй",
          });
      }

      const token =
        createToken(
          refreshed
        );

      res.cookie(
        COOKIE_NAME,
        token,
        getCookieOptions()
      );

      return res.json({
        success:
          true,

        user:
          normalizeUser(
            refreshed
          ),
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Internal server error",
        });
    }
  }
);

router.get(
  "/auth/me",

  requireAuth,

  async (
    req,
    res
  ) => {
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
              is_blocked,
              failed_login_attempts,
              token_version

            FROM public.dashboard_users

            WHERE id = $1

            LIMIT 1
          `,
          [
            Number(
              req.user.id
            ),
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Хэрэглэгч олдсонгүй",
          });
      }

      return res.json({
        success:
          true,

        user:
          normalizeUser(
            result.rows[0]
          ),
      });
    } catch (error) {
      console.error(
        "AUTH ME ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Internal server error",
        });
    }
  }
);

router.post(
  "/auth/logout",

  requireAuth,

  async (
    req,
    res
  ) => {
    try {
      await pool.query(
        `
          UPDATE public.dashboard_users

          SET
            token_version =
              COALESCE(
                token_version,
                0
              ) + 1,

            updated_at = NOW()

          WHERE id = $1
        `,
        [
          Number(
            req.user.id
          ),
        ]
      );

      res.clearCookie(
        COOKIE_NAME,
        getClearCookieOptions()
      );

      return res.json({
        success:
          true,
      });
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Internal server error",
        });
    }
  }
);

router.post(
  "/auth/change-password",

  requireAuth,

  async (
    req,
    res
  ) => {
    try {
      const currentPassword =
        String(
          req.body.current_password ||
          ""
        );

      const newPassword =
        String(
          req.body.new_password ||
          ""
        );

      const confirmPassword =
        String(
          req.body.confirm_password ||
          ""
        );

      if (!currentPassword) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Одоогийн нууц үгээ оруулна уу",
          });
      }

      if (!newPassword) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Шинэ нууц үгээ оруулна уу",
          });
      }

      if (
        !isStrongPassword(
          newPassword
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              PASSWORD_MESSAGE,
          });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Нууц үг таарахгүй байна",
          });
      }

      const result =
        await pool.query(
          `
            SELECT
              id,
              password_hash

            FROM public.dashboard_users

            WHERE id = $1

            LIMIT 1
          `,
          [
            Number(
              req.user.id
            ),
          ]
        );

      const user =
        result.rows[0];

      if (!user) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "User not found",
          });
      }

      const currentValid =
        await bcrypt.compare(
          currentPassword,
          user.password_hash
        );

      if (!currentValid) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Одоогийн нууц үг буруу байна",
          });
      }

      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password_hash
        );

      if (samePassword) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Шинэ нууц үг хуучин нууц үгтэй ижил байж болохгүй",
          });
      }

      const passwordHash =
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
              failed_login_attempts = 0,
              is_blocked = false,
              blocked_at = NULL,

              token_version =
                COALESCE(
                  token_version,
                  0
                ) + 1,

              updated_at = NOW()

            WHERE id = $2

            RETURNING
              id,
              email,
              role,
              must_change_password,
              is_active,
              is_blocked,
              failed_login_attempts,
              token_version
          `,
          [
            passwordHash,
            Number(
              req.user.id
            ),
          ]
        );

      const updatedUser =
        update.rows[0];

      const token =
        createToken(
          updatedUser
        );

      res.cookie(
        COOKIE_NAME,
        token,
        getCookieOptions()
      );

      return res.json({
        success:
          true,

        message:
          "Нууц үг амжилттай шинэчлэгдлээ",

        user:
          normalizeUser(
            updatedUser
          ),
      });
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Internal server error",
        });
    }
  }
);

export default router;