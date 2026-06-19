import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { AdminService } from '../services/adminService';

export const getAllEvents = asyncHandler(async (_req: Request, res: Response) => {
  const events = await AdminService.getAllEvents();
  res.status(200).json(ApiResponse.ok('Admin events retrieved successfully', events));
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await AdminService.createEvent(req.body);
  res.status(201).json(ApiResponse.ok('Event created successfully', event));
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params['id'] as string;
  const event = await AdminService.updateEvent(eventId, req.body);
  res.status(200).json(ApiResponse.ok('Event updated successfully', event));
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params['id'] as string;
  await AdminService.deleteEvent(eventId);
  res.status(200).json(ApiResponse.ok('Event and associated available seats deleted successfully', null));
});
