export enum SeatStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  BOOKED = "booked",
}

export interface Seat {
  _id: string;
  seatNumber: string;
  row: string;
  number: number;
  status: SeatStatus;
}

export interface SeatButtonProps {
  seat: Seat;
  isSelected: boolean;
  onToggle: (seat: Seat) => void;
  disabled: boolean;
}

export interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onToggleSeat: (seat: Seat) => void;
  disabled?: boolean;
}

export interface SeatSelectionHook {
  selectedSeats: string[];
  toggleSeat: (seat: Seat) => void;
  clearSelection: () => void;
  isSelected: (seatNumber: string) => boolean;
  canSelectMore: boolean;
  selectedCount: number;
}
