import type { ClientSession } from 'mongoose';
import { Reservation } from '../models/Reservation';

/**
 * Generates a unique booking reference in the format: SMS-YYYY-XXXXXX
 * where YYYY is the current year, and XXXXXX is a 6-digit random number.
 * Retries if a duplicate reference is found inside the database session.
 */
export async function generateBookingReference(session?: ClientSession): Promise<string> {
  const currentYear = new Date().getFullYear();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;
    // Generate 6 random digits (padded to 6 characters if needed, e.g. 000123)
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const reference = `SMS-${currentYear}-${randomDigits}`;

    // Verify uniqueness within the same transactional context
    const existing = await Reservation.findOne({ bookingReference: reference })
      .session(session || null)
      .lean();

    if (!existing) {
      return reference;
    }
  }

  throw new Error('Failed to generate a unique booking reference after 10 attempts');
}
export default generateBookingReference;
