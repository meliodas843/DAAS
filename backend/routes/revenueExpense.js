import express from "express";
import pool from "../db.js";
import {
  BASE,
  buildFilters,
  rowsToNumbers
} from "../utils/queryHelpers.js";

const router = express.Router();

router.get(
  "/revenue",
  async (req, res) => {
    try {
      const {
        date_from = "2026-01-01",
        date_to,
        branch_id
      } = req.query;

      const filters =
        buildFilters(
          date_from,
          date_to,
          branch_id
        );

      const result =
        await pool.query(
          `
          SELECT
            TO_CHAR(
              DATE_TRUNC(
                'month',
                aml.date
              ),
              'MM'
            ) AS month,

            ABS(
              COALESCE(
                SUM(
                  CASE
                    WHEN
                      aa.account_type
                      IN (
                        'income',
                        'income_other'
                      )
                    THEN
                      aml.balance
                    ELSE 0
                  END
                ),
                0
              )
            ) AS revenue,

            COALESCE(
              SUM(
                CASE
                  WHEN
                    aa.account_type
                    IN (
                      'expense',
                      'expense_direct_cost'
                    )
                  THEN
                    aml.balance
                  ELSE 0
                END
              ),
              0
            ) AS expense

          ${BASE}
          ${filters.sql}

          GROUP BY
            DATE_TRUNC(
              'month',
              aml.date
            )

          ORDER BY
            DATE_TRUNC(
              'month',
              aml.date
            )
          `,
          filters.values
        );

      return res.json(
        result.rows.map(
          (row) => {
            const revenue =
              Number(
                row.revenue ||
                  0
              );

            const expense =
              Number(
                row.expense ||
                  0
              );

            return {
              month:
                String(
                  row.month
                ).replace(
                  /^0/,
                  ""
                ),
              revenue,
              expense,
              profit:
                revenue -
                expense
            };
          }
        )
      );
    } catch (error) {
      console.error(
        "REVENUE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);

router.get(
  "/income/by_account",
  async (req, res) => {
    try {
      const {
        date_from = "2026-01-01",
        date_to,
        branch_id
      } = req.query;

      const filters =
        buildFilters(
          date_from,
          date_to,
          branch_id
        );

      const result =
        await pool.query(
          `
          SELECT
            COALESCE(
              aa.name->>'mn_MN',
              aa.name->>'en_US',
              aa.name::text
            ) AS name,

            ABS(
              SUM(
                aml.balance
              )
            ) AS value

          ${BASE}
          ${filters.sql}

          AND
            aa.account_type
            IN (
              'income',
              'income_other'
            )

          GROUP BY
            aa.name

          HAVING
            ABS(
              SUM(
                aml.balance
              )
            ) > 0

          ORDER BY
            value DESC

          LIMIT 20
          `,
          filters.values
        );

      return res.json(
        rowsToNumbers(
          result.rows
        )
      );
    } catch (error) {
      console.error(
        "INCOME BY ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);

router.get(
  "/expense/by_group",
  async (req, res) => {
    try {
      const {
        date_from = "2026-01-01",
        date_to,
        branch_id
      } = req.query;

      const filters =
        buildFilters(
          date_from,
          date_to,
          branch_id
        );

      const result =
        await pool.query(
          `
          SELECT
            COALESCE(
              aa.name->>'mn_MN',
              aa.name->>'en_US',
              aa.name::text,
              'Бусад'
            ) AS name,

            SUM(
              aml.balance
            ) AS value

          ${BASE}
          ${filters.sql}

          AND
            aa.account_type
            IN (
              'expense',
              'expense_direct_cost'
            )

          GROUP BY
            aa.name

          HAVING
            SUM(
              aml.balance
            ) > 0

          ORDER BY
            value DESC

          LIMIT 20
          `,
          filters.values
        );

      return res.json(
        rowsToNumbers(
          result.rows
        )
      );
    } catch (error) {
      console.error(
        "EXPENSE BY GROUP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);

router.get(
  "/expense/by_account",
  async (req, res) => {
    try {
      const {
        date_from = "2026-01-01",
        date_to,
        branch_id
      } = req.query;

      const filters =
        buildFilters(
          date_from,
          date_to,
          branch_id
        );

      const result =
        await pool.query(
          `
          SELECT
            COALESCE(
              aa.name->>'mn_MN',
              aa.name->>'en_US',
              aa.name::text
            ) AS name,

            SUM(
              aml.balance
            ) AS value

          ${BASE}
          ${filters.sql}

          AND
            aa.account_type
            IN (
              'expense',
              'expense_direct_cost'
            )

          GROUP BY
            aa.name

          HAVING
            SUM(
              aml.balance
            ) > 0

          ORDER BY
            value DESC

          LIMIT 20
          `,
          filters.values
        );

      return res.json(
        rowsToNumbers(
          result.rows
        )
      );
    } catch (error) {
      console.error(
        "EXPENSE BY ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);

router.get(
  "/income_expense/by_branch",
  async (req, res) => {
    try {
      const {
        date_from = "2026-01-01",
        date_to,
        branch_id
      } = req.query;

      const filters =
        buildFilters(
          date_from,
          date_to,
          branch_id
        );

      const result =
        await pool.query(
          `
          SELECT
            COALESCE(
              rb.name->>'mn_MN',
              rb.name->>'en_US',
              'Тодорхойгүй'
            ) AS name,

            ABS(
              COALESCE(
                SUM(
                  CASE
                    WHEN
                      aa.account_type
                      IN (
                        'income',
                        'income_other'
                      )
                    THEN
                      aml.balance
                    ELSE 0
                  END
                ),
                0
              )
            ) AS revenue,

            COALESCE(
              SUM(
                CASE
                  WHEN
                    aa.account_type
                    IN (
                      'expense',
                      'expense_direct_cost'
                    )
                  THEN
                    aml.balance
                  ELSE 0
                END
              ),
              0
            ) AS expense

          ${BASE}
          ${filters.sql}

          GROUP BY
            rb.name

          HAVING
            ABS(
              COALESCE(
                SUM(
                  CASE
                    WHEN
                      aa.account_type
                      IN (
                        'income',
                        'income_other'
                      )
                    THEN
                      aml.balance
                    ELSE 0
                  END
                ),
                0
              )
            ) > 0

            OR

            ABS(
              COALESCE(
                SUM(
                  CASE
                    WHEN
                      aa.account_type
                      IN (
                        'expense',
                        'expense_direct_cost'
                      )
                    THEN
                      aml.balance
                    ELSE 0
                  END
                ),
                0
              )
            ) > 0

          ORDER BY
            revenue DESC
          `,
          filters.values
        );

      return res.json(
        result.rows.map(
          (row) => ({
            name:
              row.name,
            revenue:
              Number(
                row.revenue ||
                  0
              ),
            expense:
              Number(
                row.expense ||
                  0
              )
          })
        )
      );
    } catch (error) {
      console.error(
        "INCOME EXPENSE BY BRANCH ERROR:",
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