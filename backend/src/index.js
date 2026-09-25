require('dotenv').config();
const app = require('./app');
const connectDB = require('../../database/connection');

const PORT = process.env.PORT || 5055;

// Connect to MongoDB and start HTTP listener for local development
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Backend Server running on http://localhost:${PORT}`);
      console.log(` Connected to Database layer: ../database`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  })
  .catch((err) => {
    console.error('[Backend Startup Error] Could not start server:', err.message);
  });
