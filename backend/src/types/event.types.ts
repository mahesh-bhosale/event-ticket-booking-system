// ─────────────────────────────────────────────────────────────
//  Event Types & Enums
// ─────────────────────────────────────────────────────────────

// ── Core Interface ────────────────────────────────────────────
export interface IEvent {
  name: string;
  description?: string;
  venue: string;
  dateTime: Date;
  totalSeats: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── DTO shapes for API layer (no Mongoose deps) ───────────────
export interface CreateEventDTO {
  name: string;
  description?: string;
  venue: string;
  dateTime: Date | string;
  totalSeats: number;
}

export interface UpdateEventDTO {
  name?: string;
  description?: string;
  venue?: string;
  dateTime?: Date | string;
  totalSeats?: number;
  isActive?: boolean;
}

// ── Query and Result Interfaces ──────────────────────────────
export interface EventQueryFilters {
  page?: number;
  limit?: number;
  date?: string;
}

export interface MappedEvent {
  _id: string;
  name: string;
  description?: string;
  venue: string;
  dateTime: Date;
  totalSeats: number;
  isActive: boolean;
  availableSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedEventsResult {
  events: MappedEvent[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface SeatResponse {
  _id: string;
  seatNumber: string;
  row: string;
  number: number;
  status: string;
}

export interface EventDetailsResult {
  event: {
    _id: string;
    name: string;
    description?: string;
    venue: string;
    dateTime: Date;
    totalSeats: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  seats: SeatResponse[];
}

