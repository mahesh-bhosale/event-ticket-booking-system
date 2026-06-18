import React, { useMemo } from 'react';
import { Seat, SeatGridProps } from '../../types/seat.types';
import SeatButton from './SeatButton';

export const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  selectedSeats,
  onToggleSeat,
  disabled = false,
}) => {
  // Check if selection limit of 8 is reached
  const isLimitReached = selectedSeats.length >= 8;

  // Group seats by row and sort them
  const seatLayout = useMemo(() => {
    const rowsMap: Record<string, Seat[]> = {};
    
    seats.forEach((seat) => {
      if (!rowsMap[seat.row]) {
        rowsMap[seat.row] = [];
      }
      rowsMap[seat.row].push(seat);
    });

    const sortedRowKeys = Object.keys(rowsMap).sort();
    
    return sortedRowKeys.map((row) => {
      // Sort seats within each row by column number
      const rowSeats = rowsMap[row].sort((a, b) => a.number - b.number);
      return {
        row,
        seats: rowSeats,
      };
    });
  }, [seats]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Stage / Screen Area Visual */}
      <div className="w-full max-w-md flex flex-col items-center mb-10 mt-2">
        <div className="w-full h-1.5 bg-gradient-to-r from-primary/10 via-primary to-primary/10 rounded-full shadow-lg shadow-primary/30" />
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-muted-foreground/70 mt-2">
          Stage / Screen
        </span>
      </div>

      {/* Grid Container with Horizontal Scroll support on Mobile */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border">
        <div className="min-w-[500px] flex flex-col gap-1 items-center px-4">
          
          {/* Column Header Numbers */}
          <div className="flex items-center gap-2 mb-2 w-full max-w-xl">
            {/* Spacer for row label */}
            <div className="w-8 text-center text-xs font-bold text-muted-foreground/50 border-r pr-2">
              Row
            </div>
            
            <div className="grid grid-cols-10 gap-0 sm:gap-1 w-full justify-items-center text-[10px] font-bold text-muted-foreground/60 uppercase">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((colNum) => (
                <div key={colNum} className="w-11 sm:w-12 text-center select-none">
                  {colNum}
                </div>
              ))}
            </div>
          </div>

          {/* Seat Rows */}
          <div className="flex flex-col gap-1 w-full max-w-xl">
            {seatLayout.map(({ row, seats: rowSeats }) => (
              <div key={row} className="flex items-center gap-2 w-full">
                {/* Row Label Indicator on Left */}
                <div className="w-8 text-center text-sm font-extrabold text-muted-foreground border-r border-border/60 pr-2 select-none">
                  {row}
                </div>

                {/* Seat Buttons Columns */}
                <div className="grid grid-cols-10 gap-0 sm:gap-1 w-full justify-items-center">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeats.includes(seat.seatNumber);
                    
                    // Disable seat if limit is reached and it is not already selected, or if the whole grid is frozen
                    const isSeatDisabled = disabled || (isLimitReached && !isSelected);

                    return (
                      <SeatButton
                        key={seat._id || seat.seatNumber}
                        seat={seat}
                        isSelected={isSelected}
                        onToggle={onToggleSeat}
                        disabled={isSeatDisabled}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {isLimitReached && (
        <div className="mt-4 text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 animate-pulse">
          Maximum 8 seats selected
        </div>
      )}
    </div>
  );
};

export default React.memo(SeatGrid);
