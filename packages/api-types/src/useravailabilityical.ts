/**
 * External .ical datasource for user availability.
 */
export const USER_AVAILABILITY_ICAL = 'ical';

/**
 * External .ical datasource for user availability.
 */
export interface UserAvailabilityICal {
  type: typeof USER_AVAILABILITY_ICAL;
  uri: string;
}