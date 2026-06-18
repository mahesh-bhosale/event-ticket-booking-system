export const queryKeys = {
  events: ['events'] as const,
  eventList: (page: number) => ['events', page] as const,
  event: (id: string) => ['event', id] as const,
  reservation: ['reservation'] as const,
  booking: ['booking'] as const,
};
