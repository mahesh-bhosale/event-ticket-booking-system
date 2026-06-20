export interface BookingHistoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  timeRange?: '30' | '90' | 'all';
}

export interface BookingHistoryItem {
  bookingReference: string;
  bookedAt: Date;
  eventName: string;
  venue: string;
  eventDate: Date;
  seatNumbers: string[];
  totalSeats: number;
  bookingStatus: string;
}

export interface BookingHistoryResponse {
  bookings: BookingHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
