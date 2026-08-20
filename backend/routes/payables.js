import express from "express";
import pool from "../db.js";
import {
  BASE,
  buildFilters,
  rowsToNumbers
} from "../utils/queryHelpers.js";

const router = express.Router();

router.get("/by_branch", async (req, res) => {
  try {
    const {
      date_from = "2026-01-01",
      date_to,
      branch_id
    } = req.query;

    const filters = buildFilters(
      date_from,
      date_to,
      branch_id
    );

    const result = await pool.query(
      `
      SELECT
        COALESCE(
          rb.name->>'mn_MN',
          rb.name->>'en_US',
          'Тодорхойгүй'
        ) AS name,

        -SUM(aml.amount_residual) AS value

      ${BASE}
      ${filters.sql}

      AND aa.account_type = 'liability_payable'

      GROUP BY rb.name

      HAVING -SUM(aml.amount_residual) <> 0

      ORDER BY value DESC
      `,
      filters.values
    );

    res.json(rowsToNumbers(result.rows));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/by_account", async (req, res) => {
  try {
    const {
      date_from = "2026-01-01",
      date_to,
      branch_id
    } = req.query;

    const filters = buildFilters(
      date_from,
      date_to,
      branch_id
    );

    const result = await pool.query(
      `
      SELECT
        COALESCE(
          aa.name->>'mn_MN',
          aa.name->>'en_US',
          aa.name::text
        ) AS name,

        -SUM(aml.amount_residual) AS value

      ${BASE}
      ${filters.sql}

      AND aa.account_type = 'liability_payable'

      GROUP BY aa.name

      HAVING -SUM(aml.amount_residual) <> 0

      ORDER BY value DESC
      `,
      filters.values
    );

    res.json(rowsToNumbers(result.rows));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/by_month", async (req, res) => {
  try {
    const {
      date_from = "2026-01-01",
      date_to,
      branch_id
    } = req.query;

    const filters = buildFilters(
      date_from,
      date_to,
      branch_id
    );

    const result = await pool.query(
      `
      SELECT
        TO_CHAR(
          DATE_TRUNC('month', aml.date),
          'MM'
        ) AS name,

        -SUM(aml.amount_residual) AS value

      ${BASE}
      ${filters.sql}

      AND aa.account_type = 'liability_payable'

      GROUP BY DATE_TRUNC('month', aml.date)

      ORDER BY DATE_TRUNC('month', aml.date)
      `,
      filters.values
    );

    res.json(rowsToNumbers(result.rows));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/month_change", async (req, res) => {
  try {
    const {
      date_from = "2026-01-01",
      date_to,
      branch_id
    } = req.query;

    const filters = buildFilters(
      date_from,
      date_to,
      branch_id
    );

    const result = await pool.query(
      `
      WITH monthly AS (
        SELECT
          DATE_TRUNC('month', aml.date) AS month,
          -SUM(aml.amount_residual) AS total

        ${BASE}
        ${filters.sql}

        AND aa.account_type = 'liability_payable'

        GROUP BY DATE_TRUNC('month', aml.date)
      ),

      changes AS (
        SELECT
          month,
          total,
          total - LAG(total) OVER (
            ORDER BY month
          ) AS value
        FROM monthly
      )

      SELECT
        TO_CHAR(month, 'YYYY-MM') AS name,
        value

      FROM changes

      WHERE value IS NOT NULL

      ORDER BY month
      `,
      filters.values
    );

    res.json(rowsToNumbers(result.rows));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/aging", async (req, res) => {
  try {
    const {
      date_to,
      branch_id
    } = req.query;

    const endDate =
      date_to || new Date().toISOString().slice(0, 10);

    const values = [endDate];

    let branchFilter = "";

    if (branch_id) {
      values.push(Number(branch_id));
      branchFilter = "AND aml.branch_id = $2";
    }

    const result = await pool.query(
      `
      SELECT
        CASE
          WHEN $1::date - aml.date <= 30
            THEN '1-30 хоног'
          WHEN $1::date - aml.date <= 60
            THEN '31-60 хоног'
          WHEN $1::date - aml.date <= 90
            THEN '61-90 хоног'
          ELSE '90+ хоног'
        END AS name,

        -SUM(aml.amount_residual) AS value

      ${BASE}

      AND aml.date <= $1::date
      ${branchFilter}

      AND aa.account_type = 'liability_payable'

      GROUP BY 1
      `,
      values
    );

    const order = {
      "1-30 хоног": 1,
      "31-60 хоног": 2,
      "61-90 хоног": 3,
      "90+ хоног": 4
    };

    const rows = rowsToNumbers(result.rows);

    rows.sort(
      (a, b) =>
        (order[a.name] || 99) -
        (order[b.name] || 99)
    );

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;