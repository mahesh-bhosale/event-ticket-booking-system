import { isValidObjectId, Types } from 'mongoose';
import { Event } from '../models/Event';
import { Seat } from '../models/Seat';
import { Reservation } from '../models/Reservation';
import { ApiError } from '../utils/ApiError';
import type { IEvent } from '../types/event.types';

// Hardcoded seat rows A-H, columns 1-10 (80 seats) matches seed.ts
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
const COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function generateSeatNumbers(): string[] {
  const seats: string[] = [];
  for (const row of ROWS) {
    for (const col of COLUMNS) {
      seats.push(`${row}${col}`);
    }
  }
  return seats;
}

export class AdminService {
  /**
   * Get all events, including inactive ones, without seat aggregation for speed
   */
  public static async getAllEvents() {
    return Event.find().sort({ createdAt: -1 }).lean();
  }

  /**
   * Create an event and automatically generate its 80 seats
   */
  public static async createEvent(data: Partial<IEvent>) {
    // 1. Insert Event
    const event = await Event.create(data);

    // 2. Generate and Insert Seats
    const seatNumbers = generateSeatNumbers();
    const seatDocs = seatNumbers.map((seatNumber) => ({
      eventId: event._id,
      seatNumber,
      status: 'AVAILABLE',
      version: 0,
    }));

    await Seat.insertMany(seatDocs);

    return event;
  }

  /**
   * Update an event's details
   */
  public static async updateEvent(eventIdStr: string, data: Partial<IEvent>) {
    if (!isValidObjectId(eventIdStr)) throw ApiError.badRequest('Invalid event id');
    
    const event = await Event.findByIdAndUpdate(eventIdStr, data, { new: true, runValidators: true });
    if (!event) throw ApiError.notFound('Event not found');

    return event;
  }

  /**
   * Delete an event only if there are no active bookings or reservations
   */
  public static async deleteEvent(eventIdStr: string) {
    if (!isValidObjectId(eventIdStr)) throw ApiError.badRequest('Invalid event id');
    
    const eventId = new Types.ObjectId(eventIdStr);

    // 1. Check for booked or reserved seats
    const busySeats = await Seat.exists({
      eventId,
      status: { $in: ['RESERVED', 'BOOKED'] }
    });

    if (busySeats) {
      throw ApiError.badRequest('Cannot delete event with existing bookings or active reservations');
    }

    // 2. We can safely delete
    await Seat.deleteMany({ eventId });
    await Reservation.deleteMany({ eventId });
    const result = await Event.findByIdAndDelete(eventId);
    
    if (!result) throw ApiError.notFound('Event not found');

    return true;
  }
}
