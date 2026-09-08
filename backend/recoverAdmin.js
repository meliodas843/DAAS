import crypto from "crypto";
import bcrypt from "bcryptjs";

import pool from "../db.js";

function generateTemporaryPassword() {
  const upper =
    "ABCDEFGHJKLMNPQRSTUVWXYZ";

  const lower =
    "abcdefghijkmnopqrstuvwxyz";

  const numbers =
    "23456789";

  const special =
    "!@#$%^&*_-+=";

  const all =
    upper +
    lower +
    numbers +
    special;

  const characters = [
    upper[
      crypto.randomInt(
        upper.length
      )
    ],

    lower[
      crypto.randomInt(
        lower.length
      )
    ],

    numbers[
      crypto.randomInt(
        numbers.length
      )
    ],

    special[
      crypto.randomInt(
        special.length
      )
    ]
  ];

  while (
    characters.length <
    20
  ) {
    characters.push(
      all[
        crypto.randomInt(
          all.length
        )
      ]
    );
  }

  for (
    let i =
      characters.length -
      1;
    i > 0;
    i -= 1
  ) {
    const j =
      crypto.randomInt(
        i + 1
      );

    [
      characters[i],
      characters[j]
    ] = [
      characters[j],
      characters[i]
    ];
  }

  return characters.join("");
}

async function main() {
  const email =
    String(
      process.argv[2] ||
        ""
    )
      .trim()
      .toLowerCase();

  if (!email) {
    console.error(
      "Usage: npm run recover-admin -- admin@example.com"
    );

    process.exitCode = 1;

    return;
  }

  const target =
    await pool.query(
      `
      SELECT
        id,
        email,
        role
      FROM public.dashboard_users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

  if (
    target.rows.length ===
    0
  ) {
    console.error(
      "Admin not found"
    );

    process.exitCode = 1;

    return;
  }

  const user =
    target.rows[0];

  if (
    String(
      user.role || ""
    )
      .trim()
      .toLowerCase() !==
    "admin"
  ) {
    console.error(
      "Target account is not an admin"
    );

    process.exitCode = 1;

    return;
  }

  const temporaryPassword =
    generateTemporaryPassword();

  const passwordHash =
    await bcrypt.hash(
      temporaryPassword,
      12
    );

  await pool.query(
    `
    UPDATE public.dashboard_users
    SET
      password_hash = $1,

      must_change_password = true,

      failed_login_attempts = 0,

      is_blocked = false,

      blocked_at = NULL,

      is_active = true,

      token_version =
        COALESCE(
          token_version,
          0
        ) + 1,

      updated_at = NOW()

    WHERE id = $2
    `,
    [
      passwordHash,
      Number(user.id)
    ]
  );

  console.log(
    "Admin recovered successfully."
  );

  console.log(
    `Email: ${user.email}`
  );

  console.log(
    `Temporary password: ${temporaryPassword}`
  );

  console.log(
    "The admin must change this password immediately after login."
  );
}

try {
  await main();
} catch (error) {
  console.error(
    "Admin recovery failed:",
    error
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}