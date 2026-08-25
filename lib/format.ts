// lib/format.ts

/**
 * Small display helpers, kept in one place so every page formats things
 * the same way. These are plain functions — no React, no database.
 */

/** "20 Aug 2026, 2:30 PM" — used for signup dates and appointment times. */
export function formatDateTime(date: Date) {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

/**
 * "2:30 PM" — a 12-hour clock with AM or PM.
 *
 * The bug this fixes: the old version asked for `hour` and `minute` in the
 * "en-GB" locale, and en-GB uses a 24-hour clock. So 2:30 in the afternoon came
 * out as "14:30" and half past midnight as "00:30" — correct, but ambiguous to
 * read and missing the AM/PM the appointment screens need.
 *
 * `hour12: true` is what asks for the 12-hour clock. It has to be explicit,
 * because the default depends entirely on the locale.
 *
 * `hour: "numeric"` rather than "2-digit" gives "2:30 PM" instead of
 * "02:30 PM" — nobody writes a leading zero on a 12-hour clock.
 *
 * The `.toUpperCase()` is cosmetic: en-GB renders the suffix lowercase ("2:30
 * pm"), and uppercase reads better in a table. It's safe to uppercase the whole
 * string because digits and the colon aren't affected by it.
 */
export function formatTime(date: Date) {
  return date
    .toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

/** "20 Aug 2026" — when the time of day doesn't matter. */
export function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Same look as formatDate, but pinned to UTC.
 *
 * Use this for dates that came from an <input type="date"> (like a date of
 * birth). Those are saved as midnight UTC, so formatting them in the server's
 * own timezone can shift them by a day. There's no time of day to get wrong
 * here, so reading them back in UTC always shows the day the user typed.
 */
export function formatDateOfBirth(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Works out someone's age from their date of birth.
 * We subtract a year if their birthday hasn't happened yet this year.
 *
 * Why the getUTC* methods? A date input sends "2000-05-10", which JavaScript
 * stores as midnight UTC. If we then read it with the plain getDate(), a server
 * in a timezone behind UTC would see 9 May instead of 10 May and the age would
 * be off by one. Reading in UTC gives back exactly the day that was typed.
 */
export function calculateAge(dateOfBirth: Date) {
  const today = new Date();
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();

  const monthDiff = today.getUTCMonth() - dateOfBirth.getUTCMonth();
  const birthdayNotYetThisYear =
    monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < dateOfBirth.getUTCDate());

  if (birthdayNotYetThisYear) age--;

  return age;
}

/**
 * Turns "PREFER_NOT_TO_SAY" into "Prefer not to say" so we can show enum
 * values from the database without ugly underscores.
 */
export function humanize(value: string) {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Formats a value for the `defaultValue` of an <input type="date">. */
export function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  // toISOString() is always UTC, which matches how the date input saved it.
  return date.toISOString().slice(0, 10); // "2026-08-20"
}
