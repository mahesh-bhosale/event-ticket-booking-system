import React from 'react';
import { Card, CardContent } from '../ui/card';

const legendItems = [
  {
    swatchClass:
      'bg-seat-available border-2 border-seat-available-border',
    title: 'Available',
    subtitle: 'Ready to select',
    titleClass: 'text-seat-available-text',
  },
  {
    swatchClass:
      'bg-brand-gradient border-2 border-brand-pink shadow-brand-glow-sm',
    title: 'Selected',
    subtitle: 'Your selection',
    titleClass: 'text-brand-pink',
  },
  {
    swatchClass:
      'bg-seat-reserved border-2 border-seat-reserved-border line-through',
    title: 'Reserved',
    subtitle: 'On hold',
    titleClass: 'text-seat-reserved-text',
  },
  {
    swatchClass:
      'bg-seat-booked border-2 border-seat-booked-border line-through',
    title: 'Booked',
    subtitle: 'Sold out',
    titleClass: 'text-seat-booked-text',
  },
] as const;

export const SeatLegend: React.FC = () => {
  return (
    <Card className="border border-border/30 shadow-md bg-card/60 backdrop-blur-md rounded-2xl">
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
          Seat colour guide
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
          {legendItems.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/25 border border-border/20"
            >
              <div
                className={`h-7 w-7 rounded-md flex-shrink-0 ${item.swatchClass}`}
                aria-hidden
              />
              <div className="flex flex-col min-w-0">
                <span className={`font-bold ${item.titleClass}`}>{item.title}</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {item.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeatLegend;
