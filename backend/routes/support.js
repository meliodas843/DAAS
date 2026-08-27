import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

import pool from "../db.js";

import {
  requireAuth,
  requirePasswordChanged
} from "../middleware/auth.js";

const router = express.Router();

router.use(
  requireAuth,
  requirePasswordChanged
);

const uploadDir =
  path.join(
    process.cwd(),
    "uploads",
    "support"
  );

fs.mkdirSync(
  uploadDir,
  {
    recursive: true
  }
);

const allowedMimeTypes =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain"
  ]);

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      callback
    ) => {
      callback(
        null,
        uploadDir
      );
    },

    filename: (
      req,
      file,
      callback
    ) => {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const name =
        `${Date.now()}-${crypto.randomUUID()}${extension}`;

      callback(
        null,
        name
      );
    }
  });

const upload =
  multer({
    storage,

    limits: {
      fileSize:
        10 *
        1024 *
        1024,

      files: 1
    },

    fileFilter: (
      req,
      file,
      callback
    ) => {
      if (
        !allowedMimeTypes.has(
          file.mimetype
        )
      ) {
        return callback(
          new Error(
            "Unsupported file type"
          )
        );
      }

      return callback(
        null,
        true
      );
    }
  });

const allowedTypes =
  new Set([
    "BUG",
    "QUESTION",
    "FEEDBACK",
    "CHANGE_REQUEST"
  ]);

function removeUploadedFile(
  file
) {
  if (
    !file?.path
  ) {
    return;
  }

  try {
    if (
      fs.existsSync(
        file.path
      )
    ) {
      fs.unlinkSync(
        file.path
      );
    }
  } catch (error) {
    console.error(
      "SUPPORT FILE CLEANUP ERROR:",
      error
    );
  }
}

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
            s.id,
            s.user_id,
            s.title,
            s.type,
            s.description,
            s.status,
            s.file_name,
            s.file_path,
            s.created_at,
            s.updated_at,

            u.email AS user_email,
            u.role AS user_role

          FROM public.support_requests s

          JOIN public.dashboard_users u
            ON u.id = s.user_id

          ORDER BY
            s.created_at DESC,
            s.id DESC
          `
        );

      return res.json({
        success: true,
        requests: result.rows
      });
    } catch (error) {
      console.error(
        "GET SUPPORT ERROR:",
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
  (
    req,
    res,
    next
  ) => {
    upload.single("file")(
      req,
      res,
      (error) => {
        if (error) {
          console.error(
            "SUPPORT UPLOAD ERROR:",
            error
          );

          return res.status(400).json({
            success: false,
            message:
              error.code ===
              "LIMIT_FILE_SIZE"
                ? "File is too large"
                : "Invalid file upload"
          });
        }

        return next();
      }
    );
  },

  async (
    req,
    res
  ) => {
    try {
      const title =
        String(
          req.body.title ||
            ""
        ).trim();

      const type =
        String(
          req.body.type ||
            ""
        )
          .trim()
          .toUpperCase();

      const description =
        String(
          req.body.description ||
            ""
        ).trim();

      if (
        !title ||
        !type ||
        !description
      ) {
        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          success: false,
          message:
            "Title, type and description are required"
        });
      }

      if (
        title.length >
        200
      ) {
        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          success: false,
          message:
            "Title is too long"
        });
      }

      if (
        description.length >
        10000
      ) {
        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          success: false,
          message:
            "Description is too long"
        });
      }

      if (
        !allowedTypes.has(
          type
        )
      ) {
        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid request type"
        });
      }

      const userId =
        Number(
          req.user.id
        );

      if (
        !Number.isInteger(
          userId
        )
      ) {
        removeUploadedFile(
          req.file
        );

        return res.status(401).json({
          success: false,
          message:
            "Invalid user"
        });
      }

      const fileName =
        req.file
          ? req.file.originalname
          : null;

      const filePath =
        req.file
          ? `/uploads/support/${req.file.filename}`
          : null;

      const result =
        await pool.query(
          `
          INSERT INTO public.support_requests
          (
            user_id,
            title,
            type,
            description,
            status,
            file_name,
            file_path
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            'open',
            $5,
            $6
          )
          RETURNING
            id,
            user_id,
            title,
            type,
            description,
            status,
            file_name,
            file_path,
            created_at,
            updated_at
          `,
          [
            userId,
            title,
            type,
            description,
            fileName,
            filePath
          ]
        );

      return res.status(201).json({
        success: true,

        request: {
          ...result.rows[0],

          user_email:
            req.user.email,

          user_role:
            req.user.role
        }
      });
    } catch (error) {
      removeUploadedFile(
        req.file
      );

      console.error(
        "CREATE SUPPORT ERROR:",
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