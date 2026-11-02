import { Router } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getCollections } from "../config/collections.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// ==========================================
// Event Validation Schema
// ==========================================

const eventSchema = z.object({
  title: z.string().trim().min(3).max(100),

  description: z.string().trim().min(10).max(2000),

  eventType: z.enum([
    "Cleanup",
    "Plantation",
    "Donation",
    "Education",
    "Community Support",
    "Other",
  ]),

  imageUrl: z
    .string()
    .trim()
    .url()
    .refine(
      (value) =>
        value.startsWith("https://") ||
        value.startsWith("http://"),
      "Image URL must use HTTP or HTTPS."
    ),

  location: z.string().trim().min(2).max(150),

  eventDate: z.string().datetime({ offset: true }),
});

// ==========================================
// GET /api/events/recent
// Public: Get 6 nearest upcoming events
// ==========================================

router.get(
  "/recent",
  asyncHandler(async (req, res) => {
    const { events } = await getCollections();

    const now = new Date().toISOString();

    const recentEvents = await events
      .find({
        eventDate: { $gte: now },
      })
      .sort({
        eventDate: 1,
        createdAt: -1,
      })
      .limit(6)
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Recent upcoming events retrieved successfully.",
      count: recentEvents.length,
      data: recentEvents.map((event) => ({
        ...event,
        _id: event._id.toString(),
      })),
    });
  })
);

// ==========================================
// GET /api/events
// Public: Get all upcoming events
// ==========================================

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { events } = await getCollections();

    const currentDate = new Date().toISOString();

    const upcomingEvents = await events
      .find({
        eventDate: {
          $gte: currentDate,
        },
      })
      .sort({
        eventDate: 1,
        createdAt: -1,
      })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Upcoming events fetched successfully.",
      count: upcomingEvents.length,
      data: upcomingEvents.map((event) => ({
        ...event,
        _id: event._id.toString(),
      })),
    });
  })
);

// ==========================================
// POST /api/events
// Protected: Create a new event
// ==========================================

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const validation = eventSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid event information.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const eventDate = new Date(
      validation.data.eventDate
    );

    if (eventDate.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Event date must be in the future.",
      });
    }

    const { events } = await getCollections();

    const now = new Date().toISOString();

    const newEvent = {
      ...validation.data,

      // Identity comes from verified JWT.
      creatorId: req.user.id,
      creatorEmail: req.user.email,
      creatorName: req.user.name || "",

      createdAt: now,
      updatedAt: now,
    };

    const result = await events.insertOne(newEvent);

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: {
        ...newEvent,
        _id: result.insertedId.toString(),
      },
    });
  })
);

// ==========================================
// GET /api/events/:id
// Public: Get a single event by ID
// ==========================================

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const { events } = await getCollections();

    const event = await events.findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event fetched successfully.",
      data: {
        ...event,
        _id: event._id.toString(),
      },
    });
  })
);


import { requireOwner } from "../middlewares/require-owner.js";

// ==========================================
// Event Update Validation
// ==========================================

const eventUpdateSchema = eventSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided.",
    }
  );

// ==========================================
// Load Event Middleware
// ==========================================

const loadEvent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid event ID.",
    });
  }

  const { events } = await getCollections();

  const event = await events.findOne({
    _id: new ObjectId(id),
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found.",
    });
  }

  req.resource = event;

  next();
});


// ==========================================
// PATCH /api/events/:id
// Protected: Update an owned event
// ==========================================

router.patch(
  "/:id",
  requireAuth,
  loadEvent,
  requireOwner(),
  asyncHandler(async (req, res) => {
    const validation = eventUpdateSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid event information.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const updateData = validation.data;

    // Validate future date if eventDate is updated.
    if (updateData.eventDate) {
      const updatedDate = new Date(updateData.eventDate);

      if (
        Number.isNaN(updatedDate.getTime()) ||
        updatedDate.getTime() <= Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message: "Event date must be in the future.",
        });
      }
    }

    const { events } = await getCollections();

    const result = await events.updateOne(
      {
        _id: req.resource._id,
        creatorId: req.user.id,
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or ownership changed.",
      });
    }

    const updatedEvent = await events.findOne({
      _id: req.resource._id,
    });

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: {
        ...updatedEvent,
        _id: updatedEvent._id.toString(),
      },
    });
  })
);

// ==========================================
// DELETE /api/events/:id
// Protected: Delete an owned event
// ==========================================

router.delete(
  "/:id",
  requireAuth,
  loadEvent,
  requireOwner(),
  asyncHandler(async (req, res) => {
    const { events, eventJoins } = await getCollections();

    const result = await events.deleteOne({
      _id: req.resource._id,
      creatorId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or already deleted.",
      });
    }

    // Remove associated join records to avoid orphan records.
    await eventJoins.deleteMany({
      eventId: req.resource._id.toString(),
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
    });
  })
);

export default router;