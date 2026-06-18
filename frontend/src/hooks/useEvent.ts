import { useQuery } from '@tanstack/react-query';
import { getEventApi } from '../api/events';

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEventApi(eventId),
    enabled: !!eventId,
    refetchInterval: 10 * 1000, // Background refresh every 10 seconds for real-time seat availability
  });
}
export default useEvent;
