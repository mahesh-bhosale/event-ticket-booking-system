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

---

## Reservation Expiration Strategy

To ensure database consistency and prevent seats from remaining permanently locked in a `RESERVED` state after a reservation expires, the platform employs a three-layer expiration strategy:

### Layer 1: Synchronous Expiry Validation
- **Trigger**: During the booking confirmation flow.
- **Rule**: `expiresAt > currentTime`.
- **Purpose**: Prevents confirming booking for any expired reservations. If expired, it triggers a seat release and transitions the reservation status to `EXPIRED` synchronously.

### Layer 2: MongoDB TTL Index
- **Index**: `{ expiresAt: 1 }` with `{ expireAfterSeconds: 0 }` on the `Reservation` collection.
- **Purpose**: Automatically removes expired reservation documents from the database in the background.
- **Important**: MongoDB TTL execution is asynchronous and runs on a background thread (usually once every 60 seconds). Therefore, deletion may be delayed by several minutes after the exact expiration timestamp has passed.

### Layer 3: Application-Level Lazy Cleanup
- **Trigger**: Executes automatically before querying seat availability during:
  - Event details/seat fetching (`GET /api/events/:id`)
  - Seat reservation requests (`POST /api/reserve`)
- **Optimization**: Event-scoped cleanup (only filters and releases seats for the current event) to maintain low latency (under 200ms).
- **Purpose**: Guarantees that expired seats are released immediately as soon as a user interacts with the system, preventing delayed releases from blocking new buyers.

### Why TTL Alone Is Not Enough
MongoDB's TTL index mechanism only deletes documents from the target collection (`reservations`). It is completely unaware of application-level references and relations. Specifically, TTL does NOT:
1. Update referencing documents in other collections (e.g., transitioning `Seat` documents from `RESERVED` back to `AVAILABLE`).
2. Release locks or clear fields like `reservedBy`, `reservedAt`, and `reservationId` on referencing documents.
3. Cascade changes or trigger application-level side effects.

Without **Layer 3 (Application-Level Lazy Cleanup)**, seats held by expired reservations would remain locked in a `RESERVED` state forever once the reservation document is deleted by the TTL index, causing permanent inventory leakage. This hybrid architecture guarantees immediate consistency, transaction safety, and high performance.