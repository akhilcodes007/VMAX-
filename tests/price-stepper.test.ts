import { describe, it, expect } from "vitest";

// Stepper pure helper logic to verify specification compliance
const PRICE_STEP = 100;
const MAX_PRICE = 100_000_000; // ₹10 Crore

function calculateNextPrice(
  currentRaw: string,
  direction: "increment" | "decrement"
): { nextRaw: string; nextPrice: number } {
  const current = parseFloat(currentRaw.replace(/,/g, "")) || 0;
  let next = 0;
  if (direction === "increment") {
    next = Math.min(MAX_PRICE, current + PRICE_STEP);
  } else {
    next = Math.max(0, current - PRICE_STEP);
  }
  return {
    nextRaw: next === 0 ? "" : String(next),
    nextPrice: next,
  };
}

function parseManualEntry(input: string): { isValid: boolean; parsedPrice: number } {
  if (input === "") return { isValid: true, parsedPrice: 0 };
  const num = parseFloat(input.replace(/,/g, ""));
  if (isNaN(num) || num < 0 || num > MAX_PRICE) {
    return { isValid: false, parsedPrice: 0 };
  }
  return { isValid: true, parsedPrice: num };
}

function parsePresetChip(chipText: string): { name: string; amount: number } {
  const match = chipText.match(/₹([\d,]+)/);
  const amount = match ? parseFloat(match[1].replace(/,/g, "")) : 0;
  const name = chipText.replace(/₹[\d,]+\s*/, "").trim();
  return { name, amount };
}

describe("Custom Price Control — Stepper & Validation Logic", () => {
  describe("Increment functionality", () => {
    it("increments by configured step (₹100) from 0 or empty", () => {
      const res = calculateNextPrice("", "increment");
      expect(res.nextPrice).toBe(100);
      expect(res.nextRaw).toBe("100");
    });

    it("increments by ₹100 from an existing amount like ₹4,999", () => {
      const res = calculateNextPrice("4999", "increment");
      expect(res.nextPrice).toBe(5099);
      expect(res.nextRaw).toBe("5099");
    });

    it("increments multiple times accurately", () => {
      let state = "100";
      for (let i = 0; i < 5; i++) {
        state = calculateNextPrice(state, "increment").nextRaw;
      }
      expect(state).toBe("600");
    });

    it("respects upper boundary cap of ₹10 Crore", () => {
      const res = calculateNextPrice("100000000", "increment");
      expect(res.nextPrice).toBe(MAX_PRICE);
    });
  });

  describe("Decrement functionality & Minimum value enforcement", () => {
    it("decrements by ₹100 from an existing price", () => {
      const res = calculateNextPrice("4999", "decrement");
      expect(res.nextPrice).toBe(4899);
      expect(res.nextRaw).toBe("4899");
    });

    it("clamps at ₹0 and never yields negative values", () => {
      const res = calculateNextPrice("50", "decrement");
      expect(res.nextPrice).toBe(0);
      expect(res.nextRaw).toBe(""); // empty placeholder when 0
    });

    it("remains at 0 when decrementing from 0", () => {
      const res = calculateNextPrice("0", "decrement");
      expect(res.nextPrice).toBe(0);
      expect(res.nextRaw).toBe("");
    });
  });

  describe("Manual entry validation", () => {
    it("accepts valid integer inputs", () => {
      const res = parseManualEntry("4999");
      expect(res.isValid).toBe(true);
      expect(res.parsedPrice).toBe(4999);
    });

    it("accepts comma-separated Indian currency formats", () => {
      const res = parseManualEntry("1,20,000");
      expect(res.isValid).toBe(true);
      expect(res.parsedPrice).toBe(120000);
    });

    it("rejects negative numbers", () => {
      const res = parseManualEntry("-500");
      expect(res.isValid).toBe(false);
    });

    it("rejects numbers exceeding ₹10 Crore", () => {
      const res = parseManualEntry("200000000");
      expect(res.isValid).toBe(false);
    });
  });

  describe("Preset chip selection & immediate stepper integration", () => {
    it("correctly extracts amount and item name from English presets", () => {
      const p1 = parsePresetChip("₹4,999 sneakers");
      expect(p1.amount).toBe(4999);
      expect(p1.name).toBe("sneakers");

      const p2 = parsePresetChip("₹1,20,000 phone");
      expect(p2.amount).toBe(120000);
      expect(p2.name).toBe("phone");

      const p3 = parsePresetChip("₹450 Zomato");
      expect(p3.amount).toBe(450);
      expect(p3.name).toBe("Zomato");
    });

    it("correctly extracts amount and item name from Tamil presets", () => {
      const p1 = parsePresetChip("₹4,999 ஷூ");
      expect(p1.amount).toBe(4999);
      expect(p1.name).toBe("ஷூ");

      const p2 = parsePresetChip("₹1,20,000 போன்");
      expect(p2.amount).toBe(120000);
      expect(p2.name).toBe("போன்");

      const p3 = parsePresetChip("₹450 ஜோமாட்டோ");
      expect(p3.amount).toBe(450);
      expect(p3.name).toBe("ஜோமாட்டோ");
    });

    it("allows stepping down immediately after selecting preset", () => {
      const preset = parsePresetChip("₹4,999 sneakers");
      const stepped = calculateNextPrice(String(preset.amount), "decrement");
      expect(stepped.nextPrice).toBe(4899);
    });

    it("allows stepping up immediately after selecting preset", () => {
      const preset = parsePresetChip("₹450 Zomato");
      const stepped = calculateNextPrice(String(preset.amount), "increment");
      expect(stepped.nextPrice).toBe(550);
    });
  });
});
