export interface BookingHistoryItem {
  bookingReference: string;
  bookedAt: string; // ISO date string from API
  eventName: string;
  venue: string;
  eventDate: string; // ISO date string from API
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

export interface BookingHistoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  timeRange?: '30' | '90' | 'all';
}
