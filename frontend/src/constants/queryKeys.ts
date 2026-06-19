export const queryKeys = {
  events: ['events'] as const,
  eventList: (page: number, limit?: number, date?: string) => ['events', page, limit, date] as const,
  event: (id: string) => ['event', id] as const,
  reservation: ['reservation'] as const,
  booking: ['booking'] as const,
};
