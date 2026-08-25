import express from "express";
import bcrypt from "bcryptjs";

import pool from "../db.js";

import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";

const router =
  express.Router();

const MAX_ADMINS = 2;

const PASSWORD_MESSAGE =
  "Нууц үг хамгийн багадаа 10 тэмдэгт, том үсэг, жижиг үсэг, тоо болон тусгай тэмдэг агуулсан байна";

function isStrongPassword(
  password
) {
  const value =
    String(
      password || ""
    );

  return (
    value.length >= 10 &&
    /[A-Z]/.test(
      value
    ) &&
    /[a-z]/.test(
      value
    ) &&
    /\d/.test(
      value
    ) &&
    /[^A-Za-z0-9\s]/.test(
      value
    )
  );
}

async function getActiveAdminCount(
  db = pool,
  excludeUserId = null
) {
  if (
    excludeUserId !== null &&
    excludeUserId !== undefined
  ) {
    const result =
      await db.query(
        `
        SELECT
          COUNT(*)::int AS count
        FROM public.dashboard_users
        WHERE
          role = 'admin'
          AND is_active = true
          AND id <> $1
        `,
        [
          Number(
            excludeUserId
          )
        ]
      );

    return Number(
      result.rows[0]
        ?.count || 0
    );
  }

  const result =
    await db.query(
      `
      SELECT
        COUNT(*)::int AS count
      FROM public.dashboard_users
      WHERE
        role = 'admin'
        AND is_active = true
      `
    );

  return Number(
    result.rows[0]
      ?.count || 0
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

    display_id:
      row.display_id !==
        undefined &&
      row.display_id !==
        null
        ? Number(
            row.display_id
          )
        : null,

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

    blocked_at:
      row.blocked_at ||
      null,

    created_at:
      row.created_at,

    updated_at:
      row.updated_at
  };
}

router.use(
  requireAuth,
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

        max_admins:
          MAX_ADMINS,

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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "И-мэйл болон түр нууц үг шаардлагатай"
          });
      }

      if (
        role !== "admin" &&
        role !== "viewer"
      ) {
        return res
          .status(400)
          .json({
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
          SELECT
            id
          FROM public.dashboard_users
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [
            email
          ]
        );

      if (
        existing.rows
          .length > 0
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
        role === "admin"
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

      const passwordHash =
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

      return res
        .status(201)
        .json({
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
  "/:id",
  async (req, res) => {
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

      const targetResult =
        await client.query(
          `
          SELECT
            id,
            email,
            role,
            is_active,
            is_blocked,
            must_change_password,
            failed_login_attempts,
            blocked_at,
            token_version,
            created_at,
            updated_at
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [
            userId
          ]
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

      const current =
        targetResult.rows[0];

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
          ![
            "admin",
            "viewer"
          ].includes(
            nextRole
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid role"
            });
        }
      }

      if (
        req.body
          .is_active !==
        undefined
      ) {
        nextActive =
          Boolean(
            req.body
              .is_active
          );
      }

      await client.query(
        "BEGIN"
      );

      await client.query(
        "SELECT pg_advisory_xact_lock(843210)"
      );

      if (
        currentRole !==
          "admin" &&
        nextRole ===
          "admin"
      ) {
        const adminResult =
          await client.query(
            `
            SELECT
              COUNT(*)::int AS count
            FROM public.dashboard_users
            WHERE
              role = 'admin'
              AND is_active = true
            `
          );

        const adminCount =
          Number(
            adminResult.rows[0]
              ?.count || 0
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

      const result =
        await client.query(
          `
          UPDATE public.dashboard_users
          SET
            role = $1,
            is_active = $2,
            token_version =
              CASE
                WHEN role IS DISTINCT FROM $1
                  OR is_active IS DISTINCT FROM $2
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
            nextRole,
            nextActive,
            userId
          ]
        );

      await client.query(
        "COMMIT"
      );

      return res.json({
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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid user id"
          });
      }

      if (!password) {
        return res
          .status(400)
          .json({
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

      const targetResult =
        await client.query(
          `
          SELECT
            id,
            email,
            role,
            is_blocked
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          FOR UPDATE
          `,
          [
            userId
          ]
        );

      if (
        targetResult.rows
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

      const passwordHash =
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
            must_change_password = false,
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
            passwordHash,
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

      const passwordHash =
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
            passwordHash,
            userId
          ]
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
              "Өөрийн хэрэглэгчийг устгах боломжгүй"
          });
      }

      await client.query(
        "BEGIN"
      );

      const userResult =
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
          [
            userId
          ]
        );

      if (
        userResult.rows
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

      const deletingUser =
        userResult.rows[0];

      const deleteResult =
        await client.query(
          `
          DELETE FROM public.dashboard_users
          WHERE id = $1
          RETURNING
            id,
            email,
            role
          `,
          [
            userId
          ]
        );

      if (
        deleteResult.rows
          .length === 0
      ) {
        throw new Error(
          "User delete failed"
        );
      }

      const verifyResult =
        await client.query(
          `
          SELECT
            id
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [
            userId
          ]
        );

      if (
        verifyResult.rows
          .length !== 0
      ) {
        throw new Error(
          "User still exists after DELETE"
        );
      }

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,
        permanently_deleted:
          true,
        message:
          "Хэрэглэгч бүрэн устгагдлаа",
        deleted_user: {
          id:
            Number(
              deletingUser.id
            ),
          email:
            deletingUser.email,
          role:
            deletingUser.role
        }
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "PERMANENT DELETE USER ERROR:",
        error
      );

      if (
        error?.code ===
        "23503"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            code:
              "USER_HAS_REFERENCES",
            message:
              "Энэ хэрэглэгчтэй холбоотой мэдээлэл байгаа тул бүрэн устгах боломжгүй байна"
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Хэрэглэгчийг бүрэн устгахад алдаа гарлаа"
        });
    } finally {
      client.release();
    }
  }
);

export default router;