// Must be the very first import. ES module imports are hoisted and
// evaluated in order *before* any other top-level code runs, so calling
// dotenv.config() after importing "./app.js" (which transitively imports
// controllers that read process.env at module-load time, e.g. the Gemini
// API URL) would be too late — those values would already be `undefined`.
// "dotenv/config" runs dotenv.config() as a side effect the moment it's
// evaluated, so putting it first guarantees env vars are loaded before
// anything else in the import graph executes.
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./src/db/db_connect.js";
import { app } from "./app.js";

// Fail fast and loud instead of limping along with an undefined secret or
// silently-broken uploads — this used to be the kind of thing you'd only
// find out about in production.
const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GEMINI_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const server = http.createServer(app);

// Set up but not wired to any events yet — no controller currently emits
// through this. Kept as scaffolding since the original project had it;
// see README for what's needed to actually use it (e.g. real-time
// notifications when a paper finishes processing).
export const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined socket room`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      console.log(`⚙️  Server is running at port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed !!!", error);
    process.exit(1);
  });

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});