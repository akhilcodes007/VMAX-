import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Edit3, Plus, AlertCircle } from "lucide-react";
import { useStore } from "../store/useStore";
import { i18n } from "../lib/i18n";
import type { ParsedItem } from "../lib/parse-schema";
import { lifeHours, yearlyCost, futureValueRecurring } from "../lib/math";
import { formatINR, formatCompact } from "../lib/format";

// Simple in-memory parse cache for deduplication
const parseCache = new Map<string, ParsedItem>();

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍔",
  shopping: "🛍️",
  travel: "✈️",
  entertainment: "🎬",
  bills: "📄",
  other: "📦",
};

export function SmartInput() {
  const { income, lang, sliderYears, sliderRate, addToCart } = useStore();
  const t = i18n[lang];

  const [text, setText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "parsing" | "confirming" | "error"
  >("idle");
  const [parsed, setParsed] = useState<ParsedItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [added, setAdded] = useState(false);

  async function doParse(input: string) {
    const cached = parseCache.get(input);
    if (cached) {
      setParsed(cached);
      setStatus("confirming");
      return;
    }

    setStatus("parsing");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "parse", text: input }),
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Parse failed");
      }

      const { data } = await res.json();
      parseCache.set(input, data as ParsedItem);
      setParsed(data as ParsedItem);
      setStatus("confirming");
    } catch (e) {
      setStatus("error");
      setErrorMsg(
        (e as Error).message.includes("timeout")
          ? t.smartInput.aiResting
          : ((e as Error).message ?? t.smartInput.aiResting)
      );
    }
  }

  function handleParse() {
    if (!text.trim()) return;
    doParse(text.trim());
  }

  function handleAddToCart() {
    if (!parsed) return;
    const hours = lifeHours(parsed.amount, income);
    addToCart({
      name: parsed.item,
      amount: parsed.amount,
      lifeHours: hours,
      frequency: parsed.frequency,
      timesPerPeriod: parsed.timesPerPeriod,
      category: parsed.category,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setStatus("idle");
      setText("");
      setParsed(null);
    }, 1500);
  }

  // Stats from parsed item
  const yearly = parsed
    ? yearlyCost(parsed.amount, parsed.frequency, parsed.timesPerPeriod)
    : 0;
  const yearlyHours = parsed ? lifeHours(yearly, income) : 0;

  const fv10 = parsed
    ? futureValueRecurring(
        parsed.amount,
        parsed.frequency,
        parsed.timesPerPeriod,
        sliderRate,
        sliderYears
      )
    : 0;

  return (
    <section className="py-10 px-4 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="glass rounded-3xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="gradient-text" />
          <h2 className="text-xl font-bold">{t.smartInput.title}</h2>
          <span
            className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(124,58,237,0.15)",
              color: "#A78BFA",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            AI
          </span>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleParse()}
            placeholder={t.smartInput.placeholder}
            disabled={status === "parsing"}
            maxLength={300}
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
            style={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(124,58,237,0.4)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--color-border)")
            }
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleParse}
            disabled={!text.trim() || status === "parsing"}
            className="px-5 py-3 rounded-2xl font-semibold text-sm text-white cursor-pointer disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
            }}
          >
            {status === "parsing" ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                {t.smartInput.parsing}
              </span>
            ) : (
              t.smartInput.parseBtn
            )}
          </motion.button>
        </div>

        {/* Skeleton loader */}
        <AnimatePresence>
          {status === "parsing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {[80, 60, 40].map((w, i) => (
                <div
                  key={i}
                  className="h-4 rounded-full animate-pulse"
                  style={{
                    width: `${w}%`,
                    background: "var(--color-surface-hover)",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-red-300">{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation */}
        <AnimatePresence>
          {status === "confirming" && parsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                {t.smartInput.confirm}
              </p>

              {/* Parsed chips row */}
              <div className="flex flex-wrap gap-2">
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    color: "#A78BFA",
                  }}
                >
                  {CATEGORY_EMOJI[parsed.category]} {parsed.item}
                </span>
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    color: "var(--color-amber)",
                  }}
                >
                  {formatINR(parsed.amount)}
                </span>
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {parsed.frequency === "once"
                    ? "one-time"
                    : `${parsed.timesPerPeriod}×/${parsed.frequency}`}
                </span>
              </div>

              {/* Yearly stats */}
              {parsed.frequency !== "once" && (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "rgba(245,158,11,0.06)",
                      border: "1px solid rgba(245,158,11,0.15)",
                    }}
                  >
                    <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                      Per year
                    </p>
                    <p
                      className="font-bold"
                      style={{ color: "var(--color-amber)" }}
                    >
                      {formatCompact(yearly)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      = {yearlyHours.toFixed(1)} hrs/yr
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "rgba(124,58,237,0.06)",
                      border: "1px solid rgba(124,58,237,0.15)",
                    }}
                  >
                    <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                      Invested over {sliderYears}yr
                    </p>
                    <p className="font-bold gradient-text">{formatCompact(fv10)}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      at {sliderRate}% CAGR
                    </p>
                  </div>
                </div>
              )}

              {/* Add / Edit buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  disabled={added}
                  className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: added
                      ? "#10B981"
                      : "linear-gradient(135deg, #7C3AED, #06B6D4)",
                  }}
                >
                  {added ? "✓ Added!" : <><Plus size={16} /> {t.smartInput.addBtn}</>}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setStatus("idle");
                    setParsed(null);
                  }}
                  className="px-4 py-3 rounded-2xl text-sm font-medium cursor-pointer"
                  style={{
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <Edit3 size={14} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
