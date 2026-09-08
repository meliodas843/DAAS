import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  fileURLToPath,
} from "url";

import pool from "../db.js";

import {
  requireAuth,
  requirePasswordChanged,
} from "../middleware/auth.js";

const router =
  express.Router();

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const uploadsDir =
  path.resolve(
    __dirname,
    "../uploads"
  );

fs.mkdirSync(
  uploadsDir,
  {
    recursive:
      true,
  }
);

const MAX_FILE_SIZE =
  10 *
  1024 *
  1024;

const allowedClientMimeTypes =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
  ]);

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        MAX_FILE_SIZE,

      files:
        1,
    },

    fileFilter: (
      req,
      file,
      callback
    ) => {
      if (
        !allowedClientMimeTypes.has(
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
    },
  });

function detectFileType(
  buffer
) {
  if (
    !Buffer.isBuffer(
      buffer
    ) ||
    buffer.length ===
    0
  ) {
    return null;
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      mime:
        "image/jpeg",

      extension:
        ".jpg",
    };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      mime:
        "image/png",

      extension:
        ".png",
    };
  }

  if (
    buffer.length >= 12 &&
    buffer
      .subarray(
        0,
        4
      )
      .toString(
        "ascii"
      ) === "RIFF" &&
    buffer
      .subarray(
        8,
        12
      )
      .toString(
        "ascii"
      ) === "WEBP"
  ) {
    return {
      mime:
        "image/webp",

      extension:
        ".webp",
    };
  }

  if (
    buffer.length >= 5 &&
    buffer
      .subarray(
        0,
        5
      )
      .toString(
        "ascii"
      ) === "%PDF-"
  ) {
    return {
      mime:
        "application/pdf",

      extension:
        ".pdf",
    };
  }

  if (
    looksLikePlainText(
      buffer
    )
  ) {
    return {
      mime:
        "text/plain",

      extension:
        ".txt",
    };
  }

  return null;
}

function looksLikePlainText(
  buffer
) {
  const sample =
    buffer.subarray(
      0,
      Math.min(
        buffer.length,
        8192
      )
    );

  if (
    sample.includes(
      0x00
    )
  ) {
    return false;
  }

  const decoded =
    sample.toString(
      "utf8"
    );

  if (
    decoded.length ===
    0
  ) {
    return true;
  }

  const replacementCharacters =
    (
      decoded.match(
        /\uFFFD/g
      ) ||
      []
    ).length;

  return (
    replacementCharacters /
      decoded.length <
    0.01
  );
}

function cleanOriginalFileName(
  value
) {
  return path
    .basename(
      String(
        value ||
        "attachment"
      )
    )
    .replace(
      /[\r\n]/g,
      ""
    )
    .slice(
      0,
      255
    );
}

async function persistValidatedFile(
  file
) {
  if (!file) {
    return null;
  }

  const detected =
    detectFileType(
      file.buffer
    );

  if (!detected) {
    throw new Error(
      "Unsupported or invalid file content"
    );
  }

  if (
    detected.mime !==
    file.mimetype
  ) {
    throw new Error(
      "File content does not match file type"
    );
  }

  const generatedName =
    `${Date.now()}-${crypto.randomUUID()}${detected.extension}`;

  const absolutePath =
    path.join(
      uploadsDir,
      generatedName
    );

  await fs.promises.writeFile(
    absolutePath,
    file.buffer,
    {
      flag:
        "wx",
    }
  );

  return {
    fileName:
      cleanOriginalFileName(
        file.originalname
      ),

    filePath:
      `/uploads/${generatedName}`,

    storedFileName:
      generatedName,

    mimeType:
      detected.mime,
  };
}

function deleteStoredFile(
  uploadedFile
) {
  if (
    !uploadedFile
      ?.storedFileName
  ) {
    return;
  }

  const absolutePath =
    path.join(
      uploadsDir,
      uploadedFile.storedFileName
    );

  fs.promises
    .unlink(
      absolutePath
    )
    .catch(() => {});
}

router.get(
  "/support",

  requireAuth,

  requirePasswordChanged,

  async (
    req,
    res
  ) => {
    try {
      const isAdmin =
        req.user.role ===
        "admin";

      const result =
        isAdmin
          ? await pool.query(
              `
                SELECT
                  sr.*,
                  du.email,
                  du.role AS user_role

                FROM public.support_requests sr

                LEFT JOIN public.dashboard_users du
                  ON du.id = sr.user_id

                ORDER BY sr.created_at DESC
              `
            )
          : await pool.query(
              `
                SELECT
                  sr.*,
                  du.email,
                  du.role AS user_role

                FROM public.support_requests sr

                LEFT JOIN public.dashboard_users du
                  ON du.id = sr.user_id

                WHERE sr.user_id = $1

                ORDER BY sr.created_at DESC
              `,
              [
                Number(
                  req.user.id
                ),
              ]
            );

      return res.json({
        success:
          true,

        requests:
          result.rows,
      });
    } catch (error) {
      console.error(
        "LOAD SUPPORT ERROR:",
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
  "/support",

  requireAuth,

  requirePasswordChanged,

  (
    req,
    res,
    next
  ) => {
    upload.single(
      "file"
    )(
      req,
      res,
      (error) => {
        if (!error) {
          return next();
        }

        if (
          error instanceof
          multer.MulterError
        ) {
          if (
            error.code ===
            "LIMIT_FILE_SIZE"
          ) {
            return res
              .status(413)
              .json({
                success:
                  false,

                message:
                  "File size must be 10MB or less",
              });
          }

          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid file upload",
            });
        }

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              error?.message ||
              "Invalid file upload",
          });
      }
    );
  },

  async (
    req,
    res
  ) => {
    let uploadedFile =
      null;

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

      const allowedTypes =
        new Set([
          "BUG",
          "QUESTION",
          "FEEDBACK",
          "CHANGE_REQUEST",
        ]);

      if (
        !title ||
        !type ||
        !description
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Required fields are missing",
          });
      }

      if (
        title.length >
        200
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Title is too long",
          });
      }

      if (
        description.length >
        10000
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Description is too long",
          });
      }

      if (
        !allowedTypes.has(
          type
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid request type",
          });
      }

      if (
        req.file
      ) {
        uploadedFile =
          await persistValidatedFile(
            req.file
          );
      }

      const result =
        await pool.query(
          `
            INSERT INTO public.support_requests (
              user_id,
              title,
              type,
              description,
              file_name,
              file_path,
              created_at
            )

            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              NOW()
            )

            RETURNING *
          `,
          [
            Number(
              req.user.id
            ),

            title,

            type,

            description,

            uploadedFile
              ?.fileName ||
              null,

            uploadedFile
              ?.filePath ||
              null,
          ]
        );

      return res
        .status(201)
        .json({
          success:
            true,

          request:
            result.rows[0],
        });
    } catch (error) {
      deleteStoredFile(
        uploadedFile
      );

      console.error(
        "CREATE SUPPORT ERROR:",
        error
      );

      if (
        error?.message ===
          "Unsupported or invalid file content" ||
        error?.message ===
          "File content does not match file type"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              error.message,
          });
      }

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