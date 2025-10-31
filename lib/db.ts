import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

let cached = global.mongoose as { conn: Mongoose | null; promise: Promise<Mongoose> | null } | undefined;

if (!cached) {
  global.mongoose = { conn: null, promise: null };
  cached = global.mongoose as { conn: Mongoose | null; promise: Promise<Mongoose> | null };
}

async function connectDB() {
  if (cached && cached.conn) {
    return cached.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((m: Mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
