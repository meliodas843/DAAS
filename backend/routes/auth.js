import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      id: Number(user.id),
      email: user.email,
      role: user.role,
      must_change_password:
        Boolean(user.must_change_password)
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h"
    }
  );
}

router.post("/auth/login", async (req, res) => {
  try {
    const email = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body.password || ""
    );

    if (!email || !password) {
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
          is_active
        FROM public.dashboard_users
        WHERE LOWER(email) = $1
        LIMIT 1
        `,
        [email]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(401).json({
        success: false,
        message:
          "И-мэйл эсвэл нууц үг буруу байна"
      });
    }

    const user =
      result.rows[0];

    if (!user.is_active) {
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

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message:
          "И-мэйл эсвэл нууц үг буруу байна"
      });
    }

    const token =
      createToken(user);

    return res.json({
      success: true,
      token,
      must_change_password:
        Boolean(
          user.must_change_password
        ),
      user: {
        id: Number(user.id),
        email: user.email,
        role: user.role,
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
      message: error.message
    });
  }
});

router.get(
  "/auth/me",
  requireAuth,
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
            is_active
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [req.user.id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const user =
        result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message:
            "Хэрэглэгч идэвхгүй байна"
        });
      }

      return res.json({
        success: true,
        user: {
          id: Number(user.id),
          email: user.email,
          role: user.role,
          must_change_password:
            Boolean(
              user.must_change_password
            )
        }
      });
    } catch (error) {
      console.error(
        "AUTH ME ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.post(
  "/auth/change-password",
  requireAuth,
  async (req, res) => {
    try {
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

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Шинэ нууц үгээ оруулна уу"
        });
      }

      if (
        newPassword.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Нууц үг хамгийн багадаа 8 тэмдэгт байна"
        });
      }

      if (
        confirmPassword &&
        newPassword !==
          confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Нууц үг таарахгүй байна"
        });
      }

      const currentResult =
        await pool.query(
          `
          SELECT
            id,
            email,
            password_hash,
            role,
            must_change_password,
            is_active
          FROM public.dashboard_users
          WHERE id = $1
          LIMIT 1
          `,
          [req.user.id]
        );

      if (
        currentResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const currentUser =
        currentResult.rows[0];

      if (!currentUser.is_active) {
        return res.status(403).json({
          success: false,
          message:
            "Хэрэглэгч идэвхгүй байна"
        });
      }

      const samePassword =
        await bcrypt.compare(
          newPassword,
          currentUser.password_hash
        );

      if (samePassword) {
        return res.status(400).json({
          success: false,
          message:
            "Шинэ нууц үг түр нууц үгтэй ижил байж болохгүй"
        });
      }

      const hash =
        await bcrypt.hash(
          newPassword,
          12
        );

      const result =
        await pool.query(
          `
          UPDATE public.dashboard_users
          SET
            password_hash = $1,
            must_change_password = false,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            email,
            role,
            must_change_password,
            is_active
          `,
          [
            hash,
            req.user.id
          ]
        );

      const user =
        result.rows[0];

      const token =
        createToken(user);

      return res.json({
        success: true,
        message:
          "Нууц үг амжилттай шинэчлэгдлээ",
        token,
        must_change_password:
          false,
        user: {
          id: Number(user.id),
          email: user.email,
          role: user.role,
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
        message: error.message
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
        users: result.rows.map(
          (user) => ({
            ...user,
            id: Number(user.id),
            must_change_password:
              Boolean(
                user.must_change_password
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
        message: error.message
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
      const email = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      const password = String(
        req.body.password || ""
      );

      const role =
        req.body.role === "admin"
          ? "admin"
          : "viewer";

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "И-мэйл оруулна уу"
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message:
            "Түр нууц үг оруулна уу"
        });
      }

      if (
        password.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Түр нууц үг хамгийн багадаа 8 тэмдэгт байна"
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
        existing.rows.length > 0
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
            NOW(),
            NOW()
          )
          RETURNING
            id,
            email,
            role,
            is_verified,
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

      const createdUser =
        result.rows[0];

      return res.status(201).json({
        success: true,
        message:
          "Хэрэглэгч амжилттай нэмэгдлээ",
        user: {
          ...createdUser,
          id: Number(
            createdUser.id
          ),
          must_change_password:
            Boolean(
              createdUser.must_change_password
            ),
          is_active:
            Boolean(
              createdUser.is_active
            )
        }
      });
    } catch (error) {
      console.error(
        "CREATE USER ERROR:",
        error
      );

      if (
        error.code === "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Энэ и-мэйл бүртгэлтэй байна"
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message
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
        !Number.isFinite(
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
        Number(req.user.id) ===
        userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Өөрийн эрх болон төлөвийг эндээс өөрчлөх боломжгүй"
        });
      }

      const currentResult =
        await pool.query(
          `
          SELECT
            id,
            email,
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
          message: "User not found"
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
              req.body.is_active
            );

      const result =
        await pool.query(
          `
          UPDATE public.dashboard_users
          SET
            role = $1,
            is_active = $2,
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
        message:
          "Хэрэглэгч шинэчлэгдлээ",
        user: {
          ...result.rows[0],
          id: Number(
            result.rows[0].id
          ),
          must_change_password:
            Boolean(
              result.rows[0]
                .must_change_password
            ),
          is_active:
            Boolean(
              result.rows[0]
                .is_active
            )
        }
      });
    } catch (error) {
      console.error(
        "UPDATE USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
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
        !Number.isFinite(
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
        password.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Түр нууц үг хамгийн багадаа 8 тэмдэгт байна"
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

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found"
        });
      }

      return res.json({
        success: true,
        message:
          "Түр нууц үг шинэчлэгдлээ",
        user: {
          ...result.rows[0],
          id: Number(
            result.rows[0].id
          ),
          must_change_password:
            true,
          is_active:
            Boolean(
              result.rows[0]
                .is_active
            )
        }
      });
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = Number(
        req.params.id
      );

      if (
        !Number.isFinite(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user id"
        });
      }

      if (
        Number(req.user.id) ===
        userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Өөрийн хэрэглэгчийг устгах боломжгүй"
        });
      }

      const result =
        await pool.query(
          `
          DELETE FROM public.dashboard_users
          WHERE id = $1
          RETURNING
            id,
            email
          `,
          [userId]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      return res.json({
        success: true,
        message:
          "Хэрэглэгч амжилттай устгагдлаа",
        user: result.rows[0]
      });
    } catch (error) {
      console.error(
        "DELETE USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;