import React from 'react';
import { Card, CardContent } from '../ui/card';

export const SeatLegend: React.FC = () => {
  return (
    <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-muted-foreground">
          
          {/* Available Status */}
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors">
            <div className="h-5 w-5 rounded border bg-background border-border flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-foreground">Available</span>
              <span className="text-[10px] text-muted-foreground font-normal">Ready to select</span>
            </div>
          </div>

          {/* Selected Status */}
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors">
            <div className="h-5 w-5 rounded border bg-primary border-primary shadow-sm shadow-primary/25 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-foreground">Selected</span>
              <span className="text-[10px] text-muted-foreground font-normal">Your selection</span>
            </div>
          </div>

          {/* Reserved Status */}
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors">
            <div className="h-5 w-5 rounded border bg-amber-100 dark:bg-amber-950/40 border-amber-400 dark:border-amber-900 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-foreground">Reserved</span>
              <span className="text-[10px] text-muted-foreground font-normal">On hold</span>
            </div>
          </div>

          {/* Booked Status */}
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors">
            <div className="h-5 w-5 rounded border bg-muted border-muted-foreground/10 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-foreground">Booked</span>
              <span className="text-[10px] text-muted-foreground font-normal">Sold out</span>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default SeatLegend;
