/**
 * format.ts — Display formatting utilities.
 * All number formatting uses Indian locale (₹1,23,456).
 */

const INR_FORMAT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_FORMAT_DECIMAL = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM_FORMAT = new Intl.NumberFormat("en-IN");

/** Format an INR amount. Rounds to nearest rupee for display. */
export function formatINR(amount: number): string {
  return INR_FORMAT.format(Math.round(amount));
}

/** Format with 2 decimal places */
export function formatINRDecimal(amount: number): string {
  return INR_FORMAT_DECIMAL.format(amount);
}

/** Format a number with Indian grouping (no currency symbol). */
export function formatNumber(n: number): string {
  return NUM_FORMAT.format(Math.round(n));
}

/** Format hours for display. */
export function formatHours(hours: number): string {
  if (hours < 1) return `${(hours * 60).toFixed(0)} mins`;
  return `${hours.toFixed(1)} hrs`;
}

/** Human-scale description of life-hours. */
export function humanScale(
  hours: number,
  hoursPerDay: number
): string {
  const days = hours / hoursPerDay;
  const weeks = days / 5;
  const months = weeks / 4.33;

  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} minute${mins !== 1 ? "s" : ""} of work`;
  }
  if (hours < hoursPerDay) {
    return `${hours.toFixed(1)} hours of your working day`;
  }
  if (days < 5) {
    return `${days.toFixed(1)} working day${days < 1.5 ? "" : "s"} of your life`;
  }
  if (weeks < 4) {
    return `${weeks.toFixed(1)} work week${weeks < 1.5 ? "" : "s"} of your life`;
  }
  if (months < 12) {
    return `${months.toFixed(1)} work month${months < 1.5 ? "" : "s"} of your life`;
  }
  const yrs = months / 12;
  return `${yrs.toFixed(1)} work year${yrs < 1.5 ? "" : "s"} of your life`;
}

/** Format a compact number (e.g. 1,23,456 → "1.2L", 1,00,00,000 → "1Cr") */
export function formatCompact(amount: number): string {
  if (amount >= 1_00_00_000) {
    return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
  }
  if (amount >= 1_00_000) {
    return `₹${(amount / 1_00_000).toFixed(1)}L`;
  }
  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1)}K`;
  }
  return `₹${Math.round(amount)}`;
}
