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
  image: string;
  category?: string;
  price?: number;
  location?: string;
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
  image: string;
  category?: string;
  price?: number;
  location?: string;
}

export interface UpdateEventDTO {
  name?: string;
  description?: string;
  venue?: string;
  dateTime?: Date | string;
  totalSeats?: number;
  image?: string;
  category?: string;
  price?: number;
  location?: string;
  isActive?: boolean;
}

// ── Sort Options ──────────────────────────────────────────────
export type EventSortOption = 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc';

// ── Query and Result Interfaces ──────────────────────────────
export interface EventQueryFilters {
  page?: number;
  limit?: number;
  date?: string;
  search?: string;
  city?: string;
  sort?: EventSortOption;
}

export interface AppliedFilters {
  search?: string;
  city?: string;
  date?: string;
  sort: EventSortOption;
}

export interface MappedEvent {
  _id: string;
  name: string;
  description?: string;
  venue: string;
  dateTime: Date;
  totalSeats: number;
  image: string;
  category?: string;
  price?: number;
  location?: string;
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
  filters: AppliedFilters;
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
    image: string;
    category?: string;
    price?: number;
    location?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  seats: SeatResponse[];
}

