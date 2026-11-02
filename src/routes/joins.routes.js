
import { Router } from "express";
import { ObjectId } from "mongodb";

import { getCollections } from "../config/collections.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// ==========================================
// GET /api/joins/my-events
// Get events joined by the authenticated user
// ==========================================

router.get(
  "/my-events",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { events, eventJoins } = await getCollections();

    // Always use the verified JWT user ID.
    const userId = req.user.id;

    // Find only this user's join records.
    const joinRecords = await eventJoins
      .find({ userId })
      .toArray();

    if (joinRecords.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Convert stored event IDs into MongoDB ObjectIds.
    const eventObjectIds = joinRecords
      .filter((join) => ObjectId.isValid(join.eventId))
      .map((join) => new ObjectId(join.eventId));

    if (eventObjectIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Fetch the corresponding events.
    const eventDocuments = await events
      .find({
        _id: { $in: eventObjectIds },
      })
      .toArray();

    // Match join records with their events.
    const joinMap = new Map(
      joinRecords.map((join) => [
        join.eventId,
        join.joinedAt,
      ])
    );

    const joinedEvents = eventDocuments
      .map((event) => ({
        ...event,
        _id: event._id.toString(),
        joinedAt:
          joinMap.get(event._id.toString()) ?? null,
      }))
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() -
          new Date(b.eventDate).getTime()
      );

    return res.status(200).json({
      success: true,
      count: joinedEvents.length,
      data: joinedEvents,
    });
  })
);

// ==========================================
// POST /api/joins
// Join an upcoming event
// ==========================================

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventId } = req.body;

    // Validate event ID.
    if (!eventId || !ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    const { events, eventJoins } = await getCollections();

    // Find the requested event.
    const event = await events.findOne({
      _id: new ObjectId(eventId),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Prevent joining past events.
    if (new Date(event.eventDate).getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "You cannot join a past event.",
      });
    }

    // Identity comes from the verified JWT.
    const userId = req.user.id;
    const userEmail = req.user.email;

    const joinData = {
      eventId: event._id.toString(),
      userId,
      userEmail,
      joinedAt: new Date().toISOString(),
    };

    try {
      const result = await eventJoins.insertOne(joinData);

      return res.status(201).json({
        success: true,
        message: "You have successfully joined this event.",
        data: {
          joinId: result.insertedId.toString(),
          eventId: joinData.eventId,
          userId: joinData.userId,
        },
      });
    } catch (error) {
      // MongoDB unique index prevents duplicate joins.
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "You have already joined this event.",
        });
      }

      throw error;
    }
  })
);

export default router;
