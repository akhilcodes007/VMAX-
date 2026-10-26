/**
 * math.ts — Pure financial math functions for TimeWorth.
 * All inputs in INR (₹). No side-effects, no I/O.
 */

export interface IncomeProfile {
  monthlyTakeHome: number;
  workDaysPerMonth: number;
  hoursPerDay: number;
}

export const DEFAULT_PROFILE: IncomeProfile = {
  monthlyTakeHome: 25000,
  workDaysPerMonth: 26,
  hoursPerDay: 8,
};

// ─── Guard / Validation ────────────────────────────────────────────────────

export function validateIncome(profile: IncomeProfile): void {
  if (
    !profile.monthlyTakeHome ||
    isNaN(profile.monthlyTakeHome) ||
    profile.monthlyTakeHome <= 0
  ) {
    throw new RangeError("Monthly take-home must be a positive number.");
  }
  if (profile.monthlyTakeHome > 10_00_00_000) {
    throw new RangeError("Monthly take-home value is unrealistically large.");
  }
  if (
    !profile.workDaysPerMonth ||
    profile.workDaysPerMonth <= 0 ||
    profile.workDaysPerMonth > 31
  ) {
    throw new RangeError("Work days per month must be between 1 and 31.");
  }
  if (
    !profile.hoursPerDay ||
    profile.hoursPerDay <= 0 ||
    profile.hoursPerDay > 24
  ) {
    throw new RangeError("Hours per day must be between 1 and 24.");
  }
}

// ─── Core Math ─────────────────────────────────────────────────────────────

/**
 * Returns the effective hourly rate from an income profile.
 * hourlyRate = monthlyTakeHome / (workDaysPerMonth × hoursPerDay)
 */
export function hourlyRate(profile: IncomeProfile): number {
  validateIncome(profile);
  return (
    profile.monthlyTakeHome /
    (profile.workDaysPerMonth * profile.hoursPerDay)
  );
}

/**
 * Converts a price into the number of life-hours it costs.
 * lifeHours = price / hourlyRate
 */
export function lifeHours(price: number, profile: IncomeProfile): number {
  if (price < 0 || isNaN(price)) throw new RangeError("Price must be non-negative.");
  if (price > 100_00_00_000) throw new RangeError("Price is unrealistically large.");
  const rate = hourlyRate(profile);
  return price / rate;
}

/**
 * Converts life-hours into a human-readable breakdown.
 */
export function lifeHoursBreakdown(
  hours: number,
  profile: IncomeProfile
): { hours: number; days: number; weeks: number; months: number } {
  const days = hours / profile.hoursPerDay;
  const weeks = days / 5; // 5-day work week
  const months = weeks / 4.33;
  return { hours, days, weeks, months };
}

/**
 * Future value of a lump sum.
 * FV = price × (1 + r)^years
 */
export function futureValueLump(
  price: number,
  ratePct: number,
  years: number
): number {
  if (price < 0 || isNaN(price)) throw new RangeError("Price must be non-negative.");
  if (ratePct < 0 || ratePct > 100) throw new RangeError("Rate must be between 0 and 100.");
  if (years <= 0 || years > 100) throw new RangeError("Years must be between 1 and 100.");
  const r = ratePct / 100;
  return price * Math.pow(1 + r, years);
}

/**
 * Future hours = futureValueLump / hourlyRate.
 * Uses the CURRENT hourly rate (not inflation-adjusted) so the user can
 * compare today's life-cost vs tomorrow's opportunity cost fairly.
 */
export function futureHours(
  price: number,
  ratePct: number,
  years: number,
  profile: IncomeProfile
): number {
  const fv = futureValueLump(price, ratePct, years);
  return fv / hourlyRate(profile);
}

// ─── Recurring Spend ───────────────────────────────────────────────────────

export type Frequency =
  | "once"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

/** Times per year for each frequency type (with timesPerPeriod multiplier). */
export function timesPerYear(
  frequency: Frequency,
  timesPerPeriod: number
): number {
  switch (frequency) {
    case "once":    return 1 * timesPerPeriod;
    case "daily":   return 365 * timesPerPeriod;
    case "weekly":  return 52 * timesPerPeriod;
    case "monthly": return 12 * timesPerPeriod;
    case "yearly":  return 1 * timesPerPeriod;
    default:        return 1;
  }
}

/**
 * Total yearly cost for a recurring spend.
 * yearlyCost = amount × timesPerYear(frequency, timesPerPeriod)
 */
export function yearlyCost(
  amount: number,
  frequency: Frequency,
  timesPerPeriod: number
): number {
  return amount * timesPerYear(frequency, timesPerPeriod);
}

/**
 * Future value of recurring (monthly) contributions.
 * PMT = yearlyCost / 12 (monthly contribution)
 * FV = PMT × (((1 + i)^(12n) − 1) / i)  where i = ratePct/12/100
 * Special case: when ratePct = 0, FV = PMT × 12n (simple sum)
 */
export function futureValueRecurring(
  amount: number,
  frequency: Frequency,
  timesPerPeriod: number,
  ratePct: number,
  years: number
): number {
  if (ratePct < 0 || ratePct > 100) throw new RangeError("Rate must be between 0 and 100.");
  if (years <= 0 || years > 100) throw new RangeError("Years must be between 1 and 100.");

  const pmt = yearlyCost(amount, frequency, timesPerPeriod) / 12;

  if (ratePct === 0) {
    return pmt * 12 * years;
  }

  const i = ratePct / 12 / 100;
  const n = years;
  return pmt * ((Math.pow(1 + i, 12 * n) - 1) / i);
}

// ─── Chart Data ────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  year: number;
  cost: number;
  invested: number;
}

/**
 * Generate year-by-year data for the growth chart (lump-sum).
 * Year 0 = the original price (no growth yet).
 */
export function growthChartData(
  price: number,
  ratePct: number,
  maxYears: number
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  for (let y = 0; y <= maxYears; y++) {
    data.push({
      year: y,
      cost: price,
      // Year 0: the money is just sitting there — no growth yet
      invested: y === 0 ? price : futureValueLump(price, ratePct, y),
    });
  }
  return data;
}

/**
 * Generate year-by-year data for the growth chart (recurring spend).
 */
export function growthChartDataRecurring(
  amount: number,
  frequency: Frequency,
  timesPerPeriod: number,
  ratePct: number,
  maxYears: number
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const yearly = yearlyCost(amount, frequency, timesPerPeriod);
  for (let y = 0; y <= maxYears; y++) {
    data.push({
      year: y,
      cost: yearly * y,
      invested:
        y === 0
          ? 0
          : futureValueRecurring(amount, frequency, timesPerPeriod, ratePct, y),
    });
  }
  return data;
}
