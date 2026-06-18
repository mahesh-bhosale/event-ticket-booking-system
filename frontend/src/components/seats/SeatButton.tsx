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
    "relative flex items-center justify-center rounded-lg transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "border font-bold text-[10px] sm:text-xs",
    "h-8 w-8 sm:h-9 sm:w-9", // Slightly larger premium touch area
    
    // Available — ready to select (green)
    status === SeatStatus.AVAILABLE && !isSelected && !disabled &&
      "bg-seat-available border-2 border-seat-available-border text-seat-available-text hover:border-brand-pink hover:text-white hover:bg-brand-pink/15 hover:shadow-brand-glow-sm cursor-pointer",
    status === SeatStatus.AVAILABLE && !isSelected && disabled &&
      "bg-seat-available/50 border-2 border-zinc-700 text-zinc-600 cursor-not-allowed opacity-50",
    // Selected — your selection (pink → purple gradient)
    isSelected &&
      "bg-brand-gradient border-2 border-brand-pink text-white hover:opacity-95 cursor-pointer shadow-brand-glow scale-110 z-10",
    // Reserved — on hold (amber)
    status === SeatStatus.RESERVED &&
      "bg-seat-reserved border-2 border-seat-reserved-border text-seat-reserved-text line-through cursor-not-allowed",
    // Booked — sold out (dark red)
    status === SeatStatus.BOOKED &&
      "bg-seat-booked border-2 border-seat-booked-border text-seat-booked-text line-through cursor-not-allowed opacity-80"
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
