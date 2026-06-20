import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { EventService } from '../services/eventService';
import type { EventQueryFilters, EventSortOption } from '../types/event.types';

/**
 * GET /api/events
 * Public - Get all active events with pagination, search, filtering, and sorting
 */
export const getAllEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const filters: EventQueryFilters = {
      page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
      limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
      date: req.query['date'] ? (req.query['date'] as string) : undefined,
      search: req.query['search'] ? (req.query['search'] as string) : undefined,
      city: req.query['city'] ? (req.query['city'] as string) : undefined,
      sort: req.query['sort'] ? (req.query['sort'] as EventSortOption) : undefined,
    };

    const { events, pagination, filters: appliedFilters } = await EventService.getAllEvents(filters);

    res
      .status(200)
      .json(ApiResponse.ok('Events retrieved successfully', { events, pagination, filters: appliedFilters }));
  },
);

/**
 * GET /api/events/:id
 * Public - Get details of a single active event and all of its seats
 */
export const getEventById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params['id'] as string;
    const { event, seats } = await EventService.getEventWithSeats(eventId);

    res
      .status(200)
      .json(ApiResponse.ok('Event details retrieved successfully', { event, seats }));
  },
);
