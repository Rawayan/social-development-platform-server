
import { Router } from "express";
import { z } from "zod";

import { ObjectId } from "mongodb";

import { getCollections } from "../config/collections.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

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

// GET /api/events/recent
// Public: Get the nearest 6 upcoming events
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

    res.status(200).json({
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

// POST /api/events
// Protected: Create a new event
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

      // Identity is taken from the verified JWT,
      // never from the request body.
      creatorId: req.user.id,
      creatorEmail: req.user.email,
      creatorName: req.user.name || "",

      createdAt: now,
      updatedAt: now,
    };

    const result = await events.insertOne(newEvent);

    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: {
        ...newEvent,
        _id: result.insertedId.toString(),
      },
    });
  })
);

export default router;

// GET: Get all upcoming events
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { events } = getCollections();

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

    res.status(200).json({
      success: true,
      message: "Upcoming events fetched successfully",
      count: upcomingEvents.length,
      data: upcomingEvents,
    });
  })
);

// GET: Get a single event by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const { events } = getCollections();

    const event = await events.findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event fetched successfully",
      data: event,
    });
  })
);