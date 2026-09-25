// Root Serverless Entrypoint for Vercel and Node.js
const app = require('./backend/src/app');
const connectDB = require('./database/connection');

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  connectDB().catch((err) => {
    console.error('[Database Connection Error]', err.message);
  });
}

// Export Express app as root server entrypoint
module.exports = app;
