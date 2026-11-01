
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "social_development_db";

if (!uri) {
  throw new Error("MONGODB_URI is missing from environment variables.");
}

const client = new MongoClient(uri);

let clientPromise;

export async function connectDB() {
  if (!clientPromise) {
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }

  await clientPromise;

  const database = client.db(dbName);

  console.log(`MongoDB connected: ${dbName}`);

  return database;
}

export async function getDB() {
  if (!clientPromise) {
    throw new Error(
      "Database is not connected. Call connectDB() first."
    );
  }

  await clientPromise;

  return client.db(dbName);
}

export async function closeDB() {
  if (clientPromise) {
    await client.close();
    clientPromise = undefined;
    console.log("MongoDB connection closed.");
  }
}
