import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const ConnectDB = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL is not defined in environment variables');
    }
    
    
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.DB_NAME,
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });

    // Basic connection event logging
    const conn = mongoose.connection;
    conn.on('connected', () => console.log('✅ MongoDB connected'));
    conn.on('error', (err) => console.error('❌ MongoDB connection error:', err.message));
    conn.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
    
    console.log("✅ Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    throw error; // Re-throw so app.js can handle it
  }
};

export default ConnectDB;
