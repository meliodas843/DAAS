import dotenv from "dotenv";

dotenv.config();

import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

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
  requireFinancialAccess,
} from "./middleware/auth.js";

const app = express();

const isProduction =
  process.env.NODE_ENV === "production";

const frontendUrl =
  process.env.FRONTEND_URL ||
  (!isProduction
    ? "http://localhost:5173"
    : "");

if (!frontendUrl) {
  throw new Error(
    "FRONTEND_URL is required in production"
  );
}

const PORT =
  Number(
    process.env.PORT || 8000
  );

app.disable("x-powered-by");

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "same-site",
    },
  })
);

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Accept",
    ],
  })
);

app.use(cookieParser());

app.use(
  express.json({
    limit: "100kb",
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "100kb",
  })
);

const apiLimiter =
  rateLimit({
    windowMs: 60_000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests",
    },
  });

app.use(
  "/api",
  apiLimiter
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
      setHeaders: (res) => {
        res.setHeader(
          "X-Content-Type-Options",
          "nosniff"
        );

        res.setHeader(
          "Content-Disposition",
          "attachment"
        );
      },
    }
  )
);

app.get(
  "/api/health",
  async (req, res) => {
    try {
      await pool.query(
        "SELECT 1"
      );

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error(
        "HEALTH ERROR:",
        error
      );

      return res.status(503).json({
        success: false,
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

app.use(
  "/api",
  (req, res, next) => {
    const datePattern =
      /^\d{4}-\d{2}-\d{2}$/;

    for (const key of [
      "date_from",
      "date_to",
    ]) {
      const value =
        req.query[key];

      if (
        value &&
        !datePattern.test(
          String(value)
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              `Invalid ${key} format`,
          });
      }
    }

    if (
      req.query.branch_id &&
      req.query.branch_id !==
        "all"
    ) {
      const branchId =
        Number(
          req.query.branch_id
        );

      if (
        !Number.isSafeInteger(
          branchId
        ) ||
        branchId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid branch_id",
          });
      }
    }

    return next();
  }
);

const financialGuards = [
  requireAuth,
  requirePasswordChanged,
  requireFinancialAccess,
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
        "Misheel Dashboard API",
    });
  }
);

app.use(
  (req, res) => {
    return res
      .status(404)
      .json({
        success: false,
        message: "Not found",
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

    if (res.headersSent) {
      return next(error);
    }

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Internal server error",
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