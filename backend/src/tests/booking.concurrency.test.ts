import mongoose from 'mongoose';
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

describe('Booking Confirmation Concurrency & Integration Tests', () => {
  let testUser1: any;
  let testUser2: any;
  let activeEvent: any;
  let userToken1: string;
  const testUserIds: mongoose.Types.ObjectId[] = [];

  beforeAll(async () => {
    // 1. Establish database connection if not already active
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // 2. Clean up test records
    await User.deleteMany({ email: /test-jest-booking-.*@example.com/ });
    await Event.deleteMany({ name: /Test Jest Booking Event.*/ });
    await Reservation.deleteMany({});

    // 3. Seed Test Users
    testUser1 = await User.create({
      name: 'Jest Booking User 1',
      email: 'test-jest-booking-user1@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.USER,
    });
    testUserIds.push(testUser1._id);

    testUser2 = await User.create({
      name: 'Jest Booking User 2',
      email: 'test-jest-booking-user2@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.USER,
    });
    testUserIds.push(testUser2._id);

    // 4. Seed Test Event
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    activeEvent = await Event.create({
      name: 'Test Jest Booking Event Active',
      description: 'Active event for Jest booking testing',
      venue: 'Booking Arena',
      dateTime: futureDate,
      totalSeats: 10,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      category: 'Concert',
      price: 500,
      location: 'Mumbai',
      isActive: true,
    });

    // 5. Populate Seats
    const seatNumbers = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    for (const seatNumber of seatNumbers) {
      await Seat.create({
        eventId: activeEvent._id,
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
    await User.deleteMany({ email: /test-jest-booking-.*@example.com/ });
    await Event.deleteMany({ name: /Test Jest Booking Event.*/ });
    await Reservation.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Reset seats and reservations before each test case for test isolation
    await Reservation.deleteMany({});
    await Seat.updateMany({}, { $set: { status: SeatStatus.AVAILABLE, reservedBy: null, reservedAt: null } });
  });

  // ─────────────────────────────────────────────────────────────
  //  Integration Tests
  // ─────────────────────────────────────────────────────────────

  test('1. Successful booking confirmation succeeds', async () => {
    // Setup: Create an active reservation on A1 for User 1
    const seatA1 = await Seat.findOne({ eventId: activeEvent._id, seatNumber: 'A1' });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent._id,
      seatNumbers: ['A1'],
      seatIds: [seatA1!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt,
    });

    await Seat.updateOne(
      { _id: seatA1!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date() } },
    );

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reservationId: reservation._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingId).toBe(reservation._id.toString());
    expect(res.body.data.bookingReference).toMatch(/^SMS-\d{4}-\d{6}$/);
    expect(res.body.data.eventName).toBe(activeEvent.name);
    expect(res.body.data.seatNumbers).toEqual(['A1']);

    // Verify database state: seat status is BOOKED, reservation status is COMPLETED
    const updatedSeat = await Seat.findById(seatA1!._id);
    expect(updatedSeat?.status).toBe(SeatStatus.BOOKED);
    expect(updatedSeat?.reservedBy).toBeNull();

    const updatedRes = await Reservation.findById(reservation._id);
    expect(updatedRes?.status).toBe(ReservationStatus.COMPLETED);
    expect(updatedRes?.bookingReference).toBe(res.body.data.bookingReference);
    expect(updatedRes?.bookedAt).toBeDefined();
  });

  test('2. Invalid reservationId returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reservationId: 'invalid-id-format',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
  });

  test('3. Reservation not found returns 403 Forbidden', async () => {
    const randomObjectId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reservationId: randomObjectId,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Reservation does not belong to current user');
  });

  test('4. Reservation belongs to another user returns 403 Forbidden', async () => {
    // Create reservation for User 2
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser2._id,
      eventId: activeEvent._id,
      seatNumbers: ['A1'],
      seatIds: [new mongoose.Types.ObjectId()],
      status: ReservationStatus.ACTIVE,
      expiresAt,
    });

    // User 1 tries to confirm User 2's reservation
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reservationId: reservation._id.toString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Reservation does not belong to current user');
  });

  test('5. Reservation already completed returns 409 Conflict', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent._id,
      seatNumbers: ['A1'],
      seatIds: [new mongoose.Types.ObjectId()],
      status: ReservationStatus.COMPLETED,
      bookingReference: 'SMS-2026-111111',
      expiresAt,
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reservationId: reservation._id.toString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Reservation already confirmed');
  });

  test('6. Reservation cancelled returns 409 Conflict', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent._id,
      seatNumbers: ['A1'],
      seatIds: [new mongoose.Types.ObjectId()],
      status: ReservationStatus.CANCELLED,
      expiresAt,
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reservationId: reservation._id.toString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Reservation already cancelled');
  });

  test('7. Reservation expired returns 410 Gone', async () => {
    // Expiration date is in the past, bypass isNew validation by updating it after creation
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent._id,
      seatNumbers: ['A1'],
      seatIds: [new mongoose.Types.ObjectId()],
      status: ReservationStatus.ACTIVE,
      expiresAt: futureDate,
    });

    await Reservation.updateOne(
      { _id: reservation._id },
      { $set: { expiresAt: new Date(Date.now() - 5000) } }
    );

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reservationId: reservation._id.toString(),
      });

    expect(res.status).toBe(410);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Reservation expired');

    // Verify reservation status in DB is updated to EXPIRED
    const updatedRes = await Reservation.findById(reservation._id);
    expect(updatedRes?.status).toBe(ReservationStatus.EXPIRED);
  });

  test('8. Seat state inconsistency detected returns 500 Server Error', async () => {
    const seatA2 = await Seat.findOne({ eventId: activeEvent._id, seatNumber: 'A2' });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent._id,
      seatNumbers: ['A2'],
      seatIds: [seatA2!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt,
    });

    // Inconsistency: Seat is AVAILABLE instead of RESERVED in the database
    await Seat.updateOne({ _id: seatA2!._id }, { $set: { status: SeatStatus.AVAILABLE } });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reservationId: reservation._id.toString(),
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Seat state inconsistency detected');
  });

  // ─────────────────────────────────────────────────────────────
  //  Concurrency Tests
  // ─────────────────────────────────────────────────────────────

  test('9. Simultaneous booking requests (concurrency race)', async () => {
    // Setup: Create reservation on A3 for User 1
    const seatA3 = await Seat.findOne({ eventId: activeEvent._id, seatNumber: 'A3' });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: testUser1._id,
      eventId: activeEvent._id,
      seatNumbers: ['A3'],
      seatIds: [seatA3!._id],
      status: ReservationStatus.ACTIVE,
      expiresAt,
    });

    await Seat.updateOne(
      { _id: seatA3!._id },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date() } },
    );

    // Two requests confirming the exact same reservation
    const request1 = () =>
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          reservationId: reservation._id.toString(),
        });

    const request2 = () =>
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          reservationId: reservation._id.toString(),
        });

    const results = await Promise.allSettled([request1(), request2()]);

    const resolved = results.map((r) => {
      if (r.status === 'fulfilled') return r.value;
      throw r.reason;
    });

    const successRes = resolved.find((r) => r.status === 200);
    const failureRes = resolved.find((r) => r.status === 409);

    // Exactly one succeeds, one fails with 409 Conflict
    expect(successRes).toBeDefined();
    expect(failureRes).toBeDefined();

    expect(successRes?.body.success).toBe(true);
    expect(failureRes?.body.success).toBe(false);
    expect(failureRes?.body.message).toBe('Reservation already confirmed');

    // Verify seats: BOOKED
    const updatedSeat = await Seat.findById(seatA3!._id);
    expect(updatedSeat?.status).toBe(SeatStatus.BOOKED);

    // Verify reservation status: COMPLETED
    const updatedRes = await Reservation.findById(reservation._id);
    expect(updatedRes?.status).toBe(ReservationStatus.COMPLETED);

    // Verify single booking reference exists
    expect(updatedRes?.bookingReference).toBeDefined();
    expect(updatedRes?.bookingReference).toMatch(/^SMS-\d{4}-\d{6}$/);
  }, 30000);
});
