import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Seat } from '../models/Seat';
import { Reservation } from '../models/Reservation';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { UserRole } from '../types/user.types';
import { SeatStatus } from '../types/seat.types';
import { env } from '../config/env';

describe('Seat Reservation Concurrency & Integration Tests', () => {
  let testUser1: any;
  let testUser2: any;
  let activeEvent: any;
  let inactiveEvent: any;
  let userToken1: string;
  let userToken2: string;
  let expiredToken: string;
  const testUserIds: mongoose.Types.ObjectId[] = [];

  beforeAll(async () => {
    // 1. Establish database connection if not already active
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // 2. Clean up any existing test records
    await User.deleteMany({ email: /test-jest-.*@example.com/ });
    await Event.deleteMany({ name: /Test Jest Event.*/ });
    await Reservation.deleteMany({});
    await IdempotencyKey.deleteMany({});

    // 3. Seed Test Users
    testUser1 = await User.create({
      name: 'Jest User 1',
      email: 'test-jest-user1@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.USER,
    });
    testUserIds.push(testUser1._id);

    testUser2 = await User.create({
      name: 'Jest User 2',
      email: 'test-jest-user2@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.USER,
    });
    testUserIds.push(testUser2._id);

    // 4. Seed Test Events
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    activeEvent = await Event.create({
      name: 'Test Jest Event Active',
      description: 'Active event for Jest testing',
      venue: 'Jest Arena',
      dateTime: futureDate,
      totalSeats: 10,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      category: 'Concert',
      price: 500,
      location: 'Mumbai',
      isActive: true,
    });

    inactiveEvent = await Event.create({
      name: 'Test Jest Event Inactive',
      description: 'Inactive event for Jest testing',
      venue: 'Jest Theatre',
      dateTime: futureDate,
      totalSeats: 10,
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      category: 'Concert',
      price: 300,
      location: 'Pune',
      isActive: false,
    });

    // 5. Populate Seats
    const seatNumbers = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    for (const seatNumber of seatNumbers) {
      await Seat.create({
        eventId: activeEvent._id,
        seatNumber,
        status: SeatStatus.AVAILABLE,
      });
      await Seat.create({
        eventId: inactiveEvent._id,
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
    userToken2 = jwt.sign(
      { userId: testUser2._id.toString(), email: testUser2.email, role: testUser2.role },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );
    expiredToken = jwt.sign(
      { userId: testUser1._id.toString(), email: testUser1.email, role: testUser1.role },
      env.JWT_SECRET,
      { expiresIn: '-10s' },
    );
  });

  afterAll(async () => {
    // Clean up test records and disconnect
    await User.deleteMany({ email: /test-jest-.*@example.com/ });
    await Event.deleteMany({ name: /Test Jest Event.*/ });
    await Reservation.deleteMany({});
    await IdempotencyKey.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Reset seats and reservations before each test case for test isolation
    await Reservation.deleteMany({});
    await IdempotencyKey.deleteMany({});
    await Seat.updateMany({}, { $set: { status: SeatStatus.AVAILABLE, reservedBy: null, reservedAt: null } });
  });

  // ─────────────────────────────────────────────────────────────
  //  Integration Tests
  // ─────────────────────────────────────────────────────────────

  test('1. Single seat reservation succeeds', async () => {
    const res = await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${userToken1}`)
      .set('Idempotency-Key', 'jest-key-single')
      .send({
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A1'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.seatNumbers).toEqual(['A1']);
    expect(res.body.data.expiresInSeconds).toBe(600);

    const seat = await Seat.findOne({ eventId: activeEvent._id, seatNumber: 'A1' });
    expect(seat?.status).toBe(SeatStatus.RESERVED);
    expect(seat?.reservedBy?.toString()).toBe(testUser1._id.toString());
  });

  test('2. Multiple seat reservation succeeds', async () => {
    const res = await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${userToken1}`)
      .set('Idempotency-Key', 'jest-key-multi')
      .send({
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A2', 'A3'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.seatNumbers).toEqual(['A2', 'A3']);

    const seats = await Seat.find({ eventId: activeEvent._id, seatNumber: { $in: ['A2', 'A3'] } });
    expect(seats).toHaveLength(2);
    seats.forEach((seat) => {
      expect(seat.status).toBe(SeatStatus.RESERVED);
      expect(seat.reservedBy?.toString()).toBe(testUser1._id.toString());
    });
  });

  test('3. Seat already reserved triggers rollback and returns 409 Conflict', async () => {
    // User 1 reserves A2 first
    await Seat.updateOne(
      { eventId: activeEvent._id, seatNumber: 'A2' },
      { $set: { status: SeatStatus.RESERVED, reservedBy: testUser1._id, reservedAt: new Date() } },
    );

    // User 2 attempts to reserve A2 and A4 concurrently
    const res = await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${userToken2}`)
      .set('Idempotency-Key', 'jest-key-conflict-rollback')
      .send({
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A2', 'A4'],
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Some seats are no longer available');
    expect(res.body.data.unavailableSeats).toContain('A2');

    // A4 should remain AVAILABLE due to rollback
    const seatA4 = await Seat.findOne({ eventId: activeEvent._id, seatNumber: 'A4' });
    expect(seatA4?.status).toBe(SeatStatus.AVAILABLE);
  });

  test('4. Duplicate active reservation for same event fails with 409', async () => {
    // User 1 makes first reservation on A2
    await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${userToken1}`)
      .set('Idempotency-Key', 'jest-key-dup-1')
      .send({
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A2'],
      });

    // User 1 tries to make second reservation on A4
    const res = await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${userToken1}`)
      .set('Idempotency-Key', 'jest-key-dup-2')
      .send({
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A4'],
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('You already have an active reservation for this event');
  });

  test('5. Invalid event id fails validation with 400', async () => {
    const res = await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${userToken1}`)
      .set('Idempotency-Key', 'jest-key-invalid-id')
      .send({
        eventId: 'invalid-id-format',
        seatNumbers: ['A1'],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
  });

  test('6. Inactive event fails with 410 Gone', async () => {
    const res = await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${userToken1}`)
      .set('Idempotency-Key', 'jest-key-inactive')
      .send({
        eventId: inactiveEvent._id.toString(),
        seatNumbers: ['A1'],
      });

    expect(res.status).toBe(410);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event is no longer available');
  });

  test('7. Missing token fails with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/reserve')
      .set('Idempotency-Key', 'jest-key-missing-auth')
      .send({
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A1'],
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing or malformed Authorization header');
  });

  test('8. Expired token fails with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/reserve')
      .set('Authorization', `Bearer ${expiredToken}`)
      .set('Idempotency-Key', 'jest-key-expired-auth')
      .send({
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A1'],
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Token expired');
  });

  // ─────────────────────────────────────────────────────────────
  //  Concurrency Tests
  // ─────────────────────────────────────────────────────────────

  test('9. Concurrent reservation race (2 concurrent requests)', async () => {
    const request1 = () =>
      request(app)
        .post('/api/reserve')
        .set('Authorization', `Bearer ${userToken1}`)
        .set('Idempotency-Key', 'jest-key-concur-user1')
        .send({
          eventId: activeEvent._id.toString(),
          seatNumbers: ['A5'],
        });

    const request2 = () =>
      request(app)
        .post('/api/reserve')
        .set('Authorization', `Bearer ${userToken2}`)
        .set('Idempotency-Key', 'jest-key-concur-user2')
        .send({
          eventId: activeEvent._id.toString(),
          seatNumbers: ['A5'],
        });

    // Execute concurrently
    const results = await Promise.allSettled([request1(), request2()]);

    const resolved = results.map((r) => {
      if (r.status === 'fulfilled') return r.value;
      throw r.reason;
    });

    const successRes = resolved.find((r) => r.status === 200);
    const failureRes = resolved.find((r) => r.status === 409);

    // Verify exactly one succeeds and one fails
    expect(successRes).toBeDefined();
    expect(failureRes).toBeDefined();

    expect(successRes?.body.success).toBe(true);
    expect(failureRes?.body.success).toBe(false);
    expect(failureRes?.body.message).toBe('Some seats are no longer available');

    // Verify database state: Only one reservation document exists
    const reservations = await Reservation.find({ eventId: activeEvent._id });
    expect(reservations).toHaveLength(1);

    // Verify seat status is RESERVED
    const seat = await Seat.findOne({ eventId: activeEvent._id, seatNumber: 'A5' });
    expect(seat?.status).toBe(SeatStatus.RESERVED);
    expect(testUserIds.map((id) => id.toString())).toContain(seat?.reservedBy?.toString());
  });

  // ─────────────────────────────────────────────────────────────
  //  Stress Test (25 requests)
  // ─────────────────────────────────────────────────────────────

  test('10. Stress test (25 concurrent requests attempting same seat)', async () => {
    // Generate 25 temporary users and tokens to bypass duplicate active reservation checks
    const concurrentTokens: string[] = [];
    for (let i = 0; i < 25; i++) {
      const user = await User.create({
        name: `Stress User ${i}`,
        email: `test-jest-stress-${i}@example.com`,
        passwordHash: 'hashedpassword',
        role: UserRole.USER,
      });
      testUserIds.push(user._id);

      concurrentTokens.push(
        jwt.sign(
          { userId: user._id.toString(), email: user.email, role: user.role },
          env.JWT_SECRET,
          { expiresIn: '1h' },
        ),
      );
    }

    // Fire 25 concurrent requests to seat A6
    const promises = concurrentTokens.map((token, index) => {
      return request(app)
        .post('/api/reserve')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', `jest-key-stress-${index}`)
        .send({
          eventId: activeEvent._id.toString(),
          seatNumbers: ['A6'],
        });
    });

    const results = await Promise.all(promises);

    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;

    results.forEach((res) => {
      if (res.status === 200 && res.body.success) {
        successCount++;
      } else if (res.status === 409 && res.body.message === 'Some seats are no longer available') {
        conflictCount++;
      } else {
        otherCount++;
      }
    });

    // Exactly 1 must succeed and 24 must fail with 409
    expect(successCount).toBe(1);
    expect(conflictCount).toBe(24);
    expect(otherCount).toBe(0);

    // Verify seat is reserved
    const seat = await Seat.findOne({ eventId: activeEvent._id, seatNumber: 'A6' });
    expect(seat?.status).toBe(SeatStatus.RESERVED);

    // Verify only 1 reservation document created for A6
    const reservations = await Reservation.find({ eventId: activeEvent._id, seatNumbers: 'A6' });
    expect(reservations).toHaveLength(1);
  }, 30000);
});
