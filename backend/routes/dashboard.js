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

      const refDate =
        date_to || date_from;

      const values = [];
      let index = 1;

      let activeDateFilter = "";

      if (refDate) {
        values.push(refDate);

        activeDateFilter = `
          AND (
            start_date IS NULL
            OR start_date <= $${index}::date
          )
          AND (
            end_date IS NULL
            OR end_date >= $${index}::date
          )
        `;

        index++;
      }

      let branchFilter = "";

      if (
        branch_id &&
        branch_id !== "all"
      ) {
        const branchNumber =
          Number(branch_id);

        if (
          !Number.isFinite(
            branchNumber
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid branch"
          });
        }

        values.push(
          branchNumber
        );

        branchFilter = `
          AND branch_id = $${index}
        `;

        index++;
      }

      const result =
        await pool.query(
          `
          SELECT
            COUNT(*) FILTER (
              WHERE
                is_rented = true
                AND is_active = true
                ${activeDateFilter}
                ${branchFilter}
            ) AS rented,

            COUNT(*) FILTER (
              WHERE
                category = 'rented'
                AND is_active = true
                ${activeDateFilter}
                ${branchFilter}
            ) AS total,

            COUNT(*) FILTER (
              WHERE
                category = 'rented'
                AND is_active = true
                AND is_rented = false
                ${activeDateFilter}
                ${branchFilter}
            ) AS vacant

          FROM public.partnership_registration
          `,
          values
        );

      const rented = Number(
        result.rows[0]?.rented ||
          0
      );

      const total = Number(
        result.rows[0]?.total ||
          0
      );

      const vacant = Number(
        result.rows[0]?.vacant ||
          0
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

      return res.json({
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

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);

export default router;