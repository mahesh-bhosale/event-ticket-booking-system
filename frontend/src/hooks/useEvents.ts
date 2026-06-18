import { useQuery } from '@tanstack/react-query';
import { getEventsApi } from '../api/events';
import type { EventQueryFilters } from '../types/event.types';

export function useEvents(filters: EventQueryFilters = {}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => getEventsApi(filters),
    placeholderData: (previousData) => previousData, // smooth pagination transitions
  });
}
export default useEvents;
