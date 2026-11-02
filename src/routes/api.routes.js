

import { Router } from "express";

import healthRoutes from "./health.routes.js";
import eventsRoutes from "./events.routes.js";

import joinsRoutes from "./joins.routes.js";

router.use("/events", eventsRoutes);
router.use("/joins", joinsRoutes);

const router = Router();

router.use("/health", healthRoutes);
router.use("/events", eventsRoutes);

export default router;
