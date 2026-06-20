import apiClient from './client';
import type { ApiResponse } from '../types/index';
import type { EventDetailsResult, EventQueryFilters, MappedEvent } from '../types/event.types';

export async function getEventsApi(filters: EventQueryFilters = {}): Promise<ApiResponse<{ events: MappedEvent[], pagination: any, filters?: any }>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.date) params.append('date', filters.date);
  if (filters.search) params.append('search', filters.search);
  if (filters.city) params.append('city', filters.city);
  if (filters.sort) params.append('sort', filters.sort);

  const response = await apiClient.get<ApiResponse<{ events: MappedEvent[], pagination: any, filters?: any }>>('/events', { params });
  return response.data;
}

export async function getEventApi(eventId: string): Promise<ApiResponse<EventDetailsResult>> {
  const response = await apiClient.get<ApiResponse<EventDetailsResult>>(`/events/${eventId}`);
  return response.data;
}
