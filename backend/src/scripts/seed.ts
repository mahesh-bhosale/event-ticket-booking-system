/**
 * Seed Script — SortMyScene
 *
 * Usage:
 *   ts-node -e "require('dotenv').config()" src/scripts/seed.ts
 * or add to package.json:
 *   "seed": "ts-node-dev --transpile-only src/scripts/seed.ts"
 *
 * Run from the backend/ directory with a valid .env present.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose, { type Types } from 'mongoose';
import bcrypt from 'bcrypt';

import { User } from '../models/User';
import { Event } from '../models/Event';
import { Seat } from '../models/Seat';
import { Reservation } from '../models/Reservation';
import { UserRole } from '../types/user.types';
import { SeatStatus } from '../types/seat.types';

// ─────────────────────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────────────────────
const MONGODB_URI_RAW = process.env['MONGODB_URI'];

if (!MONGODB_URI_RAW) {
  console.error('❌  MONGODB_URI is not set in environment variables');
  process.exit(1);
}

// TypeScript cannot narrow a module-level const after process.exit(),
// so we re-assign into a guaranteed-string variable.
const MONGODB_URI: string = MONGODB_URI_RAW;

const BCRYPT_SALT_ROUNDS = 12;

// Seat rows A-H, columns 1-10
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
const COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

// ─────────────────────────────────────────────────────────────
//  Seed Data
// ─────────────────────────────────────────────────────────────

/** Generate the 80 seat numbers (A1…H10) for an event */
function generateSeatNumbers(): string[] {
  const seats: string[] = [];
  for (const row of ROWS) {
    for (const col of COLUMNS) {
      seats.push(`${row}${col}`);
    }
  }
  return seats; // 8 rows × 10 cols = 80 seats
}

