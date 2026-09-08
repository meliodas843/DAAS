import express from "express";
import bcrypt from "bcryptjs";

import pool from "../db.js";

import {
  requireAuth,
  requireAdmin,
  requirePasswordChanged
} from "../middleware/auth.js";

const router = express.Router();

const MAX_ADMINS = 2;

const PASSWORD_MESSAGE =
  "Нууц үг хамгийн багадаа 10 тэмдэгт, том үсэг, жижиг үсэг, тоо болон тусгай тэмдэг агуулсан байна";

function isStrongPassword(
  password
) {
  const value = String(
    password || ""
  );

  return (
    value.length >= 10 &&
    /\p{Lu}/u.test(value) &&
    /\p{Ll}/u.test(value) &&
    /\d/.test(value) &&
    /[^\p{L}\d\s]/u.test(value)
  );
}

function normalizeUser(row) {
  return {
    id: Number(row.id),

    display_id:
      row.display_id !== undefined &&
      row.display_id !== null
        ? Number(row.display_id)
        : null,

    email: row.email,

    role: String(
      row.role || "viewer"
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

    blocked_at:
      row.blocked_at ||
      null,

    created_at:
      row.created_at,

    updated_at:
      row.updated_at
  };
}

async function getAdminCount(
  db,
  excludeId = null
) {
  if (
    excludeId !== null
  ) {
    const result =
      await db.query(
        `
        SELECT
          COUNT(*)::int AS count
        FROM public.dashboard_users
        WHERE
          LOWER(TRIM(role)) = 'admin'
          AND is_active = true
          AND id <> $1
        `,
        [
          Number(excludeId)
        ]
      );

    return Number(
      result.rows[0]?.count ||
        0
    );
  }

  const result =
    await db.query(
      `
      SELECT
        COUNT(*)::int AS count
      FROM public.dashboard_users
      WHERE
        LOWER(TRIM(role)) = 'admin'
        AND is_active = true
      `
    );

  return Number(
    result.rows[0]?.count ||
      0
  );
}

router.use(
  requireAuth,
  requirePasswordChanged,
  requireAdmin
);

router.get(
  "/",
  async (
    req,
    res
  ) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            ROW_NUMBER() OVER (
              ORDER BY
                created_at ASC,
                id ASC
            )::int AS display_id,

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

          ORDER BY
            created_at DESC,
            id DESC
          `
        );

      return res.json({
        success: true,
        max_admins: MAX_ADMINS,

        users:
          result.rows.map(
            normalizeUser
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
  "/",
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
        String(
          req.body.role ||
            "viewer"
        )
          .trim()
          .toLowerCase();

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
        role !== "admin" &&
        role !== "viewer"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Буруу хэрэглэгчийн эрх байна"
        });
      }

      if (
        !isStrongPassword(
          password
        )
      ) {
        return res.status(400).json({
          success: false,
          code: "WEAK_PASSWORD",
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

        return res.status(409).json({
          success: false,
          message:
            "Энэ и-мэйл бүртгэлтэй байна"
        });
      }

      if (role === "admin") {
        const count =
          await getAdminCount(
            client
          );

        if (
          count >= MAX_ADMINS
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            code:
              "ADMIN_LIMIT_REACHED",
            message:
              "Админ хэрэглэгчийн тоо ихдээ 2 байна"
          });
        }
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await client.query(
          `
          INSERT INTO public.dashboard_users
          (
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
          VALUES
          (
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
            blocked_at,
            created_at,
            updated_at
          `,
          [
            email,
            passwordHash,
            role
          ]
        );

      await client.query(
        "COMMIT"
      );

      return res.status(201).json({
        success: true,

        user:
          normalizeUser(
            result.rows[0]
          )
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
        error?.code ===
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
    } finally {
      client.release();
    }
  }
);

router.patch(
  "/:id",
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
        return res.status(400).json({
          success: false,
          message:
            "Invalid user id"
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
            token_version
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          FOR UPDATE
          `,
          [userId]
        );

      if (
        currentResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "User not found"
        });
      }

      const current =
        currentResult.rows[0];

      const currentRole =
        String(
          current.role ||
            "viewer"
        )
          .trim()
          .toLowerCase();

      let nextRole =
        currentRole;

      let nextActive =
        Boolean(
          current.is_active
        );

      if (
        req.body.role !==
        undefined
      ) {
        nextRole =
          String(
            req.body.role
          )
            .trim()
            .toLowerCase();

        if (
          nextRole !== "admin" &&
          nextRole !== "viewer"
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              "Invalid role"
          });
        }
      }

      if (
        req.body.is_active !==
        undefined
      ) {
        nextActive =
          req.body.is_active ===
            true ||
          req.body.is_active ===
            "true";
      }

      if (
        userId ===
          Number(
            req.user.id
          ) &&
        (
          nextRole !==
            "admin" ||
          !nextActive
        )
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          code:
            "SELF_ADMIN_CHANGE_FORBIDDEN",
          message:
            "Өөрийн админ эрхийг хасах эсвэл өөрийгөө идэвхгүй болгох боломжгүй"
        });
      }

      if (
        currentRole !==
          "admin" &&
        nextRole ===
          "admin" &&
        nextActive
      ) {
        const count =
          await getAdminCount(
            client,
            userId
          );

        if (
          count >= MAX_ADMINS
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            code:
              "ADMIN_LIMIT_REACHED",
            message:
              "Админ хэрэглэгчийн тоо ихдээ 2 байна"
          });
        }
      }

      const securityChanged =
        currentRole !==
          nextRole ||
        Boolean(
          current.is_active
        ) !==
          nextActive;

      const tokenVersion =
        Number(
          current.token_version ||
            0
        ) +
        (
          securityChanged
            ? 1
            : 0
        );

      const result =
        await client.query(
          `
          UPDATE public.dashboard_users
          SET
            role = $1,
            is_active = $2,
            token_version = $3,
            updated_at = NOW()
          WHERE id = $4
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
          [
            nextRole,
            nextActive,
            tokenVersion,
            userId
          ]
        );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,

        message:
          "Хэрэглэгчийн эрх амжилттай шинэчлэгдлээ",

        user:
          normalizeUser(
            result.rows[0]
          )
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

      return res.status(500).json({
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
  "/:id/unblock",
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

      if (!password) {
        return res.status(400).json({
          success: false,
          message:
            "Шинэ нууц үг оруулна уу"
        });
      }

      if (
        !isStrongPassword(
          password
        )
      ) {
        return res.status(400).json({
          success: false,
          code: "WEAK_PASSWORD",
          message:
            PASSWORD_MESSAGE
        });
      }

      await client.query(
        "BEGIN"
      );

      const targetResult =
        await client.query(
          `
          SELECT
            id,
            email,
            role
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          FOR UPDATE
          `,
          [userId]
        );

      if (
        targetResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "User not found"
        });
      }

      const target =
        targetResult.rows[0];

      if (
        String(
          target.role || ""
        )
          .trim()
          .toLowerCase() ===
        "admin"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(403).json({
          success: false,
          code:
            "ADMIN_RECOVERY_RESTRICTED",
          message:
            "Админ хэрэглэгчийг Users API-аар unblock хийх боломжгүй"
        });
      }

      const hash =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await client.query(
          `
          UPDATE public.dashboard_users
          SET
            password_hash = $1,
            must_change_password = true,
            is_blocked = false,
            failed_login_attempts = 0,
            blocked_at = NULL,
            is_active = true,

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
            blocked_at,
            created_at,
            updated_at
          `,
          [
            hash,
            userId
          ]
        );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,

        message:
          "Хэрэглэгчийн блок амжилттай гарлаа",

        user:
          normalizeUser(
            result.rows[0]
          )
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "UNBLOCK USER ERROR:",
        error
      );

      return res.status(500).json({
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
  "/:id/reset-password",
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
        return res.status(400).json({
          success: false,
          message:
            "Invalid user id"
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
        String(
          target.role || ""
        )
          .trim()
          .toLowerCase() ===
        "admin"
      ) {
        return res.status(403).json({
          success: false,
          code:
            "ADMIN_PASSWORD_RESET_FORBIDDEN",
          message:
            "Админ хэрэглэгчийн нууц үгийг Users API-аар шинэчлэх боломжгүй"
        });
      }

      if (
        !isStrongPassword(
          password
        )
      ) {
        return res.status(400).json({
          success: false,
          code: "WEAK_PASSWORD",
          message:
            PASSWORD_MESSAGE
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
            blocked_at,
            created_at,
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
          normalizeUser(
            result.rows[0]
          )
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

router.delete(
  "/:id",
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
            "Өөрийн хэрэглэгчийг устгах боломжгүй"
        });
      }

      await client.query(
        "BEGIN"
      );

      const targetResult =
        await client.query(
          `
          SELECT
            id,
            email,
            role
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          FOR UPDATE
          `,
          [userId]
        );

      if (
        targetResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "User not found"
        });
      }

      const target =
        targetResult.rows[0];

      if (
        String(
          target.role || ""
        )
          .trim()
          .toLowerCase() ===
        "admin"
      ) {
        const remainingAdmins =
          await getAdminCount(
            client,
            userId
          );

        if (
          remainingAdmins < 1
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            code:
              "LAST_ADMIN_DELETE_FORBIDDEN",
            message:
              "Сүүлийн админ хэрэглэгчийг устгах боломжгүй"
          });
        }
      }

      await client.query(
        `
        DELETE FROM public.dashboard_users
        WHERE id = $1
        `,
        [userId]
      );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,
        permanently_deleted: true,

        message:
          "Хэрэглэгч бүрэн устгагдлаа",

        deleted_user: {
          id: Number(target.id),
          email: target.email,
          role: target.role
        }
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "DELETE USER ERROR:",
        error
      );

      if (
        error?.code === "23503"
      ) {
        return res.status(409).json({
          success: false,
          code:
            "USER_HAS_REFERENCES",
          message:
            "Энэ хэрэглэгчтэй холбоотой мэдээлэл байгаа тул бүрэн устгах боломжгүй байна"
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Internal server error"
      });
    } finally {
      client.release();
    }
  }
);

export default router;