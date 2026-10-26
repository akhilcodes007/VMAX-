import { describe, it, expect } from "vitest";
import {
  handleRequest,
  parseWithHeuristics,
  generateHeuristicVerdict,
} from "../api/ai";

describe("api/ai.ts — Backend & Heuristic Engine", () => {
  describe("parseWithHeuristics unit tests", () => {
    it("parses single purchase with simple amount", () => {
      const res = parseWithHeuristics("Nike shoes 4999");
      expect(res.item.toLowerCase()).toContain("nike");
      expect(res.amount).toBe(4999);
      expect(res.frequency).toBe("once");
      expect(res.timesPerPeriod).toBe(1);
      expect(res.category).toBe("shopping");
    });

    it("parses recurring weekly spend with frequency multiplier", () => {
      const res = parseWithHeuristics("Zomato ₹450 four times a week");
      expect(res.amount).toBe(450);
      expect(res.frequency).toBe("weekly");
      expect(res.timesPerPeriod).toBe(4);
      expect(res.category).toBe("food");
    });

    it("parses daily expense", () => {
      const res = parseWithHeuristics("daily chai 20 rupees");
      expect(res.amount).toBe(20);
      expect(res.frequency).toBe("daily");
      expect(res.timesPerPeriod).toBe(1);
      expect(res.category).toBe("food");
    });

    it("parses monthly gym subscription", () => {
      const res = parseWithHeuristics("gym 2000 per month");
      expect(res.amount).toBe(2000);
      expect(res.frequency).toBe("monthly");
      expect(res.timesPerPeriod).toBe(1);
      expect(res.category).toBe("bills");
    });

    it("parses large amounts with Indian comma grouping", () => {
      const res = parseWithHeuristics("new phone 1,20,000 rupees");
      expect(res.amount).toBe(120000);
      expect(res.frequency).toBe("once");
      expect(res.category).toBe("shopping");
    });
  });

  describe("generateHeuristicVerdict unit tests", () => {
    it("generates encouraging analysis for small purchases", () => {
      const result = generateHeuristicVerdict({
        item: "Chai",
        amount: 20,
        lifeHours: 0.1,
        lang: "en",
      });
      expect(result.text).toContain("minor fraction");
      expect(result.alternative.price).toBeGreaterThanOrEqual(20 * 0.3);
    });

    it("generates cautionary analysis for large purchases", () => {
      const result = generateHeuristicVerdict({
        item: "Gaming Laptop",
        amount: 90000,
        lifeHours: 320,
        sliderYears: 10,
        sliderRate: 12,
        lang: "en",
      });
      expect(result.text).toContain("finite life");
      expect(result.alternative.name).toBeTruthy();
      expect(result.alternative.price).toBeLessThan(90000);
    });

    it("generates culturally natural Tamil analysis when lang is 'ta'", () => {
      const result = generateHeuristicVerdict({
        item: "போன்",
        amount: 50000,
        lifeHours: 175,
        lang: "ta",
      });
      expect(result.text).toContain("வாழ்க்கையின்");
      expect(result.alternative.price).toBeLessThan(50000);
    });
  });

  describe("handleRequest API endpoint contracts", () => {
    it("handles OPTIONS preflight with 204 status", async () => {
      const req = new Request("http://localhost/api/ai", { method: "OPTIONS" });
      const res = await handleRequest(req);
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("rejects non-POST HTTP methods with 405", async () => {
      const req = new Request("http://localhost/api/ai", { method: "GET" });
      const res = await handleRequest(req);
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.error).toBe("Method not allowed");
    });

    it("rejects invalid JSON body with 400", async () => {
      const req = new Request("http://localhost/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{",
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON body");
    });

    it("rejects missing mode with 400", async () => {
      const req = new Request("http://localhost/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "swiggy 400" }),
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(400);
    });

    it("rejects unreasonable amount > ₹10 Crore with 400", async () => {
      const req = new Request("http://localhost/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "verdict",
          text: "Island",
          amount: 500_00_00_000, // 500 Crore
        }),
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("₹10 Crore");
    });

    it("parses input and returns 200 with structured item", async () => {
      const req = new Request("http://localhost/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "parse",
          text: "swiggy 400 twice a week",
        }),
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(200);
      const { data, isFallback } = await res.json();
      expect(data.amount).toBe(400);
      expect(data.frequency).toBe("weekly");
      expect(data.timesPerPeriod).toBe(2);
      expect(data.category).toBe("food");
      expect(typeof isFallback).toBe("boolean");
    });

    it("streams verdict via SSE with valid chunks and DONE terminator", async () => {
      const req = new Request("http://localhost/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "verdict",
          text: "Sneakers",
          amount: 4999,
          lifeHours: 17.6,
          lang: "en",
        }),
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/event-stream");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let streamContent = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamContent += decoder.decode(value);
      }

      expect(streamContent).toContain("data: ");
      expect(streamContent).toContain("[DONE]");
      expect(streamContent).toContain("alternative");
    });
  });
});
