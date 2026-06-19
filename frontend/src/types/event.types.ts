export interface Event {
  _id: string;
  name: string;
  description: string;
  venue: string;
  dateTime: string;
  totalSeats: number;
  image: string;
  category?: string;
  price?: number;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MappedEvent extends Omit<Event, 'isActive' | 'createdAt' | 'updatedAt'> {
  availableSeats: number;
}

export interface SeatResponse {
  _id: string;
  seatNumber: string;
  row: string;
  number: number;
  status: 'available' | 'reserved' | 'booked';
}

export interface EventDetailsResult {
  event: Event;
  seats: SeatResponse[];
}

export interface EventQueryFilters {
  page?: number;
  limit?: number;
  date?: string;
}

export interface ReservationResult {
  reservationId: string;
  seatNumbers: string[];
  expiresAt: string;
  expiresInSeconds: number;
}

export interface BookingConfirmResult {
  bookingId: string;
  bookingReference: string;
  eventName: string;
  venue: string;
  eventDate: string;
  seatNumbers: string[];
  bookedAt: string;
}
