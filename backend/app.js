import express from "express";
import cors from "cors";
import { ApiError } from "./src/utils/ApiError.js";
import cookieParser from "cookie-parser";

const app = express();

// Reflect only origins you actually trust. CORS_ORIGIN can be a comma
// separated list, e.g. "http://localhost:5173,https://yourapp.com"
const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || [];

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ---- routes ----
import userRouter from "./src/routes/user.route.js";
import courseRouter from "./src/routes/course.route.js";
import questionRouter from "./src/routes/question.routes.js";
import paymentRouter from "./src/routes/payment.route.js";

// Kept under the same "/api" prefix (no /v1) on purpose, so the existing
// Frontend code doesn't need its request URLs touched. See README if you'd
// rather move to versioned routes.
app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/payments", paymentRouter);

app.get("/api/v1/health", (_req, res) => res.status(200).json({ status: "ok" }));

// 404 for anything that fell through
app.use((_req, _res, next) => next(new ApiError(404, "Route not found")));

// centralised error handler — every controller throws ApiError (or anything
// asyncHandler catches) and it lands here in one consistent JSON shape
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json(payload);
});

export { app };