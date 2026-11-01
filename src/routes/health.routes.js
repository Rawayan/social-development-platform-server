
import { Router } from "express";

import { getDB } from "../config/db.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const db = await getDB();

    await db.command({ ping: 1 });

    res.status(200).json({
      success: true,
      message: "Together API is healthy.",
      database: "Connected",
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
