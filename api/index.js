// Vercel Serverless Function entrypoint
const app = require('../backend/src/app');
const connectDB = require('../database/connection');

module.exports = async (req, res) => {
  try {
    // Ensure MongoDB connection is active
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless DB Connection Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is configured in Vercel environment variables.',
      error: err.message,
    });
  }

  // Pass request to Express app
  return app(req, res);
};
