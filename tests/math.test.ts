/**
 * math.test.ts — Unit tests for all math functions.
 * Run with: npx vitest run
 */
import { describe, it, expect } from "vitest";
import {
  hourlyRate,
  lifeHours,
  futureValueLump,
  futureValueRecurring,
  yearlyCost,
  futureHours,
  growthChartData,
  DEFAULT_PROFILE,
  type IncomeProfile,
} from "../src/lib/math";

const PROFILE: IncomeProfile = {
  monthlyTakeHome: 25000,
  workDaysPerMonth: 26,
  hoursPerDay: 8,
};

describe("hourlyRate", () => {
  it("calculates correctly for the example profile", () => {
    const rate = hourlyRate(PROFILE);
    expect(rate).toBeCloseTo(120.19, 1);
  });

  it("uses the DEFAULT_PROFILE correctly", () => {
    const rate = hourlyRate(DEFAULT_PROFILE);
    expect(rate).toBeCloseTo(120.19, 1);
  });

  it("throws on zero income", () => {
    expect(() => hourlyRate({ ...PROFILE, monthlyTakeHome: 0 })).toThrow(RangeError);
  });

  it("throws on negative income", () => {
    expect(() => hourlyRate({ ...PROFILE, monthlyTakeHome: -1000 })).toThrow(RangeError);
  });

  it("throws on NaN income", () => {
    expect(() => hourlyRate({ ...PROFILE, monthlyTakeHome: NaN })).toThrow(RangeError);
  });

  it("throws on unrealistically large income", () => {
    expect(() =>
      hourlyRate({ ...PROFILE, monthlyTakeHome: 2_000_000_000 })
    ).toThrow(RangeError);
  });
});

describe("lifeHours", () => {
  it("calculates 4999 / 120.19 ≈ 41.6 hrs", () => {
    const hours = lifeHours(4999, PROFILE);
    expect(hours).toBeCloseTo(41.6, 0);
  });

  it("returns 0 for a price of 0", () => {
    expect(lifeHours(0, PROFILE)).toBe(0);
  });

  it("throws on negative price", () => {
    expect(() => lifeHours(-100, PROFILE)).toThrow(RangeError);
  });

  it("throws on NaN price", () => {
    expect(() => lifeHours(NaN, PROFILE)).toThrow(RangeError);
  });
});

describe("futureValueLump", () => {
  it("calculates 4999 at 12% for 5 years ≈ 8810", () => {
    expect(futureValueLump(4999, 12, 5)).toBeCloseTo(8810, -1);
  });

  it("calculates 4999 at 12% for 20 years ≈ 48000", () => {
    // Actual: 4999 × 1.12^20 ≈ 48,222; the spec said "≈48,000" as an approximation
    const fv = futureValueLump(4999, 12, 20);
    expect(fv).toBeGreaterThan(47000);
    expect(fv).toBeLessThan(50000);
  });

  it("returns the original price at 0% rate", () => {
    expect(futureValueLump(5000, 0, 10)).toBeCloseTo(5000, 0);
  });

  it("throws on negative rate", () => {
    expect(() => futureValueLump(1000, -1, 5)).toThrow(RangeError);
  });

  it("throws on rate > 100", () => {
    expect(() => futureValueLump(1000, 101, 5)).toThrow(RangeError);
  });

  it("throws on years = 0", () => {
    expect(() => futureValueLump(1000, 12, 0)).toThrow(RangeError);
  });

  it("handles 1% rate for 1 year", () => {
    expect(futureValueLump(1000, 1, 1)).toBeCloseTo(1010, 0);
  });
});

describe("futureValueRecurring", () => {
  it("calculates recurring FV correctly (Zomato 450 × 4/week)", () => {
    // Yearly spend = 450 × 52 × 4 = 93600; PMT = 7800/month
    const fv = futureValueRecurring(450, "weekly", 4, 12, 10);
    expect(fv).toBeGreaterThan(1_000_000); // should be substantial
    expect(fv).toBeLessThan(50_000_000);
  });

  it("handles 0% rate without dividing by zero", () => {
    // PMT = 20 * 365 / 12 ≈ 608.33; over 5 years = 608.33 * 60 ≈ 36500
    const fv = futureValueRecurring(20, "daily", 1, 0, 5);
    const yearly = yearlyCost(20, "daily", 1);
    const expected = (yearly / 12) * 12 * 5;
    expect(fv).toBeCloseTo(expected, 0);
  });

  it("increases as years increase", () => {
    const fv5 = futureValueRecurring(1000, "monthly", 1, 12, 5);
    const fv10 = futureValueRecurring(1000, "monthly", 1, 12, 10);
    expect(fv10).toBeGreaterThan(fv5);
  });

  it("throws on negative rate", () => {
    expect(() => futureValueRecurring(100, "monthly", 1, -1, 5)).toThrow(
      RangeError
    );
  });
});

describe("yearlyCost", () => {
  it("daily chai 20 × 365 = 7300", () => {
    expect(yearlyCost(20, "daily", 1)).toBe(7300);
  });

  it("weekly 4 times = 52 × 4 = 208 times/year", () => {
    expect(yearlyCost(450, "weekly", 4)).toBe(450 * 52 * 4);
  });

  it("monthly 12 times = 12", () => {
    expect(yearlyCost(649, "monthly", 1)).toBe(649 * 12);
  });

  it("once is once", () => {
    expect(yearlyCost(4999, "once", 1)).toBe(4999);
  });
});

describe("futureHours", () => {
  it("is always greater than lifeHours when rate > 0", () => {
    const life = lifeHours(4999, PROFILE);
    const future = futureHours(4999, 12, 10, PROFILE);
    expect(future).toBeGreaterThan(life);
  });

  it("equals lifeHours when rate is 0 and years has no effect on lump sum at 0%", () => {
    const life = lifeHours(4999, PROFILE);
    const future = futureHours(4999, 0, 10, PROFILE);
    expect(future).toBeCloseTo(life, 0);
  });
});

describe("growthChartData", () => {
  it("generates correct number of data points", () => {
    const data = growthChartData(5000, 12, 10);
    expect(data).toHaveLength(11); // 0 to 10 inclusive
  });

  it("year-0 invested equals the original price", () => {
    const data = growthChartData(5000, 12, 10);
    expect(data[0].invested).toBe(5000);
  });

  it("cost is always flat (lump sum already spent)", () => {
    const data = growthChartData(5000, 12, 10);
    data.forEach((d) => expect(d.cost).toBe(5000));
  });

  it("invested value grows over time (after year 0)", () => {
    const data = growthChartData(5000, 12, 10);
    for (let i = 2; i < data.length; i++) {
      expect(data[i].invested).toBeGreaterThan(data[i - 1].invested);
    }
  });
});
