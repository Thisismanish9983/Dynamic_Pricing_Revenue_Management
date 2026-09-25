# Dynamic Pricing & Revenue Management SaaS

A multi-tenant SaaS platform that helps businesses optimize pricing based on demand, availability, occupancy, seasonality, and custom rules, built according to the PRD specification.

## Clean 3-Tier Architecture
- **`frontend/`**: Pure **HTML5**, custom **CSS3**, modern **JavaScript**, and **React** (Zero external CSS frameworks like Tailwind, Zero external UI libraries, native `fetch()` API).
- **`backend/`**: Node.js & Express REST API with JWT authentication and Role-Based Access Control (RBAC).
- **`database/`**: Dedicated MongoDB layer with Mongoose schemas, connection handler, and seed scripts.

## Directory Structure
```
Dinamic_pricing_management/
├── frontend/            # Pure HTML, CSS, JS, and React
│   ├── index.html       # HTML entrypoint
│   ├── package.json     # Only React, React DOM, and Vite
│   ├── vite.config.js   # Vite config with /api proxy
│   └── src/
│       ├── main.jsx     # React entrypoint
│       ├── App.jsx      # Zero-dependency hash router
│       ├── index.css    # Pure custom CSS (variables, grid, flexbox, cards)
│       ├── api/client.js# Native JavaScript fetch() API client
│       ├── context/     # AuthContext state
│       ├── components/  # Navbar, Sidebar, DashboardShell
│       └── pages/       # Login, Register, DashboardOverview, UsersRoles, Settings
│
├── backend/             # Express REST API
│   ├── package.json
│   ├── .env             # Environment variables
│   └── src/
│       ├── index.js     # Server entrypoint
│       ├── controllers/ # Auth, User, Org, Dashboard controllers
│       ├── middleware/  # JWT auth, RBAC, tenant isolation
│       └── routes/      # Express routes
│
├── database/            # Dedicated Database Module
│   ├── package.json
│   ├── connection.js    # MongoDB connection
│   ├── seed.js          # Database seeding script
│   └── models/          # Schemas (Organization, User, Product, AuditLog, Notification)
│
├── package.json         # Root orchestrator scripts
└── README.md
```

## Quick Start Commands

```bash
# Run database seed
npm run seed

# Run both Backend & Frontend concurrently
npm run dev
```

- **Frontend Console**: `http://localhost:5173`
- **Backend API**: `http://localhost:5055`

## Demo Login Accounts (Password for all: `password123`)
- **Admin**: `admin@grandvista.com`
- **Revenue Manager**: `revenue@grandvista.com`
- **Staff / Operations**: `staff@grandvista.com`
- **Viewer / Client**: `viewer@grandvista.com`
