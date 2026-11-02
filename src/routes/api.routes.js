
import { Router } from "express";

import healthRoutes from "./health.routes.js";
import eventsRoutes from "./events.routes.js";
import joinsRoutes from "./joins.routes.js";
import protectedRoutes from "./protected.routes.js";

const router = Router();

// Health check routes
router.use("/health", healthRoutes);

// Event routes
router.use("/events", eventsRoutes);

// Event joining routes
router.use("/joins", joinsRoutes);

// Protected API test routes
router.use("/protected", protectedRoutes);

export default router;