/** Seed event data — all dates are in the future */
function buildEventSeedData(): Array<{
  name: string;
  description: string;
  venue: string;
  dateTime: Date;
  totalSeats: number;
  isActive: boolean;
}> {
  const now = new Date();

  const daysFromNow = (days: number): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(19, 0, 0, 0); // 7 PM
    return d;
  };

  return [
    {
      name: 'Grand Concert Night',
      description:
        'An electrifying evening of live music featuring chart-topping artists across multiple genres. Expect unforgettable performances, stunning stage production, and a night to remember.',
      venue: 'SortMyScene Arena, Mumbai',
      dateTime: daysFromNow(14),
      totalSeats: 80,
      isActive: true,
    },
    {
      name: 'Comedy Extravaganza',
      description:
        'A hilarious comedy show with the best stand-up comedians in the country. Get ready for side-splitting performances that will leave you in stitches all night long.',
      venue: 'Laughter Club, Pune',
      dateTime: daysFromNow(21),
      totalSeats: 80,
      isActive: true,
    },
    {
      name: 'TechConf 2025',
      description:
        'A premier technology conference bringing together the brightest minds in software engineering, AI, and product design. Keynotes, workshops, and networking opportunities await.',
      venue: 'Innovation Hub, Bengaluru',
      dateTime: daysFromNow(30),
      totalSeats: 80,
      isActive: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────────
//  Main Seed Function
// ─────────────────────────────────────────────────────────────
async function seed(): Promise<void> {
  console.log('🌱  Starting database seed…\n');

  // 1. Connect
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected to MongoDB\n');

  // 2. Clear existing collections (order matters for referential sanity)
  console.log('🗑️   Clearing existing collections…');
  await Reservation.deleteMany({});
  await Seat.deleteMany({});
  await Event.deleteMany({});
  await User.deleteMany({});
  console.log('   ✔  Collections cleared\n');

  // 3. Ensure indexes are created (idempotent)
  await Promise.all([
    User.syncIndexes(),
    Event.syncIndexes(),
    Seat.syncIndexes(),
    Reservation.syncIndexes(),
  ]);
  console.log('✅  Indexes synchronized\n');

  // ── 4. Seed Demo User ─────────────────────────────────────
  console.log('👤  Seeding demo user…');
  const passwordHash = await bcrypt.hash('Password123', BCRYPT_SALT_ROUNDS);

  const demoUser = await User.create({
    name: 'Demo User',
    email: 'demo@example.com',
    passwordHash,
    role: UserRole.USER,
  });
  console.log(`   ✔  Demo user created: ${demoUser.email}\n`);

  // ── 5. Seed Admin User ────────────────────────────────────
  console.log('🔑  Seeding admin user…');
  const adminPasswordHash = await bcrypt.hash('Admin123!', BCRYPT_SALT_ROUNDS);

  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@sortmyscene.com',
    passwordHash: adminPasswordHash,
    role: UserRole.ADMIN,
  });
  console.log(`   ✔  Admin user created: ${adminUser.email}\n`);

  // ── 6. Seed Events ────────────────────────────────────────
  console.log('🎭  Seeding events…');
  const eventSeedData = buildEventSeedData();
  const createdEvents = await Event.insertMany(eventSeedData);
  console.log(`   ✔  ${createdEvents.length} events created\n`);

  // ── 7. Seed Seats for each event ─────────────────────────
  console.log('💺  Seeding seats (80 per event)…');
  const seatNumbers = generateSeatNumbers();

  for (const event of createdEvents) {
    const seatDocs = seatNumbers.map((seatNumber) => ({
      eventId: event._id as Types.ObjectId,
      seatNumber,
      status: SeatStatus.AVAILABLE,
      reservedBy: null,
      reservedAt: null,
      reservationId: null,
    }));

    await Seat.insertMany(seatDocs, { ordered: false });
    console.log(
      `   ✔  80 seats created for event: "${event.name}"`,
    );
  }

  console.log();

  // ── 8. Verify Index Creation ─────────────────────────────
  console.log('🔍  Verifying indexes…');

  const userIndexes = await User.collection.indexes();
  const eventIndexes = await Event.collection.indexes();
  const seatIndexes = await Seat.collection.indexes();
  const reservationIndexes = await Reservation.collection.indexes();

  console.log('\n   User indexes:');
  userIndexes.forEach((idx) =>
    console.log(`     • ${idx.name ?? 'unnamed'} — ${JSON.stringify(idx.key)}`),
  );

  console.log('\n   Event indexes:');
  eventIndexes.forEach((idx) =>
    console.log(`     • ${idx.name ?? 'unnamed'} — ${JSON.stringify(idx.key)}`),
  );

  console.log('\n   Seat indexes:');
  seatIndexes.forEach((idx) =>
    console.log(`     • ${idx.name ?? 'unnamed'} — ${JSON.stringify(idx.key)}`),
  );

  console.log('\n   Reservation indexes:');
  reservationIndexes.forEach((idx) =>
    console.log(`     • ${idx.name ?? 'unnamed'} — ${JSON.stringify(idx.key)}`),
  );

  // ── 9. Summary ────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('✅  Seed completed successfully!');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n📊  Database Summary:');
  console.log(`   Users       : ${await User.countDocuments()}`);
  console.log(`   Events      : ${await Event.countDocuments()}`);
  console.log(`   Seats       : ${await Seat.countDocuments()}`);
  console.log(`   Reservations: ${await Reservation.countDocuments()}`);
  console.log('\n🔐  Demo Credentials:');
  console.log('   Email    : demo@example.com');
  console.log('   Password : Password123');
  console.log('\n🔑  Admin Credentials:');
  console.log('   Email    : admin@sortmyscene.com');
  console.log('   Password : Admin123!');
  console.log('═══════════════════════════════════════════════════\n');
}

// ─────────────────────────────────────────────────────────────
//  Run & Disconnect
// ─────────────────────────────────────────────────────────────
seed()
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌  Seed failed: ${message}`);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  })
  .finally(() => {
    void mongoose.connection.close();
    console.log('🔌  MongoDB connection closed');
  });
