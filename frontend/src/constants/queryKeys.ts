export const queryKeys = {
  events: ['events'] as const,
  eventList: (page: number, date?: string) => ['events', page, date] as const,
  event: (id: string) => ['event', id] as const,
  reservation: ['reservation'] as const,
  booking: ['booking'] as const,
};
