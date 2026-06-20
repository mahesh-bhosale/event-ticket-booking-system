import { Reservation, ReservationStatus } from '../models/Reservation';
import { Event } from '../models/Event';
import { Types } from 'mongoose';
import type { BookingHistoryQuery, BookingHistoryResponse, BookingHistoryItem } from '../types/bookingHistory.types';
import type { EventDocument } from '../models/Event';

export class BookingHistoryService {
  /**
   * Fetches completed bookings for an authenticated user, supports pagination,
   * keyword search (by booking reference or event name), and time range filtering.
   */
  public static async getBookingHistory(
    userIdStr: string,
    filters: BookingHistoryQuery,
  ): Promise<BookingHistoryResponse> {
    const userId = new Types.ObjectId(userIdStr);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    // ── Build query ───────────────────────────────────────────
    const query: any = {
      userId,
      status: ReservationStatus.COMPLETED,
    };

    // ── Apply time range filter ──────────────────────────────
    if (filters.timeRange && filters.timeRange !== 'all') {
      const days = parseInt(filters.timeRange, 10);
      if (!isNaN(days)) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        query.bookedAt = { $gte: dateLimit };
      }
    }

    // ── Apply search filter ──────────────────────────────────
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      
      // Pre-query matching event ids for query performance (reduces joins)
      const matchingEvents = await Event.find({
        name: { $regex: searchRegex }
      })
        .select('_id')
        .lean()
        .exec();
      
      const eventIds = matchingEvents.map((evt) => evt._id);

      query.$or = [
        { bookingReference: { $regex: searchRegex } },
        { eventId: { $in: eventIds } }
      ];
    }

    // ── Database Queries ──────────────────────────────────────
    const [bookingsData, total] = await Promise.all([
      Reservation.find(query)
        .sort({ bookedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('bookingReference bookedAt eventId seatNumbers status')
        .populate({
          path: 'eventId',
          select: 'name venue dateTime',
        })
        .lean()
        .exec(),
      Reservation.countDocuments(query).exec(),
    ]);

    // ── Transform data ────────────────────────────────────────
    const bookings: BookingHistoryItem[] = bookingsData.map((booking: any) => {
      const event = booking.eventId as unknown as EventDocument | null;
      return {
        bookingReference: booking.bookingReference ?? '',
        bookedAt: booking.bookedAt ?? booking.createdAt,
        eventName: event?.name ?? 'Unknown Event',
        venue: event?.venue ?? 'Unknown Venue',
        eventDate: event?.dateTime ?? new Date(),
        seatNumbers: booking.seatNumbers ?? [],
        totalSeats: booking.seatNumbers?.length ?? 0,
        bookingStatus: booking.status,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}

export default BookingHistoryService;
