import { useState, useCallback, useMemo } from 'react';
import { Seat, SeatStatus, SeatSelectionHook } from '../types/seat.types';

export function useSeatSelection(initialSelected: string[] = []): SeatSelectionHook {
  const [selectedSet, setSelectedSet] = useState<Set<string>>(() => new Set(initialSelected));

  const selectedSeats = useMemo(() => Array.from(selectedSet), [selectedSet]);

  const selectedCount = selectedSet.size;

  const canSelectMore = selectedCount < 8;

  const isSelected = useCallback(
    (seatNumber: string) => selectedSet.has(seatNumber),
    [selectedSet]
  );

  const toggleSeat = useCallback((seat: Seat) => {
    // Only available seats can be selected
    if (seat.status !== SeatStatus.AVAILABLE) {
      return;
    }

    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(seat.seatNumber)) {
        next.delete(seat.seatNumber);
      } else {
        // Prevent exceeding max seats limit (8 seats)
        if (next.size >= 8) {
          return prev;
        }
        next.add(seat.seatNumber);
      }
      return next;
    });
  }, []);

  const deselectSeats = useCallback((seatNumbers: string[]) => {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      seatNumbers.forEach((num) => next.delete(num));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSet(new Set());
  }, []);

  return {
    selectedSeats,
    toggleSeat,
    deselectSeats,
    clearSelection,
    isSelected,
    canSelectMore,
    selectedCount,
  };
}

export default useSeatSelection;
