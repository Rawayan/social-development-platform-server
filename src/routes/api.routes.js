

import { Router } from "express";

import healthRoutes from "./health.routes.js";
import eventsRoutes from "./events.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/events", eventsRoutes);

export default router;
