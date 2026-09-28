/**
 * Shared Wardrob Availability Engine
 * 
 * ⚠️ CROSS-LANGUAGE SYNC NOTICE:
 * This buffer calculation logic is mirrored in the Flutter mobile app at:
 * `wardrob_mobile/lib/models/listing_model.dart` (BookedRange.conflictsWith & ListingModel.getNextAvailableDate).
 * If any buffer rules change here (e.g. MIN_PROCESSING_DAYS, STANDARD_PRE_EVENT_BUFFER, return buffer),
 * you MUST also update `listing_model.dart` in the Flutter mobile app to prevent Web/Mobile inconsistency.
 * 
 * Rules:
 * - MIN_PROCESSING_DAYS = 3 (preparation, dry cleaning, outbound dispatch)
 * - STANDARD_PRE_EVENT_BUFFER = 2 (normal case, arrives 2 days before event)
 * - MIN_PRE_EVENT_BUFFER = 1 (rush/compressed case: 4 days away arrives 1 day before event)
 * - Standard return pickup = eventDate + 2 days (+ extensionDays)
 * 
 * A booking conflicts if:
 * [deliveryDate, returnPickupDate] overlaps with an existing booking's [startDate, endDate]
 */

export const MIN_PROCESSING_DAYS = 3;
export const STANDARD_PRE_EVENT_BUFFER = 2;
export const MIN_PRE_EVENT_BUFFER = 1;
export const POST_RETURN_TURNAROUND_DAYS = 2; // Days after return pickup for hub transit, inspection & cleaning

export interface RentalWindow {
  valid: boolean;
  reason?: string;
  deliveryDate: Date;
  returnPickupDate: Date;
}

export interface BookingRange {
  startDate: Date;
  endDate: Date;
  pendingExtensionDate?: Date | null;
  pendingExtensionExpiry?: Date | null;
}

/**
 * Normalizes a date to local midnight for consistent day-based comparisons
 */
export function toMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Calculates delivery date and return pickup date for a prospective event date
 */
export function calculateRentalWindow(
  eventDate: Date,
  extensionDays: number = 0,
  referenceDate?: Date
): RentalWindow {
  const ref = referenceDate ? toMidnight(referenceDate) : toMidnight(new Date());
  const evDate = toMidnight(eventDate);

  const daysUntilEvent = Math.round((evDate.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilEvent < (MIN_PROCESSING_DAYS + MIN_PRE_EVENT_BUFFER)) {
    // Less than 4 days away — cannot guarantee delivery in time
    return {
      valid: false,
      reason: "This item can't be delivered in time for your event date. Please choose a date at least 4 days from today.",
      deliveryDate: ref,
      returnPickupDate: ref,
    };
  }

  let deliveryDate: Date;
  if (daysUntilEvent >= (MIN_PROCESSING_DAYS + STANDARD_PRE_EVENT_BUFFER)) {
    // Normal case (>= 5 days), 2-day pre-event buffer
    deliveryDate = new Date(evDate);
    deliveryDate.setDate(deliveryDate.getDate() - STANDARD_PRE_EVENT_BUFFER);
  } else {
    // Compressed case (4 days away), gives exactly 1-day buffer
    deliveryDate = new Date(ref);
    deliveryDate.setDate(deliveryDate.getDate() + MIN_PROCESSING_DAYS);
  }

  const returnPickupDate = new Date(evDate);
  returnPickupDate.setDate(returnPickupDate.getDate() + 2 + extensionDays);

  return {
    valid: true,
    deliveryDate,
    returnPickupDate,
  };
}

/**
 * Checks if a proposed event date conflicts with existing confirmed/active bookings
 */
export function isDateConflictingWithBookings(
  eventDate: Date,
  bookings: BookingRange[],
  extensionDays: number = 0,
  referenceDate?: Date
): boolean {
  const window = calculateRentalWindow(eventDate, extensionDays, referenceDate);
  if (!window.valid) return true; // Invalid window is considered unavailable

  const delivery = toMidnight(window.deliveryDate);
  const returnPickup = toMidnight(window.returnPickupDate);
  const returnPickupWithTurnaround = new Date(returnPickup);
  returnPickupWithTurnaround.setDate(returnPickupWithTurnaround.getDate() + POST_RETURN_TURNAROUND_DAYS);
  const now = new Date();

  for (const b of bookings) {
    const bStart = toMidnight(new Date(b.startDate));
    const bEnd = toMidnight(new Date(b.endDate));
    const occupiedEnd = new Date(bEnd);
    occupiedEnd.setDate(occupiedEnd.getDate() + POST_RETURN_TURNAROUND_DAYS);

    // Conflict check: prospective window overlaps existing booking's occupied window
    if (bStart <= returnPickupWithTurnaround && occupiedEnd >= delivery) {
      return true;
    }

    // Pending extension check
    if (
      b.pendingExtensionDate &&
      b.pendingExtensionExpiry &&
      new Date(b.pendingExtensionExpiry) > now
    ) {
      const extEnd = toMidnight(new Date(b.pendingExtensionDate));
      const extOccupiedEnd = new Date(extEnd);
      extOccupiedEnd.setDate(extOccupiedEnd.getDate() + POST_RETURN_TURNAROUND_DAYS);
      if (bStart <= returnPickupWithTurnaround && extOccupiedEnd >= delivery) {
        return true;
      }
    }
  }

  return false;
}

export interface NextAvailableInfo {
  isAvailableNow: boolean;
  nextDate: Date;
  badgeText: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Finds the earliest future date the listing becomes bookable, and generates the badge text.
 */
export function getNextAvailableDate(
  bookings: BookingRange[],
  referenceDate?: Date
): NextAvailableInfo {
  const ref = referenceDate ? toMidnight(referenceDate) : toMidnight(new Date());
  
  // Earliest possible event date is 4 days from reference date
  const earliestPossibleEvent = new Date(ref);
  earliestPossibleEvent.setDate(earliestPossibleEvent.getDate() + MIN_PROCESSING_DAYS + MIN_PRE_EVENT_BUFFER);

  // Check from earliestPossibleEvent onward for up to 90 days
  let foundDate = earliestPossibleEvent;
  let isAvailableNow = false;

  for (let i = 0; i < 90; i++) {
    const candidate = new Date(earliestPossibleEvent);
    candidate.setDate(candidate.getDate() + i);

    if (!isDateConflictingWithBookings(candidate, bookings, 0, ref)) {
      foundDate = candidate;
      // If the very earliest bookable day (4 or 5 days out) is available, mark as Available Now
      if (i <= 1) {
        isAvailableNow = true;
      }
      break;
    }
  }

  let badgeText = 'Available Now';
  if (!isAvailableNow) {
    const d = foundDate.getDate();
    const m = MONTH_NAMES[foundDate.getMonth()];
    badgeText = `Available from ${d} ${m}`;
  }

  return {
    isAvailableNow,
    nextDate: foundDate,
    badgeText,
  };
}
