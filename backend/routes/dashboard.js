import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get(
  "/area_stats",
  async (req, res) => {
    try {
      const {
        date_from = "2026-01-01",
        date_to,
        branch_id
      } = req.query;

      const values = [];
      const conditions = [];

      if (date_from) {
        values.push(
          date_from
        );

        const fromIndex =
          values.length;

        conditions.push(`
          (
            end_date IS NULL
            OR end_date >= $${fromIndex}::date
          )
        `);
      }

      if (date_to) {
        values.push(
          date_to
        );

        const toIndex =
          values.length;

        conditions.push(`
          (
            start_date IS NULL
            OR start_date <= $${toIndex}::date
          )
        `);
      }

      if (
        branch_id &&
        branch_id !== "all"
      ) {
        const branchNumber =
          Number(
            branch_id
          );

        if (
          !Number.isInteger(
            branchNumber
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid branch"
            });
        }

        values.push(
          branchNumber
        );

        const branchIndex =
          values.length;

        conditions.push(`
          branch_id = $${branchIndex}
        `);
      }

      const whereClause =
        conditions.length > 0
          ? `WHERE ${conditions.join(
              " AND "
            )}`
          : "";

      console.log(
        "AREA STATS FILTER:",
        {
          date_from,
          date_to,
          branch_id
        }
      );

      const result =
        await pool.query(
          `
            WITH filtered_rows AS (
              SELECT *
              FROM public.partnership_registration

              ${whereClause}
            )

            SELECT
              COUNT(*) FILTER (
                WHERE
                  category = 'rented'
                  AND is_rented = true
                  AND is_active = true
              )::int AS rented,

              COUNT(*) FILTER (
                WHERE
                  category = 'rented'
                  AND is_active = true
              )::int AS total,

              COUNT(*) FILTER (
                WHERE
                  category = 'rented'
                  AND is_active = true
                  AND is_rented = false
              )::int AS vacant

            FROM filtered_rows
          `,
          values
        );

      const row =
        result.rows[0] || {};

      const rented =
        Number(
          row.rented ?? 0
        );

      const total =
        Number(
          row.total ?? 0
        );

      const vacant =
        Number(
          row.vacant ?? 0
        );

      const utilization =
        total > 0
          ? Number(
              (
                (
                  rented /
                  total
                ) *
                100
              ).toFixed(2)
            )
          : 0;

      console.log(
        "AREA STATS RESULT:",
        {
          rented,
          total,
          vacant,
          utilization
        }
      );

      return res.json({
        success: true,
        rented,
        total,
        vacant,
        utilization
      });
    } catch (error) {
      console.error(
        "AREA STATS ERROR:",
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