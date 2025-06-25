import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

let cached = (global as any).mongoose || { conn: null, promise: null };

async function connect() {
  if (cached.conn) {
    console.log('Using existing mongoose connection');
    return cached.conn;
  }
  
  if (!cached.promise) {
    console.log('Creating new mongoose connection...');
    
    const opts = {
      dbName: "shop",
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then(mongoose => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch(error => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  } else {
    console.log('Using existing connection promise');
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

(global as any).mongoose = cached;

export default connect;