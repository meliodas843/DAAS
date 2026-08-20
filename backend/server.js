import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import pool from "./db.js";

import authRouter from "./routes/auth.js";
import kpisRouter from "./routes/kpis.js";
import dashboardRouter from "./routes/dashboard.js";
import receivablesRouter from "./routes/receivables.js";
import payablesRouter from "./routes/payables.js";
import revenueExpenseRouter from "./routes/revenueExpense.js";
import cashFlowRouter from "./routes/cashFlow.js";
import branchesRouter from "./routes/branches.js";

import {
  requireAuth,
  requirePasswordChanged,
  requireFinancialAccess
} from "./middleware/auth.js";

const app =
  express();

const PORT =
  Number(
    process.env.PORT ||
      8000
  );

app.disable(
  "x-powered-by"
);

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true
  })
);

app.use(
  express.json({
    limit: "100kb"
  })
);

app.get(
  "/api/health",
  async (req, res) => {
    try {
      await pool.query(
        "SELECT 1"
      );

      return res.json({
        success: true,
        connected: true
      });
    } catch (error) {
      console.error(
        "HEALTH ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        connected: false,
        message:
          "Database unavailable"
      });
    }
  }
);

app.use(
  "/api",
  authRouter
);

const financialGuards = [
  requireAuth,
  requirePasswordChanged,
  requireFinancialAccess
];

app.use(
  "/api",
  ...financialGuards,
  kpisRouter
);

app.use(
  "/api",
  ...financialGuards,
  dashboardRouter
);

app.use(
  "/api/ar",
  ...financialGuards,
  receivablesRouter
);

app.use(
  "/api/ap",
  ...financialGuards,
  payablesRouter
);

app.use(
  "/api",
  ...financialGuards,
  revenueExpenseRouter
);

app.use(
  "/api/cash-flow",
  ...financialGuards,
  cashFlowRouter
);

app.use(
  "/api",
  ...financialGuards,
  branchesRouter
);

app.get(
  "/",
  (req, res) => {
    return res.json({
      success: true,
      message:
        "Misheel Dashboard API"
    });
  }
);

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        "Not found"
    });
  }
);

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "UNHANDLED ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error"
    });
  }
);

app.listen(
  PORT,
  () => {
    console.log(
      `Backend running on http://localhost:${PORT}`
    );
  }
);