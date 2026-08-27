import dotenv from "dotenv";

dotenv.config();

import path from "path";
import express from "express";
import cors from "cors";

import pool from "./db.js";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import kpisRouter from "./routes/kpis.js";
import dashboardRouter from "./routes/dashboard.js";
import receivablesRouter from "./routes/receivables.js";
import payablesRouter from "./routes/payables.js";
import revenueExpenseRouter from "./routes/revenueExpense.js";
import cashFlowRouter from "./routes/cashFlow.js";
import branchesRouter from "./routes/branches.js";
import supportRouter from "./routes/support.js";

import {
  requireAuth,
  requirePasswordChanged,
  requireFinancialAccess
} from "./middleware/auth.js";

const app = express();

const PORT = Number(
  process.env.PORT ||
    8000
);

app.disable(
  "x-powered-by"
);

if (
  process.env.NODE_ENV ===
  "production"
) {
  app.set(
    "trust proxy",
    1
  );
}

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept"
    ]
  })
);

app.use(
  express.json({
    limit: "100kb"
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "100kb"
  })
);

app.use(
  "/uploads",
  express.static(
    path.join(
      process.cwd(),
      "uploads"
    ),
    {
      dotfiles: "deny",
      index: false,
      fallthrough: false,

      setHeaders: (
        res
      ) => {
        res.setHeader(
          "X-Content-Type-Options",
          "nosniff"
        );
      }
    }
  )
);

app.get(
  "/api/health",
  async (
    req,
    res
  ) => {
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

app.use(
  "/api/users",
  usersRouter
);

app.use(
  "/api/support",
  supportRouter
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
  (
    req,
    res
  ) => {
    return res.json({
      success: true,
      message:
        "Misheel Dashboard API"
    });
  }
);

app.use(
  (
    req,
    res
  ) => {
    return res.status(404).json({
      success: false,
      message: "Not found"
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

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error"
    });
  }
);

async function start() {
  try {
    await pool.query(
      "SELECT 1"
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Backend running on http://localhost:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Backend startup failed:",
      error
    );

    process.exit(1);
  }
}

start();