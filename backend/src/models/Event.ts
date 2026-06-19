import { Schema, model, type Document, type Model } from 'mongoose';
import type { IEvent } from '../types/event.types';

// ─────────────────────────────────────────────────────────────
//  Document & Model Types
// ─────────────────────────────────────────────────────────────

/** Mongoose Document augmented with IEvent fields */
export type EventDocument = IEvent & Document;

/** Mongoose Model type for Event */
export type EventModel = Model<EventDocument>;

// ─────────────────────────────────────────────────────────────
//  Schema Definition
// ─────────────────────────────────────────────────────────────
const eventSchema = new Schema<EventDocument, EventModel>(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Event name must not exceed 200 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },

    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [300, 'Venue must not exceed 300 characters'],
    },

    dateTime: {
      type: Date,
      required: [true, 'Event date and time is required'],
      validate: {
        // Only enforced on create (new document), not on updates
        validator(this: EventDocument, value: Date): boolean {
          if (!this.isNew) return true;
          return value > new Date();
        },
        message: 'Event dateTime must be a future date',
      },
    },

    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'There must be at least 1 seat'],
      max: [10000, 'Total seats cannot exceed 10,000'],
      validate: {
        validator: Number.isInteger,
        message: 'totalSeats must be an integer',
      },
    },

    image: {
      type: String,
      required: [true, 'Event image URL is required'],
      trim: true,
      maxlength: [2048, 'Image URL must not exceed 2048 characters'],
    },

    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category must not exceed 100 characters'],
    },

    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },

    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location must not exceed 200 characters'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─────────────────────────────────────────────────────────────
//  Indexes
// ─────────────────────────────────────────────────────────────

/** Sort / filter by event date */
eventSchema.index({ dateTime: 1 }, { name: 'idx_event_dateTime' });

/** Most common query pattern: active events by date */
eventSchema.index(
  { isActive: 1, dateTime: 1 },
  { name: 'idx_event_isActive_dateTime' },
);

// ─────────────────────────────────────────────────────────────
//  Model
// ─────────────────────────────────────────────────────────────
export const Event = model<EventDocument, EventModel>('Event', eventSchema);

export type { IEvent };
