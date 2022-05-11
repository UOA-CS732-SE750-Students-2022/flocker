import { Injectable } from '@nestjs/common';
import { async as icalParser, type CalendarResponse, type VEvent } from 'node-ical';
import { AvailabilityInterval, Interval } from './models';

const MILLISECONDS_IN_ONE_DAY = 86400000;

@Injectable()
export class CalendarUtil {
  async convertIcalToIntervalsFromUris(uris: string[], intervals: Interval[]): Promise<AvailabilityInterval[]> {
    const calendars = await Promise.all(uris.map((uri) => icalParser.fromURL(uri)));
    return this.convertIcalToIntervals(calendars, intervals);
  }

  convertIcalToIntervals(calendars: CalendarResponse[], intervals: Interval[]): AvailabilityInterval[] {
    const events = calendars.flatMap((event) => Object.values(event));

    const availabilityIntervals: boolean[] = new Array(intervals.length).fill(true);
    for (const event of events) {
      if (event.type !== 'VEVENT') {
        continue;
      }

      const vevent = event as VEvent;

      const allOccurences: Date[] = [];
      intervals.forEach((interval, index) => {
        const { start, end } = interval;

        const eventDuration = vevent.end.getTime() - vevent.start.getTime();

        // If the event is date only, it means it is an all day event e.g. Christmas
        if (event.datetype === 'date' && this.isDuringInterval(vevent.start, start, end, MILLISECONDS_IN_ONE_DAY)) {
          availabilityIntervals[index] = false;
          // If the event is recurring, we need to check if it occurs during the interval
        } else if (vevent.rrule) {
          const eventsAtInterval = vevent.rrule.between(start, end, true);

          // If there are one or more events, then the user is unavailable
          if (eventsAtInterval.length > 0) {
            eventsAtInterval.forEach((recurringEvent) => {
              if (recurringEvent.getTime() !== end.getTime()) {
                availabilityIntervals[index] = false;
              }
            });

            allOccurences.push(...eventsAtInterval);
          } else {
            allOccurences.forEach((recurringEvent) => {
              if (this.startsBeforeOrAtInterval(recurringEvent, start, eventDuration)) {
                availabilityIntervals[index] = false;
              }
            });
          }
          // If the event is not recurring check if it occurs during the interval
        } else if (this.isDuringInterval(vevent.start, start, end, eventDuration)) {
          availabilityIntervals[index] = false;
        }
      });
    }

    return intervals.map((interval, index) => ({
      ...interval,
      available: availabilityIntervals[index],
    }));
  }

  private startsBeforeOrAtInterval(event: Date, intervalStart: Date, eventDuration: number): boolean {
    return event.getTime() <= intervalStart.getTime() && event.getTime() + eventDuration > intervalStart.getTime();
  }

  private isDuringInterval(event: Date, intervalStart: Date, intervalEnd: Date, eventDuration: number): boolean {
    return event.getTime() < intervalEnd.getTime() && event.getTime() + eventDuration > intervalStart.getTime();
  }

  calculateManualAvailability(
    manualAvailability: AvailabilityInterval[],
    intervals: Interval[],
  ): AvailabilityInterval[] {
    const availabilities = intervals.map((interval) => ({ ...interval, available: true }));

    for (const mAvailability of manualAvailability) {
      const { start, end, available } = mAvailability;

      for (const availability of availabilities) {
        const eventDuration = end.getTime() - start.getTime();

        // Check if the event occurs during the interval
        if (this.isDuringInterval(start, availability.start, availability.end, eventDuration)) {
          availability.available = available;
        }
      }
    }

    return availabilities;
  }
}
