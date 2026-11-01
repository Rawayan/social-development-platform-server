
import express from "express";
import cors from "cors";

import { env } from "./config/env.js";

import apiRoutes from "./routes/api.routes.js";

import { requestLogger } from "./middlewares/request-logger.js";
import { notFound } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header,
      // such as Postman and server-to-server requests.
      if (!origin || env.clientUrls.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("CORS: Origin not allowed.");
      error.statusCode = 403;

      return callback(error);
    },
    credentials: true,
  })
);

// Request body parsing
app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// Custom middleware
app.use(requestLogger);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "Together API",
    message: "Community Development Platform API is running.",
    version: "1.0.0",
  });
});

// API routes
app.use("/api", apiRoutes);

// Handle unknown routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
