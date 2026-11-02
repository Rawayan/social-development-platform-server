
import { Router } from "express";

import { getCollections } from "../config/collections.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// Public API: Get the 6 nearest upcoming events
router.get(
  "/recent",
  asyncHandler(async (req, res) => {
    const { events } = await getCollections();

    const now = new Date().toISOString();

    const recentEvents = await events
      .find({
        eventDate: {
          $gte: now,
        },
      })
      .sort({
        eventDate: 1,
        createdAt: -1,
      })
      .limit(6)
      .toArray();

    const formattedEvents = recentEvents.map((event) => ({
      ...event,
      _id: event._id.toString(),
    }));

    res.status(200).json({
      success: true,
      message: "Recent upcoming events retrieved successfully.",
      count: formattedEvents.length,
      data: formattedEvents,
    });
  })
);

export default router;
