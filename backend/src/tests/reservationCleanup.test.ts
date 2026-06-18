import mongoose, { Types } from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Seat } from '../models/Seat';
import { Reservation, ReservationStatus } from '../models/Reservation';
import { UserRole } from '../types/user.types';
import { SeatStatus } from '../types/seat.types';
import { env } from '../config/env';
import { cleanupExpiredReservations } from '../services/reservationCleanupService';

describe('Reservation Expiry Handling & Automatic Seat Release Tests', () => {
  let testUser1: mongoose.Document & { _id: Types.ObjectId; email: string; role: UserRole };
  let testUser2: mongoose.Document & { _id: Types.ObjectId; email: string; role: UserRole };
  let activeEvent1: mongoose.Document & { _id: Types.ObjectId; name: string };
  let activeEvent2: mongoose.Document & { _id: Types.ObjectId; name: string };
  let userToken1: string;
  const testUserIds: Types.ObjectId[] = [];

  beforeAll(async () => {
    // 1. Establish database connection if not active
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // 2. Clean up test records
    await User.deleteMany({ email: /test-jest-cleanup-.*@example.com/ });
    await Event.deleteMany({ name: /Test Jest Cleanup Event.*/ });
    await Reservation.deleteMany({});

    // 3. Seed Test Users
    const u1 = await User.create({
      name: 'Jest Cleanup User 1',
      email: 'test-jest-cleanup-user1@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.USER,
    });
    testUser1 = u1 as typeof testUser1;
    testUserIds.push(testUser1._id);

    const u2 = await User.create({
      name: 'Jest Cleanup User 2',
      email: 'test-jest-cleanup-user2@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.USER,
    });
    testUser2 = u2 as typeof testUser2;
    testUserIds.push(testUser2._id);

    // 4. Seed Test Events
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const e1 = await Event.create({
      name: 'Test Jest Cleanup Event 1',
      description: 'Active event 1 for Jest cleanup testing',
      venue: 'Cleanup Arena 1',
      dateTime: futureDate,
      totalSeats: 5,
      isActive: true,
    });
    activeEvent1 = e1 as typeof activeEvent1;

    const e2 = await Event.create({
      name: 'Test Jest Cleanup Event 2',
      description: 'Active event 2 for Jest cleanup testing',
      venue: 'Cleanup Arena 2',
      dateTime: futureDate,
      totalSeats: 5,
      isActive: true,
    });
    activeEvent2 = e2 as typeof activeEvent2;

    // 5. Populate Seats
    const seatNumbers = ['A1', 'A2', 'A3', 'A4', 'A5'];
    for (const seatNumber of seatNumbers) {
      await Seat.create({
        eventId: activeEvent1._id,
        seatNumber,
        status: SeatStatus.AVAILABLE,
      });
      await Seat.create({
        eventId: activeEvent2._id,
        seatNumber,
        status: SeatStatus.AVAILABLE,
      });
    }

    // 6. Generate Tokens
    userToken1 = jwt.sign(
      { userId: testUser1._id.toString(), email: testUser1.email, role: testUser1.role },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    // Clean up test records and disconnect
    await User.deleteMany({ email: /test-jest-cleanup-.*@example.com/ });
    await Event.deleteMany({ name: /Test Jest Cleanup Event.*/ });
    await Reservation.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Reset seats and reservations before each test case
    await Reservation.deleteMany({});
    await Seat.updateMany(
      {},
      { $set: { status: SeatStatus.AVAILABLE, reservedBy: null, reservedAt: null, reservationId: null } }
    );
  });

  // ── 1. Expired reservation releases seats ───────────────────────────────────
  test('1. Expired reservation releases seats and status becomes EXPIRED', async () => {
    // Setup: Create a reservation and link the seat
    const seat = await Seat.findOne({ eventId: activeEvent1._id, seatNumber: 'A1' });
    expect(seat).toBeDefined();

    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent1._id,
      seatNumbers: ['A1'],
      seatIds: [seat!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });

    await Seat.updateOne(
      { _id: seat!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date(), reservationId: reservation._id } }
    );

    // Bypassing validates on create to make it expired
    await Reservation.updateOne(
      { _id: reservation._id },
      { $set: { expiresAt: new Date(Date.now() - 5000) } }
    );

    // Execute cleanup
    const result = await cleanupExpiredReservations();
    expect(result.expiredReservationsProcessed).toBe(1);
    expect(result.seatsReleased).toBe(1);

    // Verify Seat status
    const updatedSeat = await Seat.findById(seat!._id);
    expect(updatedSeat?.status).toBe(SeatStatus.AVAILABLE);
    expect(updatedSeat?.reservedBy).toBeNull();
    expect(updatedSeat?.reservationId).toBeNull();

    // Verify Reservation status
    const updatedRes = await Reservation.findById(reservation._id);
    expect(updatedRes?.status).toBe(ReservationStatus.EXPIRED);
  });

  // ── 2. Non-expired reservations remain untouched ──────────────────────────────
  test('2. Non-expired reservations and seats remain untouched', async () => {
    const seat = await Seat.findOne({ eventId: activeEvent1._id, seatNumber: 'A2' });
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent1._id,
      seatNumbers: ['A2'],
      seatIds: [seat!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });

    await Seat.updateOne(
      { _id: seat!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date(), reservationId: reservation._id } }
    );

    // Execute cleanup
    const result = await cleanupExpiredReservations();
    expect(result.expiredReservationsProcessed).toBe(0);
    expect(result.seatsReleased).toBe(0);

    // Verify Seat status is unchanged
    const updatedSeat = await Seat.findById(seat!._id);
    expect(updatedSeat?.status).toBe(SeatStatus.RESERVED);
    expect(updatedSeat?.reservedBy?.toString()).toBe(testUser1._id.toString());
    expect(updatedSeat?.reservationId?.toString()).toBe(reservation._id.toString());

    // Verify Reservation status is unchanged
    const updatedRes = await Reservation.findById(reservation._id);
    expect(updatedRes?.status).toBe(ReservationStatus.ACTIVE);
  });

  // ── 3. Multiple expired reservations ─────────────────────────────────────────
  test('3. Multiple expired reservations are cleaned up in bulk', async () => {
    const seat1 = await Seat.findOne({ eventId: activeEvent1._id, seatNumber: 'A1' });
    const seat2 = await Seat.findOne({ eventId: activeEvent1._id, seatNumber: 'A2' });

    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const res1 = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent1._id,
      seatNumbers: ['A1'],
      seatIds: [seat1!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });

    const res2 = await Reservation.create({
      userId: testUser2._id,
      eventId: activeEvent1._id,
      seatNumbers: ['A2'],
      seatIds: [seat2!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });

    await Seat.updateOne(
      { _id: seat1!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date(), reservationId: res1._id } }
    );
    await Seat.updateOne(
      { _id: seat2!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser2._id, reservedAt: new Date(), reservationId: res2._id } }
    );

    // Expire both
    await Reservation.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 5000) } });

    // Execute cleanup
    const result = await cleanupExpiredReservations();
    expect(result.expiredReservationsProcessed).toBe(2);
    expect(result.seatsReleased).toBe(2);

    const updatedSeat1 = await Seat.findById(seat1!._id);
    expect(updatedSeat1?.status).toBe(SeatStatus.AVAILABLE);

    const updatedSeat2 = await Seat.findById(seat2!._id);
    expect(updatedSeat2?.status).toBe(SeatStatus.AVAILABLE);

    const updatedRes1 = await Reservation.findById(res1._id);
    expect(updatedRes1?.status).toBe(ReservationStatus.EXPIRED);

    const updatedRes2 = await Reservation.findById(res2._id);
    expect(updatedRes2?.status).toBe(ReservationStatus.EXPIRED);
  });

  // ── 4. Cleanup Idempotency ───────────────────────────────────────────────────
  test('4. Cleanup operation is idempotent', async () => {
    const seat = await Seat.findOne({ eventId: activeEvent1._id, seatNumber: 'A1' });
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent1._id,
      seatNumbers: ['A1'],
      seatIds: [seat!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });

    await Seat.updateOne(
      { _id: seat!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date(), reservationId: reservation._id } }
    );

    await Reservation.updateOne(
      { _id: reservation._id },
      { $set: { expiresAt: new Date(Date.now() - 5000) } }
    );

    // Call 1
    const result1 = await cleanupExpiredReservations();
    expect(result1.expiredReservationsProcessed).toBe(1);
    expect(result1.seatsReleased).toBe(1);

    // Call 2
    const result2 = await cleanupExpiredReservations();
    expect(result2.expiredReservationsProcessed).toBe(0);
    expect(result2.seatsReleased).toBe(0);
  });

  // ── 5. Event Fetch Triggers Cleanup ─────────────────────────────────────────
  test('5. Event details fetch triggers cleanup of expired reservations for that event', async () => {
    const seatEvent1 = await Seat.findOne({ eventId: activeEvent1._id, seatNumber: 'A1' });
    const seatEvent2 = await Seat.findOne({ eventId: activeEvent2._id, seatNumber: 'A1' });

    const futureDate = new Date(Date.now() + 10 * 60 * 1000);

    // Create expired reservation on Event 1
    const res1 = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent1._id,
      seatNumbers: ['A1'],
      seatIds: [seatEvent1!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });
    await Seat.updateOne(
      { _id: seatEvent1!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date(), reservationId: res1._id } }
    );

    // Create expired reservation on Event 2
    const res2 = await Reservation.create({
      userId: testUser2._id,
      eventId: activeEvent2._id,
      seatNumbers: ['A1'],
      seatIds: [seatEvent2!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });
    await Seat.updateOne(
      { _id: seatEvent2!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser2._id, reservedAt: new Date(), reservationId: res2._id } }
    );

    // Expire both
    await Reservation.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 5000) } });

    // Request Event 1 details
    const res = await request(app).get(`/api/events/${activeEvent1._id.toString()}`);
    expect(res.status).toBe(200);

    // Verify Event 1 seat is now AVAILABLE (cleaned up)
    const updatedSeat1 = await Seat.findById(seatEvent1!._id);
    expect(updatedSeat1?.status).toBe(SeatStatus.AVAILABLE);

    const updatedRes1 = await Reservation.findById(res1._id);
    expect(updatedRes1?.status).toBe(ReservationStatus.EXPIRED);

    // Verify Event 2 seat remains RESERVED (since cleanup was scoped only to Event 1)
    const updatedSeat2 = await Seat.findById(seatEvent2!._id);
    expect(updatedSeat2?.status).toBe(SeatStatus.RESERVED);

    const updatedRes2 = await Reservation.findById(res2._id);
    expect(updatedRes2?.status).toBe(ReservationStatus.ACTIVE);
  });

  // ── 6. Reserve Endpoint Triggers Cleanup ─────────────────────────────────────
  test('6. Reserve endpoint triggers cleanup and frees up seat immediately', async () => {
    // User 1 reserves seat A1 on Event 1
    const seatA1 = await Seat.findOne({ eventId: activeEvent1._id, seatNumber: 'A1' });
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent1._id,
      seatNumbers: ['A1'],
      seatIds: [seatA1!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });

    await Seat.updateOne(
      { _id: seatA1!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date(), reservationId: reservation._id } }
    );

    // Expire User 1's reservation
    await Reservation.updateOne(
      { _id: reservation._id },
      { $set: { expiresAt: new Date(Date.now() - 5000) } }
    );

    // User 1 attempts to reserve A1 again.
    // If lazy cleanup works, it should clear their previous expired reservation and seats,
    // allowing the request to succeed.
    const res = await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${userToken1}`)
      .set('Idempotency-Key', 'jest-cleanup-reserve-retry')
      .send({
        eventId: activeEvent1._id.toString(),
        seatNumbers: ['A1'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify User 1's old reservation is EXPIRED
    const oldRes = await Reservation.findById(reservation._id);
    expect(oldRes?.status).toBe(ReservationStatus.EXPIRED);

    // Verify new reservation is ACTIVE and owns A1
    const newRes = await Reservation.findById(res.body.data.reservationId);
    expect(newRes?.status).toBe(ReservationStatus.ACTIVE);
    expect(newRes?.seatNumbers).toEqual(['A1']);

    const seat = await Seat.findById(seatA1!._id);
    expect(seat?.status).toBe(SeatStatus.RESERVED);
    expect(seat?.reservationId?.toString()).toBe(newRes?._id.toString());
  });

  // ── 7. TTL Delay Scenario ────────────────────────────────────────────────────
  test('7. TTL delay scenario: works even if expired reservation document still exists', async () => {
    // Setup: Create a reservation that is expired but the document is still in DB (TTL has not run)
    const seat = await Seat.findOne({ eventId: activeEvent1._id, seatNumber: 'A3' });
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent1._id,
      seatNumbers: ['A3'],
      seatIds: [seat!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });

    await Seat.updateOne(
      { _id: seat!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date(), reservationId: reservation._id } }
    );

    // Make the reservation expired in DB, simulating TTL delay
    await Reservation.updateOne(
      { _id: reservation._id },
      { $set: { expiresAt: new Date(Date.now() - 5000) } }
    );

    // Execute cleanup
    const result = await cleanupExpiredReservations();
    expect(result.expiredReservationsProcessed).toBe(1);
    expect(result.seatsReleased).toBe(1);

    // The document should still exist (cleanup doesn't delete it, just updates status to EXPIRED)
    const dbReservation = await Reservation.findById(reservation._id);
    expect(dbReservation).not.toBeNull();
    expect(dbReservation?.status).toBe(ReservationStatus.EXPIRED);

    // The seats must be fully released
    const dbSeat = await Seat.findById(seat!._id);
    expect(dbSeat?.status).toBe(SeatStatus.AVAILABLE);
    expect(dbSeat?.reservedBy).toBeNull();
    expect(dbSeat?.reservationId).toBeNull();
  });
});
