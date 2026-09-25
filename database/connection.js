const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async (customUri) => {
  // Reuse existing connection if already established or connecting (vital for Vercel serverless)
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const mongoUri =
    customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dynamic_pricing_db';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = conn;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // In serverless / production environments, throw error instead of calling process.exit(1)
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
