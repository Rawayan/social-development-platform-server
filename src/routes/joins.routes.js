import { Router } from "express";
import { ObjectId } from "mongodb";

import { getCollections } from "../config/collections.js";
import requireAuth from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/async-handler.js";

const router = Router();

// POST: Join an event
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventId } = req.body;

    // Validate event ID
    if (!eventId || !ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required",
      });
    }

    const { events, eventJoins } = getCollections();

    // Find event
    const event = await events.findOne({
      _id: new ObjectId(eventId),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Prevent joining past events
    if (new Date(event.eventDate).getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "You cannot join a past event",
      });
    }

    // User identity comes from verified JWT
    const userId = req.user.id;
    const userEmail = req.user.email;

    try {
      const joinData = {
        eventId: event._id.toString(),
        userId,
        userEmail,
        joinedAt: new Date().toISOString(),
      };

      const result = await eventJoins.insertOne(joinData);

      return res.status(201).json({
        success: true,
        message: "You have successfully joined this event",
        data: {
          joinId: result.insertedId,
          eventId: joinData.eventId,
          userId: joinData.userId,
        },
      });
    } catch (error) {
      // Unique index prevents duplicate joins
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "You have already joined this event",
        });
      }

      throw error;
    }
  })
);

export default router;