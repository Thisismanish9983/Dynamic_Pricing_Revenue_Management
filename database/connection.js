const mongoose = require('mongoose');

const connectDB = async (customUri) => {
  try {
    const mongoUri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dynamic_pricing_db';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
