import type { EventQueryFilters } from '../types/event.types';

export const queryKeys = {
  events: ['events'] as const,
  eventList: (filters: EventQueryFilters) => ['events', filters] as const,
  event: (id: string) => ['event', id] as const,
  reservation: ['reservation'] as const,
  booking: ['booking'] as const,
  bookingHistory: (filters: any) => ['bookings', 'history', filters] as const,
};
