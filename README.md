# SortMyScene 🎟️

A full-stack event ticket booking platform built with a modern TypeScript monorepo architecture.

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB Atlas + Mongoose
- **Validation**: Zod
- **Auth**: JSON Web Tokens (JWT) + bcrypt
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit, express-mongo-sanitize

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State / Data**: @tanstack/react-query
- **Forms**: react-hook-form + zod + @hookform/resolvers
- **HTTP**: Axios
- **Routing**: react-router-dom

## Architecture

```
event-ticket-booking-system/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection, env validation
│   │   ├── controllers/  # Request handlers (thin layer)
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data-access layer
│   │   ├── models/       # Mongoose schemas & models
│   │   ├── routes/       # Express route definitions
│   │   ├── middlewares/  # Auth, error handling, rate limiting
│   │   ├── validators/   # Zod request validators
│   │   ├── types/        # TypeScript types / DTOs
│   │   ├── interfaces/   # TypeScript interfaces
│   │   ├── constants/    # App-wide constants & enums
│   │   └── utils/        # ApiError, ApiResponse, logger, asyncHandler
│   └── server.ts         # Entry point (only starts HTTP server)
│
└── frontend/
    └── src/
        ├── api/          # Axios client + endpoint functions
        ├── components/   # Reusable UI components
        ├── context/      # React contexts
        ├── hooks/        # Custom hooks
        ├── lib/          # Utility helpers (cn, etc.)
        ├── pages/        # Route-level page components
        ├── routes/       # React Router configuration
        └── types/        # Shared TS types
```

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas cluster

### Backend

```bash
cd backend
cp .env.example .env        # fill in your secrets
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env        # fill in VITE_API_URL
npm install
npm run dev
```

## Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot-reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run type-check` | Validate TypeScript without emitting |
| `npm run lint` | ESLint |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript check |

## Environment Variables

### Backend (`backend/.env.example`)

See [backend/.env.example](./backend/.env.example)

### Frontend (`frontend/.env.example`)

See [frontend/.env.example](./frontend/.env.example)

---

## Double Booking Prevention Strategy

To ensure zero double-booking occurrences under extreme concurrency load, the platform utilizes a multi-layered concurrency protection strategy:

### Layer 1: Atomic `findOneAndUpdate()`
- **Filter**: `{ eventId, seatNumber, status: SeatStatus.AVAILABLE }`
- **Update**: `$set` matching state changes to `RESERVED`
- **Purpose**: Prevents two requests from claiming the same seat. The update is performed atomically inside the database engine in a single roundtrip, preventing check-then-act race conditions.

### Layer 2: MongoDB Transactions
- **Session**: `session.startTransaction()`
- **Purpose**: Guarantees all-or-nothing (ACID) reservation state changes. If reserving any seat in a multi-seat request fails, or if a user active reservation check fails, the transaction is aborted (`session.abortTransaction()`), rolling back all allocated seats immediately.

### Layer 3: Database Constraints
- **Compound Index**: `{ eventId: 1, seatNumber: 1 }` with `unique: true` constraint on the `Seat` collection.
- **Purpose**: Acts as the final physical protection layer against race conditions at the storage engine level.

### Concurrency Validation
The system concurrency safety has been verified under stress testing:
- **Test Metric**: 50 concurrent HTTP requests (using `Promise.all()`) aiming at the exact same seat (`A5`).
- **Result**:
  - Exactly **1 success** (200 OK)
  - Exactly **49 conflicts** (409 Conflict)
  - **No duplicate bookings** and **no data corruption** recorded.