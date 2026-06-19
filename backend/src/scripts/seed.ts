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
  image: string;
  category: string;
  price: number;
  location: string;
  isActive: boolean;
}> {
  const now = new Date();

  const daysFromNow = (days: number, hours = 19, minutes = 0): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  return [
    {
      name: 'Room 303',
      description:
        'An electrifying night of underground electronic music featuring AE:M, Bhish, Citizen Kale, Breaking, Chhabb, Sunju Hargun, Monophonik, Revant, and Zequenx.',
      venue: 'Hylo',
      dateTime: daysFromNow(7, 18, 0),
      totalSeats: 80,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop',
      category: 'Nightlife',
      price: 799,
      location: 'Mumbai',
      isActive: true,
    },
    {
      name: 'Underhouse Basement Tour 2026 — Jaipur',
      description:
        'The Underhouse Basement Tour brings its signature underground sound to Jaipur. A night of deep beats, raw energy, and immersive vibes at Hotel Clarks Amer.',
      venue: 'Hotel Clarks Amer',
      dateTime: daysFromNow(15, 20, 0),
      totalSeats: 80,
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
      category: 'Concert',
      price: 999,
      location: 'Jaipur',
      isActive: true,
    },
    {
      name: 'Underhouse Basement Tour 2026 — Delhi',
      description:
        'The Underhouse Basement Tour arrives in Delhi. Expect heavy basslines, underground DJs, and an intimate warehouse atmosphere.',
      venue: 'To Be Announced',
      dateTime: daysFromNow(10, 20, 0),
      totalSeats: 80,
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop',
      category: 'Concert',
      price: 999,
      location: 'Delhi',
      isActive: true,
    },
    {
      name: 'The Tomatina Festival',
      description:
        'Bar Bank brings the iconic La Tomatina straight from Spain to Mumbai — turning your ultimate Zindagi Na Milegi Dobara moment into reality. The city\'s biggest Tomatina festival and an unforgettable day drunch experience.',
      venue: 'Bar Bank - Juhu',
      dateTime: daysFromNow(60, 10, 30),
      totalSeats: 80,
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop',
      category: 'Festival',
      price: 1999,
      location: 'Mumbai',
      isActive: true,
    },
    {
      name: 'Habibi Please! ft. Afterall',
      description:
        'An evening of eclectic Middle Eastern-infused beats and global sounds featuring Afterall at Opa! Bar & Cafe, Mumbai.',
      venue: 'Opa! Bar & Cafe',
      dateTime: daysFromNow(3, 21, 0),
      totalSeats: 80,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
      category: 'Nightlife',
      price: 949,
      location: 'Mumbai',
      isActive: true,
    },
    {
      name: 'Qaifiyat — Poetry & Music Night',
      description:
        'An intimate evening of poetry and music with Nidhi Narwal & Firdaus ft. Ishaan Nigam. A soulful cultural experience at Dr. C Ashwath Kala Bhavana.',
      venue: 'Dr. C Ashwath Kala Bhavana, Auditorium',
      dateTime: daysFromNow(5, 18, 0),
      totalSeats: 80,
      image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop',
      category: 'Cultural',
      price: 399,
      location: 'Bengaluru',
      isActive: true,
    },
    {
      name: 'The Big Fat Gay Fake Shaadi!',
      description:
        'A vibrant celebration of love and identity — a joyful, colorful fake wedding party at The Scene, Mumbai. Presented by That\'s So Gay × The Gay Gaze.',
      venue: 'The Scene',
      dateTime: daysFromNow(5, 17, 0),
      totalSeats: 80,
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
      category: 'Festival',
      price: 750,
      location: 'Mumbai',
      isActive: true,
    },
    {
      name: 'Pride Run 2026 — Bengaluru Front Runners',
      description:
        'Annual Pride Run and Walk organized by Bengaluru Front Runners at Sri Chamarajendra Park. Run for pride, equality, and community.',
      venue: 'Sri Chamarajendra Park',
      dateTime: daysFromNow(5, 6, 0),
      totalSeats: 80,
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop',
      category: 'Sports',
      price: 100,
      location: 'Bengaluru',
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
