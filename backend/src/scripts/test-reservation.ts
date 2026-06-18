import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../app';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Seat } from '../models/Seat';
import { Reservation } from '../models/Reservation';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { UserRole } from '../types/user.types';
import { SeatStatus } from '../types/seat.types';

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

// Helper for HTTP requests
async function makeRequest(
  url: string,
  options: {
    method: string;
    headers?: Record<string, string>;
    body?: any;
  },
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch (err) {}

  return {
    status: response.status,
    json,
    text,
  };
}

async function runTests() {
  console.log('🚀 Starting seat reservation system tests…\n');

  // 1. Connect to Database
  const mongoUri = process.env['MONGODB_URI'];
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in env variables');
  }
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  // 2. Start Express Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`✅ Express server listening on port ${PORT}`);
      resolve();
    });
  });

  let testUser: any;
  let activeEvent: any;
  let inactiveEvent: any;
  let validToken: string;
  let expiredToken: string;

  try {
    // 3. Seed Test Data
    console.log('\n🧹 Cleaning up test data…');
    await User.deleteMany({ email: /test-res-.*@example.com/ });
    await Event.deleteMany({ name: /Test Res Event.*/ });
    await Reservation.deleteMany({});
    await IdempotencyKey.deleteMany({});

    console.log('🌱 Seeding test models…');

    // Create user
    testUser = await User.create({
      name: 'Test Reservation User',
      email: 'test-res-user@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.USER,
    });

    // Create active event
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    activeEvent = await Event.create({
      name: 'Test Res Event Active',
      description: 'Active event for reservation testing',
      venue: 'Test Stadium',
      dateTime: twoWeeksFromNow,
      totalSeats: 10,
      isActive: true,
    });

    // Create inactive event
    inactiveEvent = await Event.create({
      name: 'Test Res Event Inactive',
      description: 'Inactive event for reservation testing',
      venue: 'Test Theatre',
      dateTime: twoWeeksFromNow,
      totalSeats: 10,
      isActive: false,
    });

    // Create seats for events
    const seatNumbers = ['A1', 'A2', 'A3', 'A4', 'A5'];
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

    // Generate JWT tokens
    const jwtSecret = process.env['JWT_SECRET'] ?? 'default_secret_longer_than_thirty_two_chars';
    validToken = jwt.sign(
      { userId: testUser._id.toString(), email: testUser.email, role: testUser.role },
      jwtSecret,
      { expiresIn: '15m' },
    );
    expiredToken = jwt.sign(
      { userId: testUser._id.toString(), email: testUser.email, role: testUser.role },
      jwtSecret,
      { expiresIn: '-1s' }, // Expired token
    );

    console.log('✅ Seeding complete\n');

    // ─── Test cases ──────────────────────────────────────────

    // Test Case 1: Single seat reservation
    console.log('🧪 Test Case 1: Single seat reservation…');
    const res1 = await makeRequest(`${BASE_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Idempotency-Key': 'key-tc1-single',
      },
      body: {
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A1'],
      },
    });
    console.log(`   Status: ${res1.status}`);
    console.log(`   Response: ${JSON.stringify(res1.json)}`);
    if (res1.status !== 200 || !res1.json.success) {
      throw new Error('Test Case 1 failed!');
    }
    console.log('   ✔ Passed\n');

    // Test Case 2: Multi-seat reservation
    console.log('🧪 Test Case 2: Multi-seat reservation…');
    // We clean active reservations because a user can only have 1 active reservation per event
    await Reservation.deleteMany({});
    await Seat.updateMany({ eventId: activeEvent._id }, { status: SeatStatus.AVAILABLE, reservedBy: null });
    
    const res2 = await makeRequest(`${BASE_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Idempotency-Key': 'key-tc2-multi',
      },
      body: {
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A2', 'A3'],
      },
    });
    console.log(`   Status: ${res2.status}`);
    console.log(`   Response: ${JSON.stringify(res2.json)}`);
    if (res2.status !== 200 || !res2.json.success || res2.json.data.seatNumbers.length !== 2) {
      throw new Error('Test Case 2 failed!');
    }
    console.log('   ✔ Passed\n');

    // Test Case 3: Invalid eventId
    console.log('🧪 Test Case 3: Invalid eventId…');
    const res3 = await makeRequest(`${BASE_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Idempotency-Key': 'key-tc3-invalid-id',
      },
      body: {
        eventId: 'invalid-object-id',
        seatNumbers: ['A4'],
      },
    });
    console.log(`   Status: ${res3.status}`);
    console.log(`   Response: ${JSON.stringify(res3.json)}`);
    if (res3.status !== 400 || res3.json.message !== 'Validation failed' || !res3.json.errors.includes('eventId must be a valid ObjectId')) {
      throw new Error('Test Case 3 failed!');
    }
    console.log('   ✔ Passed\n');

    // Test Case 4: Inactive event
    console.log('🧪 Test Case 4: Inactive event…');
    const res4 = await makeRequest(`${BASE_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Idempotency-Key': 'key-tc4-inactive',
      },
      body: {
        eventId: inactiveEvent._id.toString(),
        seatNumbers: ['A1'],
      },
    });
    console.log(`   Status: ${res4.status}`);
    console.log(`   Response: ${JSON.stringify(res4.json)}`);
    if (res4.status !== 410 || res4.json.message !== 'Event is no longer available') {
      throw new Error('Test Case 4 failed!');
    }
    console.log('   ✔ Passed\n');

    // Test Case 5: Seat already reserved
    console.log('🧪 Test Case 5: Seat already reserved…');
    // First, let's create another user to trigger a reservation on A2 (already reserved by testUser)
    const secondUser = await User.create({
      name: 'Second User',
      email: 'test-res-user2@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.USER,
    });
    const secondUserToken = jwt.sign(
      { userId: secondUser._id.toString(), email: secondUser.email, role: secondUser.role },
      jwtSecret,
      { expiresIn: '15m' },
    );

    const res5 = await makeRequest(`${BASE_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secondUserToken}`,
        'Idempotency-Key': 'key-tc5-already-reserved',
      },
      body: {
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A2', 'A4'], // A2 is reserved, A4 is available
      },
    });
    console.log(`   Status: ${res5.status}`);
    console.log(`   Response: ${JSON.stringify(res5.json)}`);
    if (res5.status !== 409 || !res5.json.data.unavailableSeats.includes('A2')) {
      throw new Error('Test Case 5 failed!');
    }
    // Verify rollback (A4 should remain AVAILABLE)
    const seatA4 = await Seat.findOne({ eventId: activeEvent._id, seatNumber: 'A4' }).lean();
    if (seatA4?.status !== SeatStatus.AVAILABLE) {
      throw new Error('Rollback failed! A4 was reserved but should have rolled back.');
    }
    console.log('   ✔ Passed (Rollback verified)\n');

    // Test Case 6: Duplicate active reservation
    console.log('🧪 Test Case 6: Duplicate active reservation…');
    // testUser already has reservation for activeEvent
    const res6 = await makeRequest(`${BASE_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Idempotency-Key': 'key-tc6-duplicate-res',
      },
      body: {
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A4'],
      },
    });
    console.log(`   Status: ${res6.status}`);
    console.log(`   Response: ${JSON.stringify(res6.json)}`);
    if (res6.status !== 409 || res6.json.message !== 'You already have an active reservation for this event') {
      throw new Error('Test Case 6 failed!');
    }
    console.log('   ✔ Passed\n');

    // Test Case 7: Missing auth token
    console.log('🧪 Test Case 7: Missing auth token…');
    const res7 = await makeRequest(`${BASE_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': 'key-tc7-missing-auth',
      },
      body: {
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A4'],
      },
    });
    console.log(`   Status: ${res7.status}`);
    console.log(`   Response: ${JSON.stringify(res7.json)}`);
    if (res7.status !== 401 || res7.json.message !== 'Missing or malformed Authorization header') {
      throw new Error('Test Case 7 failed!');
    }
    console.log('   ✔ Passed\n');

    // Test Case 8: Expired token
    console.log('🧪 Test Case 8: Expired token…');
    const res8 = await makeRequest(`${BASE_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
        'Idempotency-Key': 'key-tc8-expired-auth',
      },
      body: {
        eventId: activeEvent._id.toString(),
        seatNumbers: ['A4'],
      },
    });
    console.log(`   Status: ${res8.status}`);
    console.log(`   Response: ${JSON.stringify(res8.json)}`);
    if (res8.status !== 401 || res8.json.message !== 'Token expired') {
      throw new Error('Test Case 8 failed!');
    }
    console.log('   ✔ Passed\n');

    // Test Case 9: Concurrent requests
    console.log('🧪 Test Case 9: 50 Concurrent requests attempting same seat (A5)…');
    
    // We create 50 separate users so they do not hit the duplicate active reservation check!
    const concurrentUsers: any[] = [];
    const concurrentTokens: string[] = [];
    for (let i = 0; i < 50; i++) {
      const user = await User.create({
        name: `Concurrent User ${i}`,
        email: `test-res-concurrent-${i}@example.com`,
        passwordHash: 'hashedpassword',
        role: UserRole.USER,
      });
      concurrentUsers.push(user);
      concurrentTokens.push(
        jwt.sign(
          { userId: user._id.toString(), email: user.email, role: user.role },
          jwtSecret,
          { expiresIn: '15m' },
        ),
      );
    }

    // Fire 50 concurrent requests trying to book seat A5
    const promises = concurrentTokens.map((token, index) => {
      return makeRequest(`${BASE_URL}/reserve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': `key-tc9-concurrent-${index}`,
        },
        body: {
          eventId: activeEvent._id.toString(),
          seatNumbers: ['A5'],
        },
      });
    });

    const results = await Promise.all(promises);

    let successes = 0;
    let conflicts = 0;
    let others = 0;

    results.forEach((res) => {
      if (res.status === 200 && res.json.success) {
        successes++;
      } else if (res.status === 409 && res.json.message === 'Some seats are no longer available') {
        conflicts++;
      } else {
        others++;
      }
    });

    console.log(`   Successes (should be 1)                 : ${successes}`);
    console.log(`   Conflicts (should be 49)               : ${conflicts}`);
    console.log(`   Other status codes (should be 0)       : ${others}`);

    if (successes !== 1 || conflicts !== 49 || others !== 0) {
      throw new Error(`Test Case 9 failed! Expected exactly 1 success and 49 conflicts, got ${successes} and ${conflicts}`);
    }
    console.log('   ✔ Passed (Concurrency safety verified successfully! Only 1 booking allowed.)\n');

    console.log('🎉 All 9 test cases passed successfully!');
  } finally {
    // 4. Cleanup & Shutdown
    console.log('🔌 Shutting down server and closing database connection…');
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('   ✔ Express server stopped');
        resolve();
      });
    });
    await mongoose.connection.close();
    console.log('   ✔ MongoDB connection closed');
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
