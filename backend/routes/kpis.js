import express from "express";
import pool from "../db.js";
import {
  BASE,
  buildFilters,
  percentageChange,
  toNumber
} from "../utils/queryHelpers.js";

const router = express.Router();

async function getKpiValues(
  dateFrom,
  dateTo,
  branchId
) {
  const filters = buildFilters(
    dateFrom,
    dateTo,
    branchId
  );

  const result = await pool.query(
    `
    SELECT
      ABS(
        COALESCE(
          SUM(
            CASE
              WHEN aa.account_type IN (
                'income',
                'income_other'
              )
              THEN aml.balance
              ELSE 0
            END
          ),
          0
        )
      ) AS revenue,

      ABS(
        COALESCE(
          SUM(
            CASE
              WHEN aa.account_type IN (
                'expense',
                'expense_direct_cost'
              )
              THEN aml.balance
              ELSE 0
            END
          ),
          0
        )
      ) AS expense,

      ABS(
        COALESCE(
          SUM(
            CASE
              WHEN
                aa.account_type = 'asset_receivable'
                AND am.move_type = 'out_invoice'
              THEN aml.amount_residual
              ELSE 0
            END
          ),
          0
        )
      ) AS receivable,

      ABS(
        COALESCE(
          SUM(
            CASE
              WHEN aa.account_type = 'liability_payable'
              THEN aml.amount_residual
              ELSE 0
            END
          ),
          0
        )
      ) AS payable

    ${BASE}
    ${filters.sql}
    `,
    filters.values
  );

  const row = result.rows[0] || {};

  const revenue = toNumber(row.revenue);
  const expense = toNumber(row.expense);
  const receivable = toNumber(row.receivable);
  const payable = toNumber(row.payable);

  return {
    revenue,
    expense,
    receivable,
    payable,
    net_profit: revenue - expense
  };
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function previousMonthRange(dateFrom) {
  const current = new Date(
    `${dateFrom}T00:00:00`
  );

  const previousFrom = new Date(
    current.getFullYear(),
    current.getMonth() - 1,
    1
  );

  const previousTo = new Date(
    current.getFullYear(),
    current.getMonth(),
    0
  );

  return {
    from: formatDate(previousFrom),
    to: formatDate(previousTo)
  };
}

function lastMonthRange(dateTo) {
  const current = new Date(
    `${dateTo}T00:00:00`
  );

  const from = new Date(
    current.getFullYear(),
    current.getMonth(),
    1
  );

  const to = new Date(
    current.getFullYear(),
    current.getMonth() + 1,
    0
  );

  return {
    from: formatDate(from),
    to: formatDate(to)
  };
}

router.get("/kpis", async (req, res) => {
  try {
    const {
      branch_id,
      date_from = "2026-01-01",
      date_to = "2026-08-31"
    } = req.query;

    const current = await getKpiValues(
      date_from,
      date_to,
      branch_id
    );

    const latestMonth = lastMonthRange(
      date_to
    );

    const previousRange = previousMonthRange(
      latestMonth.from
    );

    const latestMonthValues =
      await getKpiValues(
        latestMonth.from,
        latestMonth.to,
        branch_id
      );

    const previousMonthValues =
      await getKpiValues(
        previousRange.from,
        previousRange.to,
        branch_id
      );

    res.json({
      revenue: current.revenue,
      revenue_previous:
        previousMonthValues.revenue,
      revenue_change:
        percentageChange(
          latestMonthValues.revenue,
          previousMonthValues.revenue
        ),

      expense: current.expense,
      expense_previous:
        previousMonthValues.expense,
      expense_change:
        percentageChange(
          latestMonthValues.expense,
          previousMonthValues.expense
        ),

      receivable: current.receivable,
      receivable_previous:
        previousMonthValues.receivable,
      receivable_change:
        percentageChange(
          latestMonthValues.receivable,
          previousMonthValues.receivable
        ),

      payable: current.payable,
      payable_previous:
        previousMonthValues.payable,
      payable_change:
        percentageChange(
          latestMonthValues.payable,
          previousMonthValues.payable
        ),

      net_profit: current.net_profit,
      net_profit_previous:
        previousMonthValues.net_profit,
      net_profit_change:
        percentageChange(
          latestMonthValues.net_profit,
          previousMonthValues.net_profit
        )
    });
  } catch (error) {
    console.error("KPI ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;