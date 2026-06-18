import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { EventService } from '../services/eventService';
import type { EventQueryFilters } from '../types/event.types';

/**
 * GET /api/events
 * Public - Get all active events with pagination and optional date filter
 */
export const getAllEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const filters: EventQueryFilters = {
      page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
      limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
      date: req.query['date'] ? (req.query['date'] as string) : undefined,
    };

    const { events, pagination } = await EventService.getAllEvents(filters);

    res
      .status(200)
      .json(ApiResponse.ok('Events retrieved successfully', { events, pagination }));
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
