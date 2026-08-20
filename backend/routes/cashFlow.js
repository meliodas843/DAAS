import express from "express";
import pool from "../db.js";
import {
  BASE,
  buildFilters,
  rowsToNumbers
} from "../utils/queryHelpers.js";

const router = express.Router();

async function getActivityTotals(
  dateFrom,
  dateTo,
  branchId
) {
  const filters =
    buildFilters(
      dateFrom,
      dateTo,
      branchId
    );

  const result =
    await pool.query(
      `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN
                aa.account_type
                IN (
                  'income',
                  'income_other',
                  'expense',
                  'expense_direct_cost'
                )
              THEN
                aml.balance
              ELSE 0
            END
          ),
          0
        ) AS operating,

        COALESCE(
          SUM(
            CASE
              WHEN
                aa.account_type
                IN (
                  'liability_current',
                  'liability_non_current',
                  'equity'
                )
              THEN
                aml.balance
              ELSE 0
            END
          ),
          0
        ) AS financing,

        COALESCE(
          SUM(
            CASE
              WHEN
                aa.account_type
                NOT IN (
                  'income',
                  'income_other',
                  'expense',
                  'expense_direct_cost',
                  'liability_current',
                  'liability_non_current',
                  'equity'
                )
              THEN
                aml.balance
              ELSE 0
            END
          ),
          0
        ) AS investing

      ${BASE}
      ${filters.sql}
      `,
      filters.values
    );

  const row =
    result.rows[0] ||
    {};

  return {
    operating:
      Number(
        row.operating ||
          0
      ),
    financing:
      Number(
        row.financing ||
          0
      ),
    investing:
      Number(
        row.investing ||
          0
      )
  };
}

router.get(
  "/summary",
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
              SUM(
                CASE
                  WHEN
                    aa.account_type
                    IN (
                      'asset_cash',
                      'asset_current'
                    )
                  THEN
                    aml.balance
                  ELSE 0
                END
              ),
              0
            ) AS balance

          ${BASE}
          ${filters.sql}
          `,
          filters.values
        );

      const balance =
        Number(
          result.rows[0]
            ?.balance ||
            0
        );

      const activities =
        await getActivityTotals(
          date_from,
          date_to,
          branch_id
        );

      const total =
        activities.operating +
        activities.financing +
        activities.investing;

      return res.json({
        total,
        balance,
        operating:
          activities.operating,
        financing:
          activities.financing,
        investing:
          activities.investing
      });
    } catch (error) {
      console.error(
        "CASH SUMMARY ERROR:",
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
  "/by_month",
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
              'YYYY-MM'
            ) AS name,

            SUM(
              aml.balance
            ) AS value

          ${BASE}
          ${filters.sql}

          AND
            aa.account_type
            IN (
              'asset_cash',
              'asset_current'
            )

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
        rowsToNumbers(
          result.rows
        )
      );
    } catch (error) {
      console.error(
        "CASH MONTH ERROR:",
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
  "/by_branch",
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

            SUM(
              aml.balance
            ) AS value

          ${BASE}
          ${filters.sql}

          AND
            aa.account_type
            IN (
              'asset_cash',
              'asset_current'
            )

          GROUP BY
            rb.name

          HAVING
            SUM(
              aml.balance
            ) <> 0

          ORDER BY
            ABS(
              SUM(
                aml.balance
              )
            ) DESC
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
        "CASH BRANCH ERROR:",
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
  "/by_account",
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
              'asset_cash',
              'asset_current'
            )

          GROUP BY
            aa.name

          HAVING
            SUM(
              aml.balance
            ) <> 0

          ORDER BY
            ABS(
              SUM(
                aml.balance
              )
            ) DESC
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
        "CASH ACCOUNT ERROR:",
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
  "/by_activity",
  async (req, res) => {
    try {
      const {
        date_from = "2026-01-01",
        date_to,
        branch_id
      } = req.query;

      const activities =
        await getActivityTotals(
          date_from,
          date_to,
          branch_id
        );

      return res.json([
        {
          name: "operating",
          value:
            activities.operating
        },
        {
          name: "financing",
          value:
            activities.financing
        },
        {
          name: "investing",
          value:
            activities.investing
        }
      ]);
    } catch (error) {
      console.error(
        "CASH ACTIVITY ERROR:",
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