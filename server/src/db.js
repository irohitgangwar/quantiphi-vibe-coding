import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aichat';
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] Successfully connected to MongoDB: ${mongoUri}`);
  } catch (error) {
    isConnected = false;
    console.error(`[Database Warning] Could not connect to MongoDB (${error.message}).`);
    console.log(`[Database] Server will operate with in-memory resilient fallback store.`);
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database] MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[Database] MongoDB reconnected.');
  });
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
