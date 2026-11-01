
import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { createIndexes } from "./config/indexes.js";

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Together API Server is running.",
  });
});

// Health route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy.",
    database: "Connected",
  });
});

// Start server after successful database connection
async function startServer() {
  try {
    await connectDB();

    await createIndexes();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
