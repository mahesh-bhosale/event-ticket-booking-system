export interface ConfirmBookingInput {
  reservationId: string;
}

export interface ConfirmBookingResult {
  bookingId: string;
  bookingReference: string;
  eventName: string;
  venue: string;
  eventDate: Date;
  seatNumbers: string[];
  bookedAt: Date;
}
