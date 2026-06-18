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
