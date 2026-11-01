
import { getDB } from "./db.js";

export async function getCollections() {
  const db = await getDB();

  return {
    events: db.collection("events"),
    eventJoins: db.collection("eventJoins"),
  };
}
