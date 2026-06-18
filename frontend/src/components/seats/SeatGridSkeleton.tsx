import React from 'react';
import { Skeleton } from '../ui/skeleton';

export const SeatGridSkeleton: React.FC = () => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="w-full flex flex-col items-center animate-pulse">
      {/* Stage / Screen Area Skeleton */}
      <div className="w-full max-w-md flex flex-col items-center mb-10 mt-2">
        <Skeleton className="w-full h-1.5 rounded-full bg-muted/60" />
        <Skeleton className="w-24 h-3 mt-3 bg-muted/50" />
      </div>

      {/* Grid container skeleton */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[500px] flex flex-col gap-1 items-center px-4">
          
          {/* Header numbers skeleton */}
          <div className="flex items-center gap-2 mb-2 w-full max-w-xl">
            <div className="w-8 text-center text-xs font-bold text-muted-foreground/30 border-r pr-2">
              Row
            </div>
            <div className="grid grid-cols-10 gap-0 sm:gap-1 w-full justify-items-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="w-4 h-3 bg-muted/40" />
              ))}
            </div>
          </div>

          {/* Seat rows skeleton */}
          <div className="flex flex-col gap-1 w-full max-w-xl">
            {rows.map((row) => (
              <div key={row} className="flex items-center gap-2 w-full">
                {/* Row Label Spacer */}
                <div className="w-8 text-center text-sm font-extrabold text-muted-foreground/30 border-r pr-2">
                  {row}
                </div>
                
                {/* Columns */}
                <div className="grid grid-cols-10 gap-0 sm:gap-1 w-full justify-items-center">
                  {Array.from({ length: 10 }).map((_, col) => (
                    <div key={col} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded bg-muted/50" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SeatGridSkeleton;
