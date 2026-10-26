/**
 * parse-schema.ts — Zod validation schema for AI parse responses.
 */
import { z } from "zod";

export const ParsedItemSchema = z.object({
  item: z.string().min(1).max(200),
  amount: z.number().positive().max(10_00_00_000),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "yearly"]),
  timesPerPeriod: z.number().positive().max(1000).default(1),
  category: z.enum([
    "food",
    "shopping",
    "travel",
    "entertainment",
    "bills",
    "other",
  ]),
});

export type ParsedItem = z.infer<typeof ParsedItemSchema>;

export const VerdictSchema = z.object({
  verdict: z.string().min(1).max(500),
  alternative: z.object({
    name: z.string(),
    price: z.number().positive(),
  }),
});

export type Verdict = z.infer<typeof VerdictSchema>;
