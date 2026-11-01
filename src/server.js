
import "dotenv/config";
import dns from "node:dns";

import app from "./app.js";

import { env } from "./config/env.js";
import { connectDB, closeDB } from "./config/db.js";
import { createIndexes } from "./config/indexes.js";

let server;

async function startServer() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    // Connect to MongoDB
    await connectDB();

    // Create required database indexes
    await createIndexes();

    // Start Express server
    server = app.listen(env.port, () => {
      console.log("-----------------------------------");
      console.log("Together API Server Started");
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`Port: ${env.port}`);
      console.log(`URL: http://localhost:${env.port}`);
      console.log("-----------------------------------");
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await closeDB();

    console.log("Server shutdown completed.");
    process.exit(0);
  } catch (error) {
    console.error("Shutdown failed:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
