import { Types } from 'mongoose';

/**
 * Used to represent an interval we wish to know the availability for.
 */
export interface Interval {
  start: Date;
  end: Date;
}

/**
 * Record a interval availability.
 */
export interface AvailabilityInterval {
  start: Date;
  end: Date;
  availability: Availability[];
}

/**
 * Record a manual interval availability.
 */
export interface ManualAvailabilityInterval {
  start: Date;
  end: Date;
  available: boolean | null;
}

/**
 * Record a interval availability.
 */
export interface Availability {
  id: Types.ObjectId;
  available: boolean;
  manual: boolean;
}