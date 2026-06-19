import { isValidObjectId, Types } from 'mongoose';
import { Event } from '../models/Event';
import { Seat } from '../models/Seat';
import { ApiError } from '../utils/ApiError';
import type {
  EventQueryFilters,
  PaginatedEventsResult,
  EventDetailsResult,
  MappedEvent,
  SeatResponse,
} from '../types/event.types';
import { cleanupExpiredReservations } from './reservationCleanupService';

export class EventService {
  /**
   * Fetch all active events with pagination and count of available seats.
   * Uses an optimized aggregation pipeline to prevent N+1 queries.
   */
  public static async getAllEvents(filters: EventQueryFilters): Promise<PaginatedEventsResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    // Build the query matching active events (and date range if specified)
    const matchQuery: Record<string, unknown> = { isActive: true };

    if (filters.date) {
      // YYYY-MM-DD input is parsed to cover the entire day in UTC
      const startOfDay = new Date(`${filters.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${filters.date}T23:59:59.999Z`);
      matchQuery['dateTime'] = { $gte: startOfDay, $lte: endOfDay };
    }

    // 1. Get total items matching criteria for pagination metadata.
    // Hits index: idx_event_isActive_dateTime (or its prefix)
    const totalItems = await Event.countDocuments(matchQuery);

    // 2. Aggregate events
    // PERFORMANCE CHOICE: We place pagination stages ($skip/$limit) BEFORE the $lookup stage.
    // This limits the count calculation only to the current page (max 50 events) instead of the entire collection,
    // saving significant database execution and memory.
    const events = await Event.aggregate<MappedEvent>([
      { $match: matchQuery },
      { $sort: { dateTime: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        // PERFORMANCE CHOICE: Perform a highly-targeted $lookup that uses the compound index
        // { eventId: 1, status: 1 } on the 'seats' collection via the nested count pipeline.
        // This calculates available seats at the DB level, avoiding loading seat documents into memory.
        $lookup: {
          from: 'seats',
          let: { eventId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$eventId', '$$eventId'] },
                    { $eq: ['$status', 'AVAILABLE'] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'availableSeatsCount',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          venue: 1,
          dateTime: 1,
          totalSeats: 1,
          image: 1,
          category: 1,
          price: 1,
          location: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          availableSeats: {
            $ifNull: [
              { $arrayElemAt: ['$availableSeatsCount.count', 0] },
              0,
            ],
          },
        },
      },
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      events,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Fetch an individual event by its ID and return it alongside all seat configurations.
   */
  public static async getEventWithSeats(eventIdStr: string): Promise<EventDetailsResult> {
    // 1. Validate ObjectId structure to prevent CastError
    if (!isValidObjectId(eventIdStr)) {
      throw ApiError.badRequest('Invalid event id');
    }

    const eventId = new Types.ObjectId(eventIdStr);

    // 2. Run cleanup of expired reservations for this event before fetching seats
    await cleanupExpiredReservations({ eventId });

    // 3. Fetch the event
    // Hits index: _id_
    const event = await Event.findById(eventId).lean();
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // 3. Enforce isActive check (410 Gone if false)
    if (!event.isActive) {
      throw new ApiError(410, 'Event is no longer available');
    }

    // 4. Retrieve and project only necessary fields for seats
    // Hits index: idx_seat_eventId_status (prefix eventId)
    const seats = await Seat.find({ eventId })
      .select('_id seatNumber status')
      .lean();

    // 5. Map seat properties including derived rows/numbers, and map status to lowercase
    const mappedSeats: SeatResponse[] = seats.map((seat) => {
      const seatNumber = seat.seatNumber;
      const row = seatNumber.charAt(0);
      const number = parseInt(seatNumber.slice(1), 10);
      return {
        _id: seat._id.toString(),
        seatNumber,
        row,
        number,
        status: seat.status.toLowerCase(),
      };
    });

    return {
      event: {
        _id: event._id.toString(),
        name: event.name,
        description: event.description,
        venue: event.venue,
        dateTime: event.dateTime,
        totalSeats: event.totalSeats,
        image: event.image,
        category: event.category,
        price: event.price,
        location: event.location,
        isActive: event.isActive,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
      seats: mappedSeats,
    };
  }
}
