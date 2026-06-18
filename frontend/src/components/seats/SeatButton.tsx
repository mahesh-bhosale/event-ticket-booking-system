import React from 'react';
import { Seat, SeatStatus } from '../../types/seat.types';
import { cn } from '../../lib/utils';

export interface SeatButtonProps {
  seat: Seat;
  isSelected: boolean;
  onToggle: (seat: Seat) => void;
  disabled: boolean;
}

export const SeatButton: React.FC<SeatButtonProps> = ({
  seat,
  isSelected,
  onToggle,
  disabled,
}) => {
  const { seatNumber, number, status } = seat;

  // Accessibility settings
  const ariaLabel = `Seat ${seatNumber}, ${status}`;
  const isAriaDisabled = status === SeatStatus.RESERVED || status === SeatStatus.BOOKED;

  // Determine specific status styling
  const buttonStyles = cn(
    // Base Layout & Transition Styles
    "relative flex items-center justify-center rounded transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "border font-bold text-[10px] sm:text-xs",
    "h-7 w-7 sm:h-8 sm:w-8", // Responsive sizes
    
    // Status: Available vs Selected vs Reserved vs Booked
    status === SeatStatus.AVAILABLE && !isSelected && !disabled && "bg-background border-border text-foreground hover:border-primary hover:bg-accent cursor-pointer",
    status === SeatStatus.AVAILABLE && !isSelected && disabled && "bg-background border-border/40 text-muted-foreground/50 cursor-not-allowed",
    isSelected && "bg-primary border-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm shadow-primary/25",
    status === SeatStatus.RESERVED && "bg-amber-100 dark:bg-amber-950/40 border-amber-400 dark:border-amber-900 text-amber-700 dark:text-amber-300 cursor-not-allowed",
    status === SeatStatus.BOOKED && "bg-muted border-muted-foreground/10 text-muted-foreground/60 cursor-not-allowed"
  );

  // Tooltip description
  const getTooltip = () => {
    if (disabled && status === SeatStatus.AVAILABLE) {
      return "Maximum 8 seats allowed";
    }
    return `Seat ${seatNumber} (${status})`;
  };

  return (
    // Minimum 44px touch click target wrapper for responsive mobile layouts
    <div className="min-w-[44px] min-h-[44px] sm:min-w-[46px] sm:min-h-[46px] flex items-center justify-center">
      <button
        type="button"
        onClick={() => !disabled && onToggle(seat)}
        disabled={disabled || status !== SeatStatus.AVAILABLE}
        aria-label={ariaLabel}
        aria-pressed={isSelected ? "true" : "false"}
        aria-disabled={isAriaDisabled ? "true" : undefined}
        className={buttonStyles}
        title={getTooltip()}
      >
        {number}
      </button>
    </div>
  );
};

export default React.memo(SeatButton);
