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

// Serve frontend static build if available
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

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

// Catch-all for non-API routes (serves frontend or helpful guidance page)
app.get('*', (req, res, next) => {
  // Pass unhandled API requests to 404 handler
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }

  // If frontend production build exists, serve index.html
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // Otherwise, render friendly status page pointing to React dev server
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Dynamic Pricing & Revenue Management API</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          body { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
          .card { background: #1e293b; max-width: 580px; width: 100%; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); text-align: center; }
          .badge { display: inline-block; background: #0284c7; color: white; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
          h1 { font-size: 22px; color: #38bdf8; margin-bottom: 12px; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
          .btn:hover { background: #1d4ed8; }
          .endpoints { margin-top: 24px; text-align: left; background: #0b1120; border-radius: 10px; padding: 16px 20px; font-size: 13px; font-family: monospace; color: #cbd5e1; border: 1px solid #1e293b; }
          .endpoints h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; font-family: sans-serif; }
          .endpoints a { color: #38bdf8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Backend API Server Online</div>
          <h1>⚡ Dynamic Pricing API Backend</h1>
          <p>
            Aapne <strong>Backend REST API Server (Port 5055)</strong> open kiya hai.<br />
            React Frontend Application dekhne ke liye neeche button par click karein:
          </p>
          <a class="btn" href="http://localhost:5173">Open React Frontend (localhost:5173) &rarr;</a>
          <div class="endpoints">
            <h3>Active API Endpoints</h3>
            <div>• <a href="/api/health">GET /api/health</a> (System Health Check)</div>
            <div>• POST /api/auth/login</div>
            <div>• POST /api/auth/register</div>
            <div>• GET /api/dashboard/overview</div>
          </div>
        </div>
      </body>
    </html>
  `);
});

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
