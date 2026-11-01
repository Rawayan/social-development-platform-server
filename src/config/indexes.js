
import { getCollections } from "./collections.js";

export async function createIndexes() {
  const { events, eventJoins } = await getCollections();

  // Events collection indexes
  await events.createIndex(
    { eventDate: 1 },
    { name: "events_eventDate_asc" }
  );

  await events.createIndex(
    { createdAt: -1 },
    { name: "events_createdAt_desc" }
  );

  await events.createIndex(
    { creatorEmail: 1, createdAt: -1 },
    { name: "events_creatorEmail_createdAt" }
  );

  // Event joins collection indexes
  await eventJoins.createIndex(
    { eventId: 1, userId: 1 },
    {
      unique: true,
      name: "eventJoins_eventId_userId_unique",
    }
  );

  await eventJoins.createIndex(
    { userId: 1, joinedAt: -1 },
    { name: "eventJoins_userId_joinedAt" }
  );

  await eventJoins.createIndex(
    { eventId: 1 },
    { name: "eventJoins_eventId" }
  );

  console.log("MongoDB indexes created successfully.");
}
