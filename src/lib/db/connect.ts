import mongoose from "mongoose";

/**
 * One Mongo connection, reused across invocations.
 *
 * Serverless functions are re-entered constantly and a fresh `mongoose.connect`
 * per request would open a new pool every time, exhaust the Atlas connection
 * limit within a few minutes of ordinary traffic, and add a full TLS handshake
 * to every page render. The promise — not the connection — is cached on
 * `globalThis`, so concurrent requests arriving during a cold start all await
 * the same handshake instead of racing to start their own.
 *
 * `globalThis` rather than a module-level variable because the dev server
 * re-evaluates modules on every edit; without it a long editing session leaks a
 * connection per save.
 */

const MONGODB_URI = process.env.MONGODB_URI;

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as {
  _mongoose?: ConnectionCache;
};

const cache: ConnectionCache =
  globalForMongoose._mongoose ?? (globalForMongoose._mongoose = { conn: null, promise: null });

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set.");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        // The command buffer is what makes a missing connection look like a
        // hang instead of an error. Off, so a broken database fails loudly at
        // the call site rather than after a ten second stall.
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      })
      .catch((err) => {
        // A failed handshake must not be cached, or the process stays broken
        // for its whole lifetime over one blip.
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/** True when the site has been given a database at all. */
export function databaseConfigured(): boolean {
  return Boolean(MONGODB_URI);
}
