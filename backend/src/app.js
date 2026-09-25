require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Allowed CORS origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS configuration supporting local dev and Vercel deployments
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin Vercel requests)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const mongoose = require('mongoose');
const connectDB = require('../../database/connection');

// Database auto-connection middleware for serverless & local requests
app.use(async (req, res, next) => {
  // Always let health check proceed without waiting for database
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  // If in production and MONGODB_URI is not set
  if (!process.env.MONGODB_URI && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
    return res.status(500).json({
      success: false,
      message: 'MONGODB_URI environment variable is missing. Please add MONGODB_URI in Vercel Project Settings.',
    });
  }

  try {
    await connectDB();
    return next();
  } catch (err) {
    console.error('[Database Middleware Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is valid and MongoDB Atlas IP Whitelist (0.0.0.0/0) is configured.',
      error: err.message,
    });
  }
});

// Health Check route
app.get(['/api/health', '/health'], async (req, res) => {
  let dbStatus = 'disconnected';
  if (!process.env.MONGODB_URI) {
    dbStatus = 'disconnected (MONGODB_URI not configured in Vercel)';
  } else {
    try {
      if (mongoose.connection.readyState !== 1) {
        await connectDB();
      }
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (err) {
      dbStatus = 'connection_error: ' + err.message;
    }
  }

  res.status(200).json({
    status: 'online',
    database: dbStatus,
    service: 'Dynamic Pricing & Revenue Management API',
    architecture: 'Frontend (React) | Backend (Express) | Database (MongoDB)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes - Mounted on both /api/* and /* for full Vercel Serverless and local compatibility
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/organizations', '/organizations'], orgRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);



// Global 404 Handler for unmatched API routes
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

module.exports = app;
