/**
 * /api/ai.ts — Serverless & Dev-Server API for Gemini AI integration.
 * Works as:
 *  1. Vite dev server middleware via apiPlugin()
 *  2. Universal Vercel / Netlify / Node serverless endpoint via default export
 *
 * Environment variables:
 *   GEMINI_API_KEY — Google AI API key (Server-side ONLY, never exposed to client)
 *   GEMINI_MODEL   — Model override (default: gemini-2.5-flash)
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { ViteDevServer } from "vite";
import { ParsedItemSchema, type ParsedItem } from "../src/lib/parse-schema.ts";
import { formatINR } from "../src/lib/format.ts";

// ─── Rate Limiting (in-memory per-IP with automatic cleanup) ───────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT = 30; // 30 requests per minute per IP
const WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  // Periodic cleanup of expired entries
  if (rateLimitMap.size > 500) {
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Safe Environment Variable Loader ─────────────────────────────────────
function getEnvVar(name: string): string | undefined {
  if (process.env[name] && process.env[name]!.trim()) {
    return process.env[name]!.trim();
  }
  try {
    // Only in Node environment
    if (typeof process !== "undefined" && typeof process.cwd === "function") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("node:fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("node:path");
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed.startsWith(`${name}=`)) {
            const val = trimmed
              .slice(`${name}=`.length)
              .trim()
              .replace(/^["']|["']$/g, "");
            if (val) return val;
          }
        }
      }
    }
  } catch {
    // Ignore restricted/browser environments
  }
  return undefined;
}

// ─── Gemini Client Factory ────────────────────────────────────────────────
function getClient(): { ai: GoogleGenAI; model: string } | null {
  const apiKey = getEnvVar("GEMINI_API_KEY");
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  const model = getEnvVar("GEMINI_MODEL") || "gemini-2.5-flash";
  return {
    ai: new GoogleGenAI({ apiKey }),
    model,
  };
}

// ─── Gemini Structured Parse Schema ───────────────────────────────────────
const GEMINI_PARSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    item: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    frequency: {
      type: Type.STRING,
      enum: ["once", "daily", "weekly", "monthly", "yearly"],
    },
    timesPerPeriod: { type: Type.NUMBER },
    category: {
      type: Type.STRING,
      enum: ["food", "shopping", "travel", "entertainment", "bills", "other"],
    },
  },
  required: ["item", "amount", "frequency", "timesPerPeriod", "category"],
  propertyOrdering: ["item", "amount", "frequency", "timesPerPeriod", "category"],
};

// ─── Offline Heuristic Fallback Parser ────────────────────────────────────
export function parseWithHeuristics(input: string): ParsedItem {
  const clean = input.trim();
  const lower = clean.toLowerCase();

  // Extract amount
  const amountMatch =
    clean.match(/(?:₹|rs\.?|inr\s*)\s*([\d,]+(?:\.\d+)?)/i) ||
    clean.match(/([\d,]+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees|rupee)/i) ||
    clean.match(/\b(\d[\d,]*(?:\.\d+)?)\b/);

  let amount = 0;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    amount = 500;
  }

  // Extract frequency
  let frequency: ParsedItem["frequency"] = "once";
  let timesPerPeriod = 1;

  if (/\b(?:daily|every\s*day|per\s*day|a\s*day|dhina)\b/i.test(lower)) {
    frequency = "daily";
    timesPerPeriod = 1;
  } else if (/\b(?:weekly|per\s*week|a\s*week|vaaram|varam)\b/i.test(lower)) {
    frequency = "weekly";
    if (/\b(?:twice|2\s*times|two\s*times)\b/i.test(lower)) timesPerPeriod = 2;
    else if (/\b(?:thrice|3\s*times|three\s*times)\b/i.test(lower)) timesPerPeriod = 3;
    else if (/\b(?:4\s*times|four\s*times)\b/i.test(lower)) timesPerPeriod = 4;
    else if (/\b(?:5\s*times|five\s*times)\b/i.test(lower)) timesPerPeriod = 5;
    else {
      const m = lower.match(/(\d+)\s*times/);
      if (m) timesPerPeriod = parseInt(m[1], 10) || 1;
    }
  } else if (/\b(?:monthly|per\s*month|a\s*month|har\s*mahine|maatham)\b/i.test(lower)) {
    frequency = "monthly";
    timesPerPeriod = 1;
  } else if (/\b(?:yearly|per\s*year|a\s*year|annual|varudam)\b/i.test(lower)) {
    frequency = "yearly";
    timesPerPeriod = 1;
  }

  // Category detection
  let category: ParsedItem["category"] = "other";
  if (
    /(?:food|swiggy|zomato|chai|coffee|tea|dinner|lunch|breakfast|pizza|burger|biryani|snack|restaurant|hotel|drink|eat)/i.test(
      lower
    )
  ) {
    category = "food";
  } else if (
    /(?:shoe|sneaker|cloth|dress|shirt|pant|watch|phone|laptop|mobile|gadget|shopping|amazon|flipkart|zara|myntra|bag)/i.test(
      lower
    )
  ) {
    category = "shopping";
  } else if (
    /(?:uber|ola|rapido|cab|taxi|flight|train|bus|metro|petrol|diesel|fuel|travel|ticket)/i.test(
      lower
    )
  ) {
    category = "travel";
  } else if (
    /(?:netflix|movie|cinema|film|spotify|prime|youtube|game|gaming|concert|show|theatre)/i.test(
      lower
    )
  ) {
    category = "entertainment";
  } else if (
    /(?:gym|rent|bill|electricity|water|wifi|broadband|recharge|maintenance|emi|loan|insurance)/i.test(
      lower
    )
  ) {
    category = "bills";
  }

  // Item name cleanup
  let itemName = clean
    .replace(/(?:₹|rs\.?|inr|rupees|rupee)/gi, "")
    .replace(/[\d,]+(?:\.\d+)?/g, "")
    .replace(
      /\b(?:daily|every\s*day|per\s*day|a\s*day|weekly|per\s*week|a\s*week|monthly|per\s*month|a\s*month|yearly|per\s*year|twice|thrice|\d+\s*times|har\s*mahine|times|four|three|two|one)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!itemName || itemName.length < 2) {
    itemName =
      category !== "other"
        ? category.charAt(0).toUpperCase() + category.slice(1)
        : "Purchase";
  }

  return {
    item: itemName.slice(0, 50),
    amount: Math.round(amount),
    frequency,
    timesPerPeriod,
    category,
  };
}

// ─── Offline Heuristic Fallback Verdict Generator ─────────────────────────
export function generateHeuristicVerdict(params: {
  item: string;
  amount: number;
  lifeHours: number;
  hoursPerDay?: number;
  sliderYears?: number;
  sliderRate?: number;
  futureValue?: number;
  futureFreedomHours?: number;
  lang?: "en" | "ta";
  context?: string;
}): { text: string; alternative: { name: string; price: number } } {
  const isTamil = params.lang === "ta";
  const hours = params.lifeHours;
  const shifts = (hours / (params.hoursPerDay || 8)).toFixed(1);
  const years = params.sliderYears || 10;
  const rate = params.sliderRate || 12;
  const fv = params.futureValue || params.amount * Math.pow(1 + rate / 100, years);
  const freedomHours = params.futureFreedomHours || (hours * fv) / (params.amount || 1);

  let text = "";
  let altName = `Smart alternative to ${params.item}`;
  let altPrice = Math.max(Math.round(params.amount * 0.45), 50);

  if (hours <= 2) {
    if (isTamil) {
      text = `'${params.item}' வாங்க உங்கள் வாழ்க்கையின் ${hours.toFixed(1)} மணிநேரம் மட்டுமே தேவைப்படுகிறது. இது உங்களுக்கு அத்தியாவசிய பயனையோ அல்லது உண்மையான மகிழ்ச்சியையோ அளித்தால், உங்கள் மாதாந்திர பட்ஜெட்டில் இது முற்றிலும் ஏற்றுக்கொள்ளக்கூடிய செலவு.`;
      altName = `${params.item} (சேமிப்பு மாற்று)`;
    } else {
      text = `At ${hours.toFixed(1)} life-hours, '${params.item}' takes a minor fraction of your monthly working hours. If it brings genuine utility, happiness, or saves you time, this fits comfortably within a healthy discretionary spending budget.`;
      altName = `Value alternative to ${params.item}`;
    }
  } else if (hours <= 16) {
    if (isTamil) {
      text = `'${params.item}' வாங்க உங்கள் ${hours.toFixed(1)} மணி நேர உழைப்பு (~${shifts} வேலை ஷிப்ட்) செலவாகிறது. இது ஒரு குறிப்பிடத்தக்க ஈடுபாடு. உடனடி ஆசையை தவிர்க்க 24 மணி நேரம் யோசித்து முடிவெடுப்பது உங்கள் உழைப்பைப் பாதுகாக்கும். முதலீடு செய்தால் 10 ஆண்டுகளில் இது ${formatINR(fv)} ஆக வளரக்கூடும் (சந்தை வருவாய் உத்தரவாதம் அல்ல).`;
      altName = `மலிவான தரம் வாய்ந்த மாற்று`;
    } else {
      text = `'${params.item}' costs ${hours.toFixed(1)} hours of your labor (~${shifts} full work shifts). That is a meaningful trade of your energy. Consider giving it a 24-hour cooling-off rule to confirm true utility. Invested instead, this same amount could compound to ~${formatINR(fv)} in ${years} years (note: market returns are projections, not guarantees).`;
      altName = `Refurbished / Mid-tier ${params.item}`;
    }
  } else {
    if (isTamil) {
      text = `'${params.item}' வாங்க உங்கள் வாழ்க்கையின் ${hours.toFixed(1)} மணி நேரங்களை (~${shifts} முழு வேலை நாட்கள்) தியாகம் செய்ய வேண்டும். இதை வாங்குவதற்குப் பதில் ${years} ஆண்டுகள் ${rate}% வருவாயில் முதலீடு செய்தால், இது சுமார் ${formatINR(fv)} ஆக வளர்ந்து உங்கள் ஓய்வுக்காலத்தில் ~${freedomHours.toFixed(0)} மணி நேர நிதி சுதந்திரத்தை வழங்கும். இது ஒரு அனுமானம் மட்டுமே, உத்தரவாதம் அல்ல.`;
      altName = `பயன்படுத்திய அல்லது அடிப்படை மாதிரி`;
    } else {
      text = `'${params.item}' requires trading ${hours.toFixed(1)} hours of your finite life (${shifts} full work days). Before committing this much of your career, consider that investing this amount at an estimated ${rate}% over ${years} years could yield ~${formatINR(fv)}, buying you back ~${freedomHours.toFixed(0)} hours of true retirement freedom. (Assumption based on long-term equity averages, not a guaranteed return).`;
      altName = `Pre-owned / Open-box alternative`;
      altPrice = Math.max(Math.round(params.amount * 0.35), 100);
    }
  }

  return {
    text,
    alternative: {
      name: altName,
      price: altPrice,
    },
  };
}

// ─── Format Multi-Turn Chat Contents for Gemini ───────────────────────────
function formatContentsForGemini(
  history: Array<{ role: string; content: string }>,
  currentPrompt: string
): Array<{ role: "user" | "model"; parts: [{ text: string }] }> {
  const contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

  for (const msg of history) {
    if (!msg || typeof msg.content !== "string" || !msg.content.trim()) continue;
    const role: "user" | "model" =
      msg.role === "assistant" || msg.role === "model" ? "model" : "user";
    if (contents.length === 0 && role === "model") {
      continue;
    }
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n${msg.content.slice(0, 1000)}`;
    } else {
      contents.push({ role, parts: [{ text: msg.content.slice(0, 1000) }] });
    }
  }

  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text += `\n${currentPrompt}`;
  } else {
    contents.push({ role: "user", parts: [{ text: currentPrompt }] });
  }

  return contents;
}

// ─── Main Request Handler ─────────────────────────────────────────────────
export async function handleRequest(req: Request): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  // Rate Limiting by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      { status: 429, headers }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers,
    });
  }

  const mode = body.mode as string;
  if (!mode || (mode !== "parse" && mode !== "verdict")) {
    return new Response(
      JSON.stringify({ error: "Invalid mode. Must be 'parse' or 'verdict'." }),
      { status: 400, headers }
    );
  }

  // Input length sanitation
  const userText =
    typeof body.text === "string"
      ? body.text.slice(0, 300).trim()
      : typeof body.item === "string"
      ? body.item.slice(0, 200).trim()
      : "";

  if (!userText && mode === "parse") {
    return new Response(JSON.stringify({ error: "No input text provided" }), {
      status: 400,
      headers,
    });
  }

  const client = getClient();

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 1: PARSE (Extract structured details from natural language)
  // ═══════════════════════════════════════════════════════════════════════════
  if (mode === "parse") {
    // If no Gemini API key configured, use instant rule-based heuristic parser
    if (!client) {
      const fallbackParsed = parseWithHeuristics(userText);
      return new Response(
        JSON.stringify({ data: fallbackParsed, isFallback: true }),
        { status: 200, headers }
      );
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await client.ai.models.generateContent({
        model: client.model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extract purchase details from: "${userText}"`,
              },
            ],
          },
        ],
        config: {
          systemInstruction:
            "Extract purchase item name, numeric amount in INR, frequency (once, daily, weekly, monthly, yearly), timesPerPeriod, and category (food, shopping, travel, entertainment, bills, other). Return strictly conforming JSON.",
          temperature: 0.1,
          responseMimeType: "application/json",
          responseJsonSchema: GEMINI_PARSE_SCHEMA,
        },
      });

      clearTimeout(timeout);
      const raw = response.text;
      if (!raw) throw new Error("Empty AI response");

      const parsed = JSON.parse(raw);
      const validated = ParsedItemSchema.safeParse(parsed);
      if (!validated.success) {
        throw new Error("Validation failed: " + validated.error.message);
      }

      return new Response(
        JSON.stringify({ data: validated.data, isFallback: false }),
        { status: 200, headers }
      );
    } catch {
      // Graceful fallback to heuristic parser if AI fails or times out
      const fallbackParsed = parseWithHeuristics(userText);
      return new Response(
        JSON.stringify({ data: fallbackParsed, isFallback: true }),
        { status: 200, headers }
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 2: VERDICT (Streaming financial feedback & cheaper alternative)
  // ═══════════════════════════════════════════════════════════════════════════
  if (mode === "verdict") {
    const item = userText || "purchase";
    const amount = typeof body.amount === "number" ? body.amount : 0;
    if (isNaN(amount) || amount < 0 || amount > 10_00_00_000) {
      return new Response(
        JSON.stringify({ error: "Invalid amount. Must be between 0 and ₹10 Crore." }),
        { status: 400, headers }
      );
    }

    const lifeHoursVal =
      typeof body.lifeHours === "number" && !isNaN(body.lifeHours)
        ? Math.max(body.lifeHours, 0)
        : 0;
    const monthlyIncome =
      typeof body.monthlyIncome === "number" ? body.monthlyIncome : undefined;
    const hourlyRateVal =
      typeof body.hourlyRate === "number" ? body.hourlyRate : undefined;
    const workDays =
      typeof body.workDays === "number" ? body.workDays : undefined;
    const hoursPerDay =
      typeof body.hoursPerDay === "number" ? body.hoursPerDay : 8;
    const sliderYears =
      typeof body.sliderYears === "number" ? body.sliderYears : 10;
    const sliderRate =
      typeof body.sliderRate === "number" ? body.sliderRate : 12;
    const futureValue =
      typeof body.futureValue === "number" ? body.futureValue : undefined;
    const futureFreedomHours =
      typeof body.futureFreedomHours === "number"
        ? body.futureFreedomHours
        : undefined;
    const cartSummary =
      typeof body.cartSummary === "string" ? body.cartSummary.slice(0, 200) : "";
    const context =
      typeof body.context === "string" ? body.context.slice(0, 300) : "";
    const lang = body.lang === "ta" ? "ta" : "en";

    const history = Array.isArray(body.history)
      ? (body.history as Array<{ role: string; content: string }>)
      : [];

    const streamHeaders: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    };

    // Helper to stream offline heuristic verdict
    const streamFallback = (reason?: string): Response => {
      const heuristic = generateHeuristicVerdict({
        item,
        amount,
        lifeHours: lifeHoursVal,
        hoursPerDay,
        sliderYears,
        sliderRate,
        futureValue,
        futureFreedomHours,
        lang,
        context,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // Send metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                isFallback: true,
                fallbackReason: reason ?? "Offline mode",
              })}\n\n`
            )
          );

          // Stream words in small chunks
          const words = heuristic.text.split(" ");
          for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join(" ") + " ";
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            );
          }

          // Send alternative JSON
          const altJson = `\n{"alternative":${JSON.stringify(heuristic.alternative)}}`;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: altJson })}\n\n`)
          );
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(readable, { status: 200, headers: streamHeaders });
    };

    // If no client available, stream offline heuristic immediately
    if (!client) {
      return streamFallback("No GEMINI_API_KEY configured in environment");
    }

    // Prepare real Gemini prompt
    const systemInstruction = `You are TimeWorth's empathetic, pragmatic financial decision coach.
Your job is to help the user reflect on a potential purchase by translating money into life-hours and future financial freedom.

RULES:
1. Provide a concise, personalized verdict (2 to 4 sentences).
2. Acknowledge user's context (e.g. work necessity, impulse, reward, long-term health).
3. Mention one concrete, more affordable alternative that saves their life-hours.
4. Suggest one practical next step or saving habit (e.g. 24-48 hr rule, wishlist, SIP equivalent).
5. State clearly that future investment projections are hypothetical market assumptions, not guaranteed returns.
6. End with ONE structured budget alternative on a final line formatted strictly as JSON:
{"alternative":{"name":"<Alternative Name>","price":<estimated_rupees>}}
7. Respond warmly in ${lang === "ta" ? "Tamil (தமிழ்)" : "English"}. Never judge, lecture, or shame the user.
8. NEVER fabricate numbers — use only the verified calculations provided in the prompt.`;

    const userPromptParts: string[] = [
      `Purchase Item: "${item}"`,
      `Price: ₹${Math.round(amount).toLocaleString("en-IN")}`,
      `Life-hours required: ${lifeHoursVal.toFixed(1)} hours of labor (~${(lifeHoursVal / hoursPerDay).toFixed(1)} full work shifts)`,
    ];

    if (monthlyIncome && hourlyRateVal) {
      userPromptParts.push(
        `User Income Context: ₹${Math.round(monthlyIncome).toLocaleString("en-IN")}/month (Calculated hourly wage: ₹${Math.round(hourlyRateVal)}/hr, ${workDays || 22} days/mo, ${hoursPerDay} hrs/day)`
      );
    }

    if (futureValue) {
      userPromptParts.push(
        `Opportunity Cost if Invested (${sliderYears} yrs @ ${sliderRate}% expected return): ₹${Math.round(futureValue).toLocaleString("en-IN")} (= ${futureFreedomHours ? futureFreedomHours.toFixed(1) : (lifeHoursVal * 3).toFixed(1)} hours of future retirement freedom)`
      );
    }

    if (cartSummary) {
      userPromptParts.push(`Existing List / Committed Spending: ${cartSummary}`);
    }

    if (context) {
      userPromptParts.push(`User Note / Question: "${context}"`);
    }

    userPromptParts.push(
      "\nGive your personalized verdict, actionable advice, and suggest ONE budget alternative."
    );

    const userPrompt = userPromptParts.join("\n");
    const contents = formatContentsForGemini(history, userPrompt);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const stream = await client.ai.models.generateContentStream({
        model: client.model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 350,
        },
      });

      clearTimeout(timeout);

      const readable = new ReadableStream({
        async start(streamController) {
          const encoder = new TextEncoder();
          try {
            // Signal live Gemini model info
            streamController.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  model: client.model,
                  isFallback: false,
                })}\n\n`
              )
            );

            for await (const chunk of stream) {
              const text = chunk.text;
              if (text) {
                streamController.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            }
            streamController.enqueue(encoder.encode(`data: [DONE]\n\n`));
            streamController.close();
          } catch {
            streamController.enqueue(encoder.encode(`data: [DONE]\n\n`));
            streamController.close();
          }
        },
      });

      return new Response(readable, { status: 200, headers: streamHeaders });
    } catch (err: unknown) {
      clearTimeout(timeout);
      const errMsg = err instanceof Error ? err.message : String(err);
      let reason = "AI service temporarily unavailable";
      if (
        errMsg.includes("API_KEY") ||
        errMsg.includes("403") ||
        errMsg.includes("401")
      ) {
        reason = "Gemini API key is invalid or unauthorized";
      } else if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        reason = "Gemini API rate limit reached";
      }
      return streamFallback(reason);
    }
  }

  return new Response(JSON.stringify({ error: "Unknown mode" }), {
    status: 400,
    headers,
  });
}

// ─── Vite Dev Server Plugin ───────────────────────────────────────────────
export function apiPlugin() {
  return {
    name: "timeworth-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/ai", async (req, res) => {
        // Enforce max request body size (50KB)
        let totalSize = 0;
        const MAX_BODY_SIZE = 50 * 1024;
        let tooLarge = false;

        const chunks: Buffer[] = [];
        await new Promise<void>((resolve) => {
          req.on("data", (chunk: Buffer) => {
            totalSize += chunk.length;
            if (totalSize > MAX_BODY_SIZE) {
              tooLarge = true;
            } else {
              chunks.push(chunk);
            }
          });
          req.on("end", resolve);
        });

        if (tooLarge) {
          res.statusCode = 413;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Payload too large (max 50KB)" }));
          return;
        }

        const body = Buffer.concat(chunks).toString("utf-8");
        const url = `http://localhost${req.url}`;

        const fetchReq = new Request(url, {
          method: req.method,
          headers: req.headers as HeadersInit,
          body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : body,
        });

        const response = await handleRequest(fetchReq);

        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        if (response.body) {
          const reader = response.body.getReader();
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
      });
    },
  };
}

// ─── Universal Serverless Handler (Vercel / Netlify / Node / Edge) ────────
export default async function handler(req: any, res?: any) {
  if (!res || req instanceof Request) {
    return handleRequest(req);
  }

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve) => {
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", resolve);
  });
  const body = Buffer.concat(chunks).toString("utf-8");
  const url = `http://${req.headers.host || "localhost"}${req.url}`;

  const fetchReq = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method || "GET") ? undefined : body,
  });

  const response = await handleRequest(fetchReq);

  res.statusCode = response.status;
  response.headers.forEach((value: string, key: string) => {
    res.setHeader(key, value);
  });

  if (response.body) {
    const reader = response.body.getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
