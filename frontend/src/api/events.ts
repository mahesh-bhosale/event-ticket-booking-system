import apiClient from './client';
import type { ApiResponse } from '../types/index';
import type { EventDetailsResult, MappedEvent } from '../types/event.types';

export async function getEventsApi(filters: {
  page?: number;
  limit?: number;
  date?: string;
} = {}): Promise<ApiResponse<{ events: MappedEvent[] }>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.date) params.append('date', filters.date);

  const response = await apiClient.get<ApiResponse<{ events: MappedEvent[] }>>('/events', { params });
  return response.data;
}

export async function getEventApi(eventId: string): Promise<ApiResponse<EventDetailsResult>> {
  const response = await apiClient.get<ApiResponse<EventDetailsResult>>(`/events/${eventId}`);
  return response.data;
}
