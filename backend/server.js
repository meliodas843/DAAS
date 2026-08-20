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
  requireAuth
} from "./middleware/auth.js";

const app =
  express();

const PORT =
  Number(
    process.env.PORT ||
      8000
  );

app.use(
  cors({
    origin:
      "http://localhost:5173",
    credentials: true
  })
);

app.use(
  express.json()
);

app.get(
  "/api/health",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            NOW() AS time,
            current_database() AS database
          `
        );

      return res.json({
        success: true,
        connected: true,
        database:
          result.rows[0].database,
        time:
          result.rows[0].time
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        connected: false,
        message: error.message
      });
    }
  }
);

app.use(
  "/api",
  authRouter
);

app.use(
  "/api",
  requireAuth,
  kpisRouter
);

app.use(
  "/api",
  requireAuth,
  dashboardRouter
);

app.use(
  "/api/ar",
  requireAuth,
  receivablesRouter
);

app.use(
  "/api/ap",
  requireAuth,
  payablesRouter
);

app.use(
  "/api",
  requireAuth,
  revenueExpenseRouter
);

app.use(
  "/api/cash-flow",
  requireAuth,
  cashFlowRouter
);

app.use(
  "/api",
  requireAuth,
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
  (error, req, res, next) => {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
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