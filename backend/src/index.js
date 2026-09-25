require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../../database/connection');

// Route imports
const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5055;

// Connect to Database via database/connection.js
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Dynamic Pricing & Revenue Management API',
    architecture: 'Frontend (React) | Backend (Express) | Database (MongoDB)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Backend Server Error]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Backend Server running on http://localhost:${PORT}`);
  console.log(` Connected to Database layer: ../database`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});
