import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import pool from "../db.js";
import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";

const router =
  express.Router();

const MAX_FAILED_LOGINS = 5;
const MAX_ADMINS = 2;

const PASSWORD_MESSAGE =
  "Нууц үг хамгийн багадаа 10 тэмдэгт, том үсэг, жижиг үсэг, тоо болон тусгай тэмдэг агуулсан байна";

const loginLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests:
      true,
    handler: (
      req,
      res
    ) => {
      return res
        .status(429)
        .json({
          success: false,
          code:
            "TOO_MANY_REQUESTS",
          message:
            "Хэт олон нэвтрэх оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу."
        });
    }
  });

function isStrongPassword(
  password
) {
  const value =
    String(
      password || ""
    );

  if (
    value.length < 10
  ) {
    return false;
  }

  const hasUppercase =
    /\p{Lu}/u.test(
      value
    );

  const hasLowercase =
    /\p{Ll}/u.test(
      value
    );

  const hasNumber =
    /\d/.test(
      value
    );

  const hasSpecial =
    /[^\p{L}\d\s]/u.test(
      value
    );

  return (
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial
  );
}

function createToken(user) {
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
      expiresIn:
        "8h",
      jwtid:
        crypto.randomUUID()
    }
  );
}

async function getActiveAdminCount(
  db = pool,
  excludeUserId = null
) {
  const params = [];

  let condition =
    `
    role = 'admin'
    AND is_active = true
    `;

  if (
    excludeUserId !== null
  ) {
    params.push(
      Number(
        excludeUserId
      )
    );

    condition +=
      ` AND id <> $1`;
  }

  const result =
    await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM public.dashboard_users
      WHERE ${condition}
      `,
      params
    );

  return Number(
    result.rows[0]?.count ||
      0
  );
}

router.post(
  "/auth/login",
  loginLimiter,
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
            is_blocked,
            failed_login_attempts,
            blocked_at,
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
        return res
          .status(401)
          .json({
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
        return res
          .status(403)
          .json({
            success: false,
            code:
              "ACCOUNT_DISABLED",
            message:
              "Хэрэглэгч идэвхгүй байна"
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
            success: false,
            code:
              "ACCOUNT_BLOCKED",
            message:
              "5 удаа амжилтгүй нэвтрэх оролдлого хийсэн тул хэрэглэгч блоклогдсон байна. Админтай холбогдоно уу."
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
          MAX_FAILED_LOGINS;

        if (
          shouldBlock
        ) {
          await pool.query(
            `
            UPDATE public.dashboard_users
            SET
              failed_login_attempts = $1,
              is_blocked = true,
              blocked_at = NOW(),
              token_version =
                token_version + 1,
              updated_at = NOW()
            WHERE id = $2
            `,
            [
              failedAttempts,
              user.id
            ]
          );

          return res
            .status(423)
            .json({
              success: false,
              code:
                "ACCOUNT_BLOCKED",
              message:
                "5 удаа нууц үг буруу оруулсан тул хэрэглэгч блоклогдлоо. Админ блок гаргана."
            });
        }

        await pool.query(
          `
          UPDATE public.dashboard_users
          SET
            failed_login_attempts = $1,
            updated_at = NOW()
          WHERE id = $2
          `,
          [
            failedAttempts,
            user.id
          ]
        );

        return res
          .status(401)
          .json({
            success: false,
            code:
              "INVALID_CREDENTIALS",
            remaining_attempts:
              MAX_FAILED_LOGINS -
              failedAttempts,
            message:
              `И-мэйл эсвэл нууц үг буруу байна. Үлдсэн оролдлого: ${
                MAX_FAILED_LOGINS -
                failedAttempts
              }`
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
        [user.id]
      );

      const refreshed =
        {
          ...user,
          failed_login_attempts:
            0,
          is_blocked:
            false
        };

      const token =
        createToken(
          refreshed
        );

      return res.json({
        success: true,
        token,
        user: {
          id:
            Number(
              refreshed.id
            ),
          email:
            refreshed.email,
          role:
            refreshed.role,
          must_change_password:
            Boolean(
              refreshed.must_change_password
            )
        }
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res
        .status(500)
        .json({
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
  async (
    req,
    res
  ) => {
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
            token_version + 1,
          updated_at = NOW()
        WHERE id = $1
        `,
        [
          req.user.id
        ]
      );

      return res.json({
        success: true
      });
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      return res
        .status(500)
        .json({
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
  async (
    req,
    res
  ) => {
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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Одоогийн нууц үгээ оруулна уу"
          });
      }

      if (
        !newPassword
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Шинэ нууц үгээ оруулна уу"
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
            success: false,
            code:
              "WEAK_PASSWORD",
            message:
              PASSWORD_MESSAGE
          });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res
          .status(400)
          .json({
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
            is_blocked,
            token_version
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [
            req.user.id
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res
          .status(401)
          .json({
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
        ) ||
        Boolean(
          user.is_blocked
        )
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Хэрэглэгчийн session хүчингүй байна"
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
        return res
          .status(400)
          .json({
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
        return res
          .status(400)
          .json({
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
            failed_login_attempts = 0,
            is_blocked = false,
            blocked_at = NULL,
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

      return res
        .status(500)
        .json({
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
            blocked_at,
            created_at,
            updated_at
          FROM public.dashboard_users
          WHERE is_active = true
          ORDER BY created_at DESC
          `
        );

      return res.json({
        success: true,
        max_admins:
          MAX_ADMINS,
        users:
          result.rows.map(
            (
              user
            ) => ({
              ...user,
              id:
                Number(
                  user.id
                ),
              must_change_password:
                Boolean(
                  user.must_change_password
                ),
              is_active:
                Boolean(
                  user.is_active
                ),
              is_blocked:
                Boolean(
                  user.is_blocked
                ),
              failed_login_attempts:
                Number(
                  user.failed_login_attempts ||
                    0
                )
            })
          )
      });
    } catch (error) {
      console.error(
        "GET USERS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
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
  async (
    req,
    res
  ) => {
    const client =
      await pool.connect();

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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "И-мэйл болон түр нууц үг шаардлагатай"
          });
      }

      if (
        !isStrongPassword(
          password
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            code:
              "WEAK_PASSWORD",
            message:
              PASSWORD_MESSAGE
          });
      }

      await client.query(
        "BEGIN"
      );

      await client.query(
        "SELECT pg_advisory_xact_lock(843210)"
      );

      const existing =
        await client.query(
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
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(409)
          .json({
            success: false,
            message:
              "Энэ и-мэйл бүртгэлтэй байна"
          });
      }

      if (
        role ===
        "admin"
      ) {
        const adminCount =
          await getActiveAdminCount(
            client
          );

        if (
          adminCount >=
          MAX_ADMINS
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res
            .status(400)
            .json({
              success: false,
              code:
                "ADMIN_LIMIT_REACHED",
              message:
                "Админ хэрэглэгчийн тоо ихдээ 2 байна"
            });
        }
      }

      const hash =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await client.query(
          `
          INSERT INTO public.dashboard_users (
            email,
            password_hash,
            role,
            is_verified,
            must_change_password,
            is_active,
            is_blocked,
            failed_login_attempts,
            blocked_at,
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
            false,
            0,
            NULL,
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
            is_blocked,
            failed_login_attempts,
            created_at,
            updated_at
          `,
          [
            email,
            hash,
            role
          ]
        );

      await client.query(
        "COMMIT"
      );

      return res
        .status(201)
        .json({
          success: true,
          user:
            result.rows[0]
        });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "CREATE USER ERROR:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Энэ и-мэйл бүртгэлтэй байна"
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error"
        });
    } finally {
      client.release();
    }
  }
);

router.patch(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (
    req,
    res
  ) => {
    const client =
      await pool.connect();

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
        return res
          .status(400)
          .json({
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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Өөрийн эрх эсвэл төлөвийг өөрчлөх боломжгүй"
          });
      }

      await client.query(
        "BEGIN"
      );

      await client.query(
        "SELECT pg_advisory_xact_lock(843210)"
      );

      const currentResult =
        await client.query(
          `
          SELECT
            id,
            role,
            is_active,
            is_blocked
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [userId]
        );

      if (
        currentResult.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(404)
          .json({
            success: false,
            message:
              "User not found"
          });
      }

      const current =
        currentResult.rows[0];

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

      const becomingActiveAdmin =
        role ===
          "admin" &&
        isActive;

      if (
        becomingActiveAdmin
      ) {
        const otherAdmins =
          await getActiveAdminCount(
            client,
            userId
          );

        if (
          otherAdmins >=
          MAX_ADMINS
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res
            .status(400)
            .json({
              success: false,
              code:
                "ADMIN_LIMIT_REACHED",
              message:
                "Админ хэрэглэгчийн тоо ихдээ 2 байна"
            });
        }
      }

      const result =
        await client.query(
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
            is_blocked,
            failed_login_attempts,
            blocked_at,
            token_version,
            created_at,
            updated_at
          `,
          [
            role,
            isActive,
            userId
          ]
        );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,
        user:
          result.rows[0]
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "UPDATE USER ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error"
        });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/users/:id/unblock",
  requireAuth,
  requireAdmin,
  async (
    req,
    res
  ) => {
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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid user id"
          });
      }

      const result =
        await pool.query(
          `
          UPDATE public.dashboard_users
          SET
            is_blocked = false,
            failed_login_attempts = 0,
            blocked_at = NULL,
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            email,
            role,
            must_change_password,
            is_active,
            is_blocked,
            failed_login_attempts,
            blocked_at,
            created_at,
            updated_at
          `,
          [userId]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "User not found"
          });
      }

      return res.json({
        success: true,
        message:
          "Хэрэглэгчийн блок гарлаа",
        user:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "UNBLOCK USER ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error"
        });
    }
  }
);

router.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (
    req,
    res
  ) => {
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
        return res
          .status(400)
          .json({
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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Өөрийн хэрэглэгчийг хасах боломжгүй"
          });
      }

      const result =
        await pool.query(
          `
          UPDATE public.dashboard_users
          SET
            is_active = false,
            token_version =
              token_version + 1,
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            email,
            role,
            is_active,
            token_version
          `,
          [userId]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "User not found"
          });
      }

      return res.json({
        success: true,
        message:
          "Хэрэглэгч хасагдлаа",
        user:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "DELETE USER ERROR:",
        error
      );

      return res
        .status(500)
        .json({
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
  async (
    req,
    res
  ) => {
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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid user id"
          });
      }

      if (
        !isStrongPassword(
          password
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            code:
              "WEAK_PASSWORD",
            message:
              PASSWORD_MESSAGE
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
        targetResult.rows
          .length === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "User not found"
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
            failed_login_attempts = 0,
            is_blocked = false,
            blocked_at = NULL,
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
            is_blocked,
            failed_login_attempts,
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

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error"
        });
    }
  }
);

export default router;